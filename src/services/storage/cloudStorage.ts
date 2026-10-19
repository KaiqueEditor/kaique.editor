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

export interface AdminUserRow {
    id: string;
    email: string | null;
    role: 'admin' | 'user';
    created_at: string;
    carousels: number;
    last_edit: string | null;
    exports: number;
    slides: number;
    last_login: string | null;
    active_days: number;
}

export interface AdminDashboard {
    totals: { users: number; carousels: number; exports: number; slides: number; dau: number; wau: number; mau: number; new_users_30d: number };
    daily: { date: string; users: number }[];
    devices: { name: string; users: number }[];
    browsers: { name: string; users: number }[];
    users: AdminUserRow[];
}

export interface AdminAuditEntry {
    id: number;
    actor: string | null;
    action: string;
    target: string | null;
    detail: { email?: string; from?: string; to?: string };
    created_at: string;
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

    /**
     * Salva o carrossel aberto: atualiza o registro `carouselId` quando ele existe
     * na nuvem; senão cria um novo. (Antes sobrescrevia sempre o mais recente.)
     */
    async saveCarousel(
        userId: string,
        name: string,
        sections: Section[],
        config: ProjectConfig,
        thumbnailDataUrl?: string,
        carouselId?: string | null,
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

        const isCloudId = !!carouselId && /^[0-9a-f-]{36}$/i.test(carouselId);
        if (isCloudId) {
            const updatePayload: Record<string, unknown> = {
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
                .eq('id', carouselId)
                .eq('user_id', userId)
                .select()
                .maybeSingle();

            if (error) {
                console.error('[CloudStorage] save error:', error);
                return null;
            }
            if (data) return data as CloudCarousel;
            // Registro apagado em outro lugar: cai para criar um novo.
        }
        return this.createCarousel(userId, name, cleanSections, cleanConfig, thumbnailUrl);
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

    // ── Phase 4: User Management ─────────────────────────────────────────────

    /** Admin: altera o papel de um usuário. Devolve a mensagem de erro do banco, se houver. */
    async updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<string | null> {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
        return error ? error.message : null;
    }

    /** Admin: métricas agregadas no banco (função admin_dashboard, só admin). */
    async getAdminDashboard(): Promise<AdminDashboard> {
        const { data, error } = await supabase.rpc('admin_dashboard');
        if (error) throw new Error(error.message);
        return data as AdminDashboard;
    }

    /** Admin: últimas ações administrativas (tabela admin_audit). */
    async getAdminAudit(limit = 50): Promise<AdminAuditEntry[]> {
        const { data, error } = await supabase
            .from('admin_audit')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw new Error(error.message);
        return (data || []) as AdminAuditEntry[];
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
