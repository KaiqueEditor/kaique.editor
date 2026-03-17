import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── Role Types ─────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'creator' | 'viewer';

export type Permission =
    | 'view_analytics'
    | 'manage_users'
    | 'upload_assets'
    | 'delete_any_carousel'
    | 'view_global_gallery'
    | 'export_carousel'
    | 'create_carousel';

// ── Permission Matrix ──────────────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    admin: [
        'view_analytics',
        'manage_users',
        'upload_assets',
        'delete_any_carousel',
        'view_global_gallery',
        'export_carousel',
        'create_carousel',
    ],
    creator: [
        'view_global_gallery',
        'export_carousel',
        'create_carousel',
    ],
    viewer: [
        'view_global_gallery',
    ],
};

/** Check if a role has a specific permission */
export function hasPermission(role: UserRole, action: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

/** Get all permissions for a role */
export function getPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}

/** Role display labels */
export const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrador',
    creator: 'Criador',
    viewer: 'Visualizador',
};

/** Role badge colors */
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
    admin: { bg: '#FFD93D', text: '#000000' },
    creator: { bg: '#00E5C3', text: '#000000' },
    viewer: { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)' },
};

// ── Cache ──────────────────────────────────────────────────────────────────────
let cachedRole: UserRole | null = null;

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [userRole, setUserRole] = useState<UserRole>('creator');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            if (cachedRole !== null) {
                setIsAdmin(cachedRole === 'admin');
                setUserRole(cachedRole);
                setLoading(false);
                return;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsAdmin(false);
                    setUserRole('viewer');
                    setLoading(false);
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const role = (profile?.role as UserRole) || 'creator';
                cachedRole = role;
                setIsAdmin(role === 'admin');
                setUserRole(role);
            } catch {
                setIsAdmin(false);
                setUserRole('creator');
            }
            setLoading(false);
        };

        checkAdmin();
    }, []);

    return { isAdmin, userRole, loading, hasPermission: (action: Permission) => hasPermission(userRole, action) };
}

/** Limpa o cache de role (usar no logout) */
export function clearAdminCache() {
    cachedRole = null;
}
