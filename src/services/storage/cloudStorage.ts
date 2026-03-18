import { supabase } from '../../lib/supabase';
import { Section, ProjectConfig } from '../../types';
import { toast } from 'react-hot-toast';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface CloudCarousel {
    id: string;
    user_id: string;
    name: string;
    sections: Section[];
    config: ProjectConfig;
    slide_count: number;
    thumbnail_url?: string;
    created_at: string;
    updated_at: string;
}

// ── CloudStorage (Supabase) ────────────────────────────────────────────────────

class CloudStorage {
    /**
     * Upload a data: URL image to Supabase Storage and return the public URL.
     * Returns the original URL if it's already a remote URL.
     */
    private async uploadImageToStorage(
        userId: string,
        dataUrl: string,
        slideId: string,
    ): Promise<string | undefined> {
        if (!dataUrl) return undefined;
        // Already a remote URL — keep it
        if (!dataUrl.startsWith('data:')) return dataUrl;

        try {
            // More robust regex: handles image/jpeg, image/png, image/webp, image/svg+xml, etc.
            const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/s);
            if (!match) {
                console.warn('[CloudStorage] data URL regex did not match, trying split fallback');
                // Fallback: simple split
                const commaIdx = dataUrl.indexOf(',');
                if (commaIdx === -1) return undefined;
                const base64Data = dataUrl.slice(commaIdx + 1);
                if (!base64Data) return undefined;

                const byteString = atob(base64Data);
                const bytes = new Uint8Array(byteString.length);
                for (let i = 0; i < byteString.length; i++) {
                    bytes[i] = byteString.charCodeAt(i);
                }

                const fileName = `${userId}/${slideId}-${Date.now()}.png`;
                const { error: uploadError } = await supabase.storage
                    .from('carousel-images')
                    .upload(fileName, bytes, { contentType: 'image/png', upsert: true });

                if (uploadError) {
                    console.warn('[CloudStorage] image upload failed (fallback):', uploadError.message);
                    toast.error('Erro ao fazer upload da imagem. Verifique sua conexão.');
                    return undefined;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('carousel-images')
                    .getPublicUrl(fileName);
                return publicUrlData?.publicUrl || undefined;
            }

            const mimeType = match[1];
            const ext = mimeType.split('/')[1]?.replace('+xml', '') || 'png';
            const base64Data = match[2];

            // Convert base64 to Uint8Array
            const byteString = atob(base64Data);
            const bytes = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                bytes[i] = byteString.charCodeAt(i);
            }

            const fileName = `${userId}/${slideId}-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('carousel-images')
                .upload(fileName, bytes, {
                    contentType: mimeType,
                    upsert: true,
                });

            if (uploadError) {
                console.warn('[CloudStorage] image upload failed:', uploadError.message);
                toast.error('Erro ao fazer upload da imagem. Verifique sua conexão.');
                return undefined;
            }

            const { data: publicUrlData } = supabase.storage
                .from('carousel-images')
                .getPublicUrl(fileName);

            return publicUrlData?.publicUrl || undefined;
        } catch (err) {
            console.warn('[CloudStorage] image upload error:', err);
            return undefined;
        }
    }

    /**
     * Process sections: upload any data: images to Storage and return clean sections
     */
    private async processSectionsForCloud(
        userId: string,
        sections: Section[],
    ): Promise<Section[]> {
        const processed = await Promise.all(
            sections.map(async (s) => {
                let imageUrl = s.imageUrl;

                // Upload data: URLs to Supabase Storage
                if (imageUrl?.startsWith('data:')) {
                    const uploaded = await this.uploadImageToStorage(userId, imageUrl, s.id);
                    imageUrl = uploaded || undefined;
                }

                return {
                    ...s,
                    imageUrl,
                    videoUrl: undefined, // Videos are too heavy for cloud
                };
            })
        );
        return processed;
    }

    /** Salva ou atualiza o carrossel mais recente do usuário no cloud */
    async saveCarousel(
        userId: string,
        name: string,
        sections: Section[],
        config: ProjectConfig,
        thumbnailDataUrl?: string,
    ): Promise<CloudCarousel | null> {
        // Upload images to Storage and clean sections
        const cleanSections = await this.processSectionsForCloud(userId, sections);

        const cleanConfig = {
            ...config,
            avatarUrl: config.avatarUrl?.startsWith('data:')
                ? (await this.uploadImageToStorage(userId, config.avatarUrl, 'avatar')) || ''
                : config.avatarUrl,
        };

        // Upload thumbnail if provided
        let thumbnailUrl: string | undefined;
        if (thumbnailDataUrl?.startsWith('data:')) {
            thumbnailUrl = await this.uploadImageToStorage(userId, thumbnailDataUrl, 'thumb') || undefined;
        }

        // Buscar o carrossel mais recente do usuário para atualizar
        const { data: existing } = await supabase
            .from('carousels')
            .select('id')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (existing) {
            const updatePayload: any = {
                name,
                sections: cleanSections,
                config: cleanConfig,
                slide_count: sections.length,
                updated_at: new Date().toISOString(),
            };
            if (thumbnailUrl) updatePayload.thumbnail_url = thumbnailUrl;

            const { data, error } = await supabase
                .from('carousels')
                .update(updatePayload)
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                console.error('[CloudStorage] save error:', error);
                return null;
            }
            return data as CloudCarousel;
        } else {
            return this.createCarousel(userId, name, sections, config, thumbnailUrl);
        }
    }

    /** Insere um novo carrossel */
    async createCarousel(
        userId: string,
        name: string,
        sections: Section[],
        config: ProjectConfig,
        thumbnailUrl?: string,
    ): Promise<CloudCarousel | null> {
        // Upload images to Storage and clean sections
        const cleanSections = await this.processSectionsForCloud(userId, sections);

        const insertPayload: any = {
            user_id: userId,
            name,
            sections: cleanSections,
            config: {
                ...config,
                avatarUrl: config.avatarUrl?.startsWith('data:')
                    ? (await this.uploadImageToStorage(userId, config.avatarUrl, 'avatar')) || ''
                    : config.avatarUrl,
            },
            slide_count: sections.length,
        };
        if (thumbnailUrl) insertPayload.thumbnail_url = thumbnailUrl;

        const { data, error } = await supabase
            .from('carousels')
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            console.error('[CloudStorage] create error:', error);
            return null;
        }
        return data as CloudCarousel;
    }

    /** Lista carrosséis do usuário logado */
    async getUserCarousels(userId: string): Promise<CloudCarousel[]> {
        const { data, error } = await supabase
            .from('carousels')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[CloudStorage] getUserCarousels error:', error);
            return [];
        }
        return (data || []) as CloudCarousel[];
    }

    /** Admin: lista TODOS os carrosséis com email do autor */
    async getAllCarousels(): Promise<(CloudCarousel & { email?: string })[]> {
        const { data, error } = await supabase
            .from('carousels')
            .select('*, profiles!carousels_user_id_fkey(email)')
            .order('updated_at', { ascending: false });

        if (error) {
            // Fallback se o join falhar
            const { data: fallback } = await supabase
                .from('carousels')
                .select('*')
                .order('updated_at', { ascending: false });
            return (fallback || []) as CloudCarousel[];
        }
        return (data || []).map((c: any) => ({
            ...c,
            email: c.profiles?.email,
        }));
    }

    /** Deleta um carrossel */
    async deleteCarousel(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('carousels')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[CloudStorage] delete error:', error);
            return false;
        }
        return true;
    }

    /** Admin: busca estatísticas gerais */
    async getStats(): Promise<{
        totalUsers: number;
        totalCarousels: number;
        userRanking: {
            email: string;
            count: number;
            lastCreated: string;
            createdAt: string;
            lastActivity: string;
            role: string;
        }[];
    }> {
        // Total de perfis
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Total de carrosséis
        const { count: totalCarousels } = await supabase
            .from('carousels')
            .select('*', { count: 'exact', head: true });

        // Todos os perfis com data de cadastro e role
        const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, email, role, created_at')
            .order('created_at', { ascending: false });

        // Todos os carrosséis com email
        const { data: allCarousels } = await supabase
            .from('carousels')
            .select('user_id, created_at, updated_at, profiles!carousels_user_id_fkey(email)')
            .order('updated_at', { ascending: false });

        // Mapa de atividade por carrosséis
        const activityMap = new Map<string, { count: number; lastCreated: string; lastActivity: string }>();
        for (const c of (allCarousels || [])) {
            const userId = c.user_id;
            const existing = activityMap.get(userId);
            if (existing) {
                existing.count++;
                if (c.updated_at > existing.lastActivity) existing.lastActivity = c.updated_at;
            } else {
                activityMap.set(userId, {
                    count: 1,
                    lastCreated: c.created_at,
                    lastActivity: c.updated_at || c.created_at,
                });
            }
        }

        // Combinar perfis com atividade
        const userRanking = (allProfiles || []).map((p: any) => {
            const activity = activityMap.get(p.id);
            return {
                email: p.email || 'desconhecido',
                count: activity?.count || 0,
                lastCreated: activity?.lastCreated || p.created_at,
                createdAt: p.created_at,
                lastActivity: activity?.lastActivity || p.created_at,
                role: p.role || 'user',
            };
        }).sort((a, b) => b.count - a.count);

        return {
            totalUsers: totalUsers || 0,
            totalCarousels: totalCarousels || 0,
            userRanking,
        };
    }

    /** Loga um login no Supabase */
    async logLogin(userId: string, userEmail: string): Promise<void> {
        try {
            const ua = navigator.userAgent;
            const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
            const device = isMobile ? 'mobile' : 'desktop';
            let browser = 'outro';
            if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
            else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
            else if (ua.includes('Firefox')) browser = 'Firefox';
            else if (ua.includes('Edg')) browser = 'Edge';

            await supabase.from('login_logs').insert({
                user_id: userId,
                user_email: userEmail,
                device,
                browser,
            });
        } catch (err) {
            console.warn('[CloudStorage] logLogin error:', err);
        }
    }

    /** Retorna estatísticas de logins */
    async getLoginStats(): Promise<{
        totalLogins: number;
        deviceBreakdown: { device: string; count: number }[];
        browserBreakdown: { browser: string; count: number }[];
        loginsByUser: { email: string; count: number; lastLogin: string; device: string }[];
        dailyLogins: { date: string; count: number }[];
    }> {
        const { data, error } = await supabase
            .from('login_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !data) {
            return { totalLogins: 0, deviceBreakdown: [], browserBreakdown: [], loginsByUser: [], dailyLogins: [] };
        }

        // Device breakdown
        const deviceMap = new Map<string, number>();
        const browserMap = new Map<string, number>();
        const userMap = new Map<string, { email: string; count: number; lastLogin: string; device: string }>();
        const dailyMap = new Map<string, number>();

        for (const log of data) {
            // Device
            const dev = log.device || 'desktop';
            deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);
            // Browser
            const br = log.browser || 'outro';
            browserMap.set(br, (browserMap.get(br) || 0) + 1);
            // User
            const email = log.user_email || 'Usuário anônimo';
            const existing = userMap.get(email);
            if (existing) {
                existing.count += 1;
            } else {
                userMap.set(email, { email, count: 1, lastLogin: log.created_at, device: dev });
            }
            // Daily
            const day = log.created_at?.slice(0, 10) || '';
            if (day) dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
        }

        return {
            totalLogins: data.length,
            deviceBreakdown: Array.from(deviceMap.entries()).map(([device, count]) => ({ device, count })),
            browserBreakdown: Array.from(browserMap.entries()).map(([browser, count]) => ({ browser, count })),
            loginsByUser: Array.from(userMap.values()).sort((a, b) => b.count - a.count),
            dailyLogins: Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)).slice(-14),
        };
    }

    /** Loga um export (ZIP/PDF) no Supabase */
    async logExport(
        userId: string,
        userEmail: string,
        slideCount: number,
        carouselName: string,
        exportType: 'zip' | 'pdf' = 'zip',
    ): Promise<void> {
        try {
            await supabase.from('export_logs').insert({
                user_id: userId,
                user_email: userEmail,
                slide_count: slideCount,
                carousel_name: carouselName,
                export_type: exportType,
            });
        } catch (err) {
            console.warn('[CloudStorage] logExport error:', err);
        }
    }

    /** Retorna estatísticas de exports para o Analytics */
    async getExportStats(): Promise<{
        totalExports: number;
        totalSlides: number;
        exportsByUser: { email: string; count: number; slides: number; lastExport: string }[];
    }> {
        const { data, error } = await supabase
            .from('export_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !data) {
            return { totalExports: 0, totalSlides: 0, exportsByUser: [] };
        }

        const userMap = new Map<string, { email: string; count: number; slides: number; lastExport: string }>();
        let totalSlides = 0;

        for (const log of data) {
            totalSlides += log.slide_count || 0;
            const email = log.user_email || 'Usuário anônimo';
            const existing = userMap.get(email);
            if (existing) {
                existing.count += 1;
                existing.slides += log.slide_count || 0;
                if (log.created_at > existing.lastExport) existing.lastExport = log.created_at;
            } else {
                userMap.set(email, {
                    email,
                    count: 1,
                    slides: log.slide_count || 0,
                    lastExport: log.created_at,
                });
            }
        }

        return {
            totalExports: data.length,
            totalSlides,
            exportsByUser: Array.from(userMap.values()).sort((a, b) => b.count - a.count),
        };
    }
    // ── Phase 4: User Management ─────────────────────────────────────────────

    /** Admin: lista todos os perfis com role e métricas */
    async getAllUsers(): Promise<{
        id: string;
        email: string;
        role: string;
        created_at: string;
        last_sign_in_at?: string;
    }[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, role, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[CloudStorage] getAllUsers error:', error);
            return [];
        }

        return (data || []).map((p: any) => ({
            id: p.id,
            email: p.email || 'desconhecido',
            role: p.role || 'creator',
            created_at: p.created_at,
        }));
    }

    /** Admin: altera o role de um usuário */
    async updateUserRole(userId: string, newRole: string): Promise<boolean> {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            console.error('[CloudStorage] updateUserRole error:', error);
            return false;
        }
        return true;
    }

    /** Admin: métricas do sistema */
    async getSystemStats(): Promise<{
        totalProfiles: number;
        totalCarousels: number;
        totalLogins: number;
        totalExports: number;
        storageUsedMB: number;
    }> {
        const [profiles, carousels, logins, exports] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('carousels').select('*', { count: 'exact', head: true }),
            supabase.from('login_logs').select('*', { count: 'exact', head: true }),
            supabase.from('export_logs').select('*', { count: 'exact', head: true }),
        ]);

        return {
            totalProfiles: profiles.count || 0,
            totalCarousels: carousels.count || 0,
            totalLogins: logins.count || 0,
            totalExports: exports.count || 0,
            storageUsedMB: 0, // Supabase não expõe isso via client SDK
        };
    }

    // ── Phase 4: Global Assets Gallery ─────────────────────────────────────────

    /** Busca assets globais da plataforma */
    async getGlobalAssets(type?: 'font' | 'palette' | 'preset'): Promise<{
        id: string;
        name: string;
        type: string;
        data: any;
        preview_url?: string;
        created_at: string;
    }[]> {
        try {
            let query = supabase
                .from('platform_assets')
                .select('*')
                .order('created_at', { ascending: false });

            if (type) {
                query = query.eq('type', type);
            }

            const { data, error } = await query;

            if (error) {
                // Table might not exist yet — graceful fallback
                console.warn('[CloudStorage] getGlobalAssets:', error.message);
                return [];
            }

            return (data || []).map((a: any) => ({
                id: a.id,
                name: a.name || 'Sem nome',
                type: a.type || 'preset',
                data: a.data || {},
                preview_url: a.preview_url,
                created_at: a.created_at,
            }));
        } catch {
            return [];
        }
    }

    /** Admin: faz upload de um asset global */
    async uploadGlobalAsset(asset: {
        name: string;
        type: 'font' | 'palette' | 'preset';
        data: any;
        preview_url?: string;
    }): Promise<boolean> {
        try {
            const { error } = await supabase.from('platform_assets').insert({
                name: asset.name,
                type: asset.type,
                data: asset.data,
                preview_url: asset.preview_url,
            });

            if (error) {
                console.error('[CloudStorage] uploadGlobalAsset error:', error);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    /** Admin: deleta um asset global */
    async deleteGlobalAsset(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('platform_assets')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('[CloudStorage] deleteGlobalAsset error:', error);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }
}

export const cloudStorage = new CloudStorage();
