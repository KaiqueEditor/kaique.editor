/**
 * Mudança de endereço: kaique-editor.vercel.app → procarrossel.com.br.
 *
 * O navegador guarda login, preferências e projetos locais por endereço. Para o
 * usuário antigo não perder nada, o app no endereço antigo:
 *   1. envia para a nuvem os projetos que só existiam neste aparelho;
 *   2. leva as preferências (estilos, temas, marca, tema claro/escuro) no #cp_state;
 *   3. leva a sessão no # (o Supabase, em fluxo implicit, entra sozinho ao ler o #);
 *   4. apaga a sessão local antiga para ela não renovar o mesmo token em paralelo.
 * Este módulo é importado antes do App: a parte que aplica o #cp_state precisa
 * rodar antes da store (zustand persist) ler o localStorage.
 */
// Em desenvolvimento, /?oldhost simula o endereço antigo e "muda" para o próprio localhost.
const DEV_SIMULATION = import.meta.env.DEV && typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('oldhost');

export const NEW_ORIGIN = DEV_SIMULATION ? window.location.origin : 'https://procarrossel.com.br';

export const isOldHost = (host = window.location.hostname) =>
  DEV_SIMULATION || /^kaique-editor(-[a-z0-9-]+)?\.vercel\.app$/.test(host);

/**
 * O endereço novo já responde? Enquanto o DNS/SSL não estiver pronto, o
 * endereço antigo continua funcionando normalmente, sem redirecionar.
 */
export async function newHostReady(timeoutMs = 5000): Promise<boolean> {
  if (DEV_SIMULATION) return true;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // no-cors: só interessa se o servidor respondeu (falha de DNS/SSL rejeita).
    await fetch(`${NEW_ORIGIN}/manifest.json?probe=${Date.now()}`, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const CARRIED_KEYS = [
  'carrosselpro-store',
  'carrosselpro-custom-themes',
  'carrosselpro-onboarding-done',
  'myhub-theme',
] as const;

const toB64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

/** Preferências deste aparelho, prontas para viajar no endereço. */
export function packLocalState(): string {
  const data: Record<string, string> = {};
  for (const key of CARRIED_KEYS) {
    try {
      let value = localStorage.getItem(key);
      if (value === null) continue;
      if (key === 'carrosselpro-store') {
        // Os slides abertos não viajam (são grandes e já estão na nuvem).
        const parsed = JSON.parse(value);
        if (parsed?.state) parsed.state.sections = [];
        value = JSON.stringify(parsed);
      }
      data[key] = value;
    } catch { /* chave ilegível: ignora */ }
  }
  return toB64(JSON.stringify(data));
}

/** No endereço novo: grava as preferências recebidas, sem apagar as que já existem aqui. */
function applyCarriedState() {
  try {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const packed = hash.get('cp_state');
    if (!packed) return;
    const data = JSON.parse(fromB64(packed)) as Record<string, string>;
    for (const key of CARRIED_KEYS) {
      if (typeof data[key] === 'string' && localStorage.getItem(key) === null) {
        localStorage.setItem(key, data[key]);
      }
    }
  } catch { /* nada a aplicar */ }
}

/** Remove a sessão salva neste endereço sem avisar o servidor (a sessão continua no novo). */
export function dropLocalSession() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      .forEach(k => localStorage.removeItem(k));
  } catch { /* armazenamento indisponível */ }
}

if (typeof window !== 'undefined' && !isOldHost()) applyCarriedState();
