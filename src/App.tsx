import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { clearAdminCache, fetchRole } from './hooks/useAdmin';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './components/auth/LoginPage';
import { supabase } from './lib/supabase';
import { useStore } from './store';
import { cloudStorage } from './services/storage/cloudStorage';
import { CarrosselApp } from './screens/EditorScreen';
import { UIKit } from './screens/UIKit';
import { DomainMove } from './features/move/DomainMove';
import { isOldHost, newHostReady } from './lib/domainMove';

// ── Aplicação Autenticada ───────────────────────────────────────────────────────

let loggedLoginFor: string | null = null;

export default function App() {
  const theme = useStore(state => state.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [moveReady, setMoveReady] = useState(false);

  useEffect(() => {
    if (isOldHost()) newHostReady().then(setMoveReady);
  }, []);

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
      // store.isAdmin só libera as fontes PRO na interface: admins do banco + contas
      // com acesso PRO. O painel admin usa useAdmin (papel no banco + RLS).
      const proEmails = ['kaiqueseditor@gmail.com', 'agente.kaique@gmail.com'];
      useStore.getState().setAdmin(proEmails.includes(email.toLowerCase()));
      fetchRole().then(r => { if (r === 'admin') useStore.getState().setAdmin(true); }).catch(() => {});
      useStore.getState().setUserEmail(email || null);

      // Registra o login uma vez por carregamento (o Supabase reemite eventos de sessão
      // ao renovar o token e ao voltar para a aba).
      if (loggedLoginFor !== session.user.id) {
        loggedLoginFor = session.user.id;
        cloudStorage.logLogin(session.user.id, email).catch(() => {});
      }
    } else {
      useStore.getState().setAdmin(false);
      useStore.getState().setUserEmail(null);
    }
  }, [session]);

  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('kit')) {
    return <UIKit />;
  }
  // Pré-visualização da tela de login sem sair da conta (só em dev): /?login
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('login')) {
    return <LoginPage onLogin={() => window.location.assign('/')} />;
  }

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-bg text-fg" role="status" aria-label="Carregando">
        <span className="text-title3 font-semibold tracking-tight">Carrossel<span className="text-brand">.</span>Pro</span>
        <Loader2 className="animate-spin text-muted" size={20} aria-hidden="true" />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: 'glass-strong',
            style: { background: undefined, color: 'rgb(var(--c-text))', borderRadius: '999px', padding: '8px 16px', fontWeight: 500, fontSize: '15px' },
          }}
        />
        <LoginPage onLogin={(user) => setSession({ user })} />
      </>
    );
  }

  // Endereço antigo: leva projetos e sessão para procarrossel.com.br (só quando ele já responde)
  if (moveReady) return <DomainMove userId={session.user.id} />;

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
