import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { clearAdminCache } from './hooks/useAdmin';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './components/auth/LoginPage';
import { supabase } from './lib/supabase';
import { useStore } from './store';
import { cloudStorage } from './services/storage/cloudStorage';
import { CarrosselApp } from './screens/EditorScreen';
import { UIKit } from './screens/UIKit';

// ── Aplicação Autenticada ───────────────────────────────────────────────────────

export default function App() {
  const theme = useStore(state => state.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Initial session check — also picks up OAuth tokens from URL hash (#access_token=...)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);

      // If we got a session from hash params (OAuth redirect), clean up the URL
      if (session && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Event:', event, session?.user?.email);
      setSession(session);

      // OAuth redirect: when user returns from Google/GitHub, the session is picked up here
      if (event === 'SIGNED_IN' && session) {
        setAuthLoading(false);
        // Clean up the URL hash if present
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      const email = session.user.email ?? '';
      // Set admin flag based on email so font dropdowns show PRO fonts immediately
      const adminEmails = ['kaiqueseditor@gmail.com', 'agente.kaique@gmail.com'];
      useStore.getState().setAdmin(adminEmails.includes(email.toLowerCase()));
      useStore.getState().setUserEmail(email || null);

      // ── Migração de fontes ao fazer login ────────────────────────────────
      // Corrige seções salvas com fontes genéricas (anteriores à implementação de fontes por usuário)
      const isTimePrimoUser = email === 'marcela.depaula@timeprimo.com' || email === 'lorena.volpini@timeprimo.com';
      const isAdminUser = email === 'kaiqueseditor@gmail.com' || email === 'agente.kaique@gmail.com';
      if (isTimePrimoUser || isAdminUser) {
        const targetTitle = isTimePrimoUser ? 'filson-pro-bold' : 'wide';
        const targetBody  = isTimePrimoUser ? 'open-sans' : 'montserrat';
        // Fontes genéricas que indicam que o slide ainda não foi personalizado
        const genericTitles = new Set(['plus-jakarta', 'sans', 'bebas-neue', 'montserrat', 'wide', 'filson-pro-bold']);
        const genericBodies  = new Set(['sans', 'plus-jakarta', 'montserrat', 'open-sans', 'filson-pro-bold']);
        setTimeout(() => {
          const { sections, updateSection } = useStore.getState();
          sections.forEach(s => {
            const wTitle = !s.titleFont || genericTitles.has(s.titleFont);
            const wBody  = !s.bodyFont  || genericBodies.has(s.bodyFont);
            if (wTitle || wBody) {
              updateSection(s.id, {
                ...(wTitle ? { titleFont: targetTitle } : {}),
                ...(wBody  ? { bodyFont: targetBody }  : {}),
              });
            }
          });
        }, 800); // Aguarda a restauração do cloud/localStorage
      }
      // ────────────────────────────────────────────────────────────────────

      // Log login (best-effort)
      cloudStorage.logLogin(session.user.id, email).catch(() => {});
    } else {
      useStore.getState().setAdmin(false);
      useStore.getState().setUserEmail(null);
    }
  }, [session]);

  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('kit')) {
    return <UIKit />;
  }

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#000' }}>
        <Loader2 className="animate-spin text-[#00E5C3]" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(255,255,255,0.03)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              fontSize: '11px',
              fontFamily: 'Inter',
              fontWeight: 600,
              letterSpacing: '0.05em',
            },
          }}
        />
        <LoginPage onLogin={(user) => setSession({ user })} />
      </>
    );
  }

  return <CarrosselApp session={session} onLogout={async () => {
    clearAdminCache();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[Auth] signOut falhou, forçando reload:', e);
    }
    // Força reload para limpar qualquer estado residual
    window.location.reload();
  }} />;
}
