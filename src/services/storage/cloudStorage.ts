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
    created_at: string;
    updated_at: string;
}

// ── CloudStorage (Supabase) ────────────────────────────────────────────────────

class CloudStorage {
    /** Salva ou atualiza o carrossel mais recente do usuário no cloud */
    async saveCarousel(
        userId: string,
        name: string,
        sections: Section[],
        config: ProjectConfig,
    ): Promise<CloudCarousel | null> {
        // Remove blobs pesados antes de salvar
        const cleanSections = sections.map(s => ({
            ...s,
            imageUrl: s.imageUrl?.startsWith('data:') ? undefined : s.imageUrl,
            videoUrl: undefined,
        }));

        const cleanConfig = {
            ...config,
            avatarUrl: config.avatarUrl?.startsWith('data:') ? '' : config.avatarUrl,
        };

        // Buscar o carrossel mais recente do usuário para atualizar
        const { data: existing } = await supabase
            .from('carousels')
            .select('id')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (existing) {
            // Atualiza o existente
            const { data, error } = await supabase
                .from('carousels')
                .update({
                    name,
                    sections: cleanSections,
                    config: cleanConfig,
                    slide_count: sections.length,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                console.error('[CloudStorage] save error:', error);
                return null;
            }
            return data as CloudCarousel;
        } else {
            // Primeiro save: insere novo
            return this.createCarousel(userId, name, sections, config);
        }
    }

    /** Insere um novo carrossel */
    async createCarousel(
        userId: string,
        name: string,
        sections: Section[],
        config: ProjectConfig,
    ): Promise<CloudCarousel | null> {
        const cleanSections = sections.map(s => ({
            ...s,
            imageUrl: s.imageUrl?.startsWith('data:') ? undefined : s.imageUrl,
            videoUrl: undefined,
        }));

        const { data, error } = await supabase
            .from('carousels')
            .insert({
                user_id: userId,
                name,
                sections: cleanSections,
                config: {
                    ...config,
                    avatarUrl: config.avatarUrl?.startsWith('data:') ? '' : config.avatarUrl,
                },
                slide_count: sections.length,
            })
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
