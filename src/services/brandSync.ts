/**
 * Marca do usuário na nuvem (tabela user_brand): nome, @, marca d'água, foto e
 * fontes padrão ficam iguais no computador e no celular.
 *
 * - Ao entrar: se a nuvem tem marca, ela vale; se não tem e o aparelho tem, o
 *   aparelho sobe a dele (assim quem já configurou no computador não perde nada).
 * - Ao editar a marca (Minha marca, Perfil do post, foto): salva com atraso curto.
 */
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { cloudStorage } from './storage/cloudStorage';
import type { BrandDefaults } from '../store/slices/editorSlice';

interface BrandData {
  branding?: string;
  handle?: string;
  watermark?: string;
  avatarUrl?: string;
  defaults?: BrandDefaults;
}

let currentUser: string | null = null;
let syncedUser: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

const isPlaceholderAvatar = (url?: string) => !url || url.startsWith('data:image/svg+xml');

function snapshot(): BrandData {
  const { config, brandDefaults } = useStore.getState();
  return {
    branding: config.branding || '',
    handle: config.handle || '',
    watermark: config.watermark || '',
    avatarUrl: isPlaceholderAvatar(config.avatarUrl) ? '' : config.avatarUrl,
    defaults: brandDefaults,
  };
}

const hasAnything = (d: BrandData) =>
  !!(d.branding || d.handle || d.watermark || d.avatarUrl || d.defaults?.titleFont || d.defaults?.bodyFont || d.defaults?.titleColor);

async function save(userId: string) {
  const data = snapshot();
  // foto em base64 vai para o Storage; na tabela fica só a URL
  if (data.avatarUrl?.startsWith('data:')) {
    const url = await cloudStorage.uploadAvatar(userId, data.avatarUrl).catch(() => undefined);
    data.avatarUrl = url ?? '';
    if (url) useStore.getState().updateConfig({ avatarUrl: url });
  }
  const { error } = await supabase.from('user_brand').upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  if (error) console.warn('[brand] não salvou na nuvem:', error.message);
}

/** Pede para salvar a marca (junta várias edições seguidas num só envio). */
export function scheduleBrandSave() {
  if (!currentUser) return;
  const userId = currentUser;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; void save(userId); }, 1200);
}

/** Ao entrar: traz a marca da nuvem, ou sobe a deste aparelho se a nuvem estiver vazia. */
export async function syncBrandOnLogin(userId: string) {
  currentUser = userId;
  // a sessão é reemitida ao renovar o token: sincroniza só uma vez por carregamento
  if (syncedUser === userId) return;
  syncedUser = userId;
  const { data, error } = await supabase.from('user_brand').select('data').eq('user_id', userId).maybeSingle();
  if (error) { console.warn('[brand] não carregou da nuvem:', error.message); return; }
  const cloud = (data?.data ?? {}) as BrandData;
  if (hasAnything(cloud)) {
    const st = useStore.getState();
    st.updateConfig({
      ...(cloud.branding !== undefined ? { branding: cloud.branding } : {}),
      ...(cloud.handle !== undefined ? { handle: cloud.handle } : {}),
      ...(cloud.watermark !== undefined ? { watermark: cloud.watermark } : {}),
      ...(cloud.avatarUrl ? { avatarUrl: cloud.avatarUrl } : {}),
    });
    if (cloud.defaults) st.setBrandDefaults(cloud.defaults);
    return;
  }
  if (hasAnything(snapshot())) await save(userId);
}

export function clearBrandUser() {
  currentUser = null;
  syncedUser = null;
  if (timer) { clearTimeout(timer); timer = null; }
}
