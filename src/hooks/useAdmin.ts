import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Papéis aceitos pelo banco (check profiles_role_check): 'user' e 'admin'.
 * A permissão real é aplicada no Supabase (RLS + função is_admin());
 * este hook só decide o que mostrar na interface.
 */
export type UserRole = 'admin' | 'user';

export const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Admin',
    user: 'Criador',
};

let cachedRole: UserRole | null = null;

/** Lê o papel do usuário logado em profiles (uma vez por sessão). */
export async function fetchRole(): Promise<UserRole> {
    if (cachedRole) return cachedRole;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'user';
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    cachedRole = data?.role === 'admin' ? 'admin' : 'user';
    return cachedRole;
}

export function useAdmin() {
    const [role, setRole] = useState<UserRole>(cachedRole ?? 'user');
    const [loading, setLoading] = useState(cachedRole === null);

    useEffect(() => {
        let alive = true;
        fetchRole()
            .then(r => { if (alive) setRole(r); })
            .catch(() => { if (alive) setRole('user'); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    return { isAdmin: role === 'admin', userRole: role, loading };
}

/** Limpa o papel em cache (usar no logout). */
export function clearAdminCache() {
    cachedRole = null;
}
