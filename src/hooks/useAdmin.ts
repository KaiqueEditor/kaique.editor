import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

let cachedRole: string | null = null;

export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            if (cachedRole !== null) {
                setIsAdmin(cachedRole === 'admin');
                setLoading(false);
                return;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsAdmin(false);
                    setLoading(false);
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const role = profile?.role || 'user';
                cachedRole = role;
                setIsAdmin(role === 'admin');
            } catch {
                setIsAdmin(false);
            }
            setLoading(false);
        };

        checkAdmin();
    }, []);

    return { isAdmin, loading };
}

/** Limpa o cache de role (usar no logout) */
export function clearAdminCache() {
    cachedRole = null;
}
