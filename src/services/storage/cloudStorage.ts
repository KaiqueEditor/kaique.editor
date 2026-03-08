import { supabase } from '../../lib/supabase';
import type { Section, ProjectConfig } from '../../types/carousel.types';

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
            // Extract mime type and base64 content
            const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
            if (!match) return undefined;

            const mimeType = match[1];
            const ext = mimeType.split('/')[1] || 'png';
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
        userRanking: { email: string; count: number; lastCreated: string }[];
    }> {
        // Total de perfis
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Total de carrosséis
        const { count: totalCarousels } = await supabase
            .from('carousels')
            .select('*', { count: 'exact', head: true });

        // Todos os carrosséis com email
        const { data: allCarousels } = await supabase
            .from('carousels')
            .select('user_id, created_at, profiles!carousels_user_id_fkey(email)')
            .order('created_at', { ascending: false });

        // Ranking de usuários
        const userMap = new Map<string, { email: string; count: number; lastCreated: string }>();
        for (const c of (allCarousels || [])) {
            const email = (c as any).profiles?.email || 'desconhecido';
            const existing = userMap.get(email);
            if (existing) {
                existing.count++;
            } else {
                userMap.set(email, { email, count: 1, lastCreated: c.created_at });
            }
        }
        const userRanking = Array.from(userMap.values()).sort((a, b) => b.count - a.count);

        return {
            totalUsers: totalUsers || 0,
            totalCarousels: totalCarousels || 0,
            userRanking,
        };
    }
}

export const cloudStorage = new CloudStorage();
