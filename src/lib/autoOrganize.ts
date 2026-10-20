import type { TextMode } from './buildSections';

export interface Organized {
  roteiro: string;
  caption: string;
  model: string;
}

/** Teste local: só existe no servidor de desenvolvimento (a chave fica no Node). */
export const autoOrganizeAvailable = import.meta.env.DEV;

export async function autoOrganize(text: string, mode: TextMode): Promise<Organized> {
  const res = await fetch('/api/organize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `erro ${res.status}`);
  return data as Organized;
}
