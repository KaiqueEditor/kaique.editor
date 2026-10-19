import type { Section } from '../types/carousel.types';
import { plainText } from '../utils/formatters';

/** Temas oficiais do X (claro, "dim" e preto) + um creme para marca pessoal. */
export interface XTheme { name: string; bg: string; text: string; secondary: string; border: string }

export const X_THEMES: XTheme[] = [
  { name: 'Claro', bg: '#ffffff', text: '#0f1419', secondary: '#536471', border: '#cfd9de' },
  { name: 'Dim', bg: '#15202b', text: '#f7f9f9', secondary: '#8b98a5', border: '#38444d' },
  { name: 'Preto', bg: '#000000', text: '#e7e9ea', secondary: '#71767b', border: '#2f3336' },
  { name: 'Creme', bg: '#faf7f2', text: '#1a1a1a', secondary: '#6b6258', border: '#e4ddd2' },
];

const luminance = (hex: string) => {
  const c = hex.replace('#', '');
  if (c.length < 6) return 1;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/** Cinza secundário e cor de borda que combinam com o fundo do post. */
export function xColors(bg: string): Pick<XTheme, 'secondary' | 'border'> {
  const known = X_THEMES.find(t => t.bg.toLowerCase() === bg.toLowerCase());
  if (known) return known;
  return luminance(bg) > 0.5
    ? { secondary: '#536471', border: '#cfd9de' }
    : { secondary: '#8b98a5', border: '#38444d' };
}

/** Estilo do tema aplicado a um slide. */
export const xThemeStyle = (t: XTheme): Partial<Section> => ({
  bgColor: t.bg, titleColor: t.text, bodyColor: t.text, brandingColor: t.text,
});

export const TWEET_LIMIT = 280;

/** Quantos caracteres o post teria no X (título + texto, sem marcações). */
export const tweetLength = (s: Pick<Section, 'title' | 'content'>) =>
  [plainText(s.title), plainText(s.content)].filter(Boolean).join('\n\n').length;

/** Corta um bloco grande em pedaços de até `limit` caracteres, respeitando frases. */
function chunk(block: string, limit: number): string[] {
  if (block.length <= limit) return [block];
  const sentences = block.match(/[^.!?…\n]+[.!?…]*\s*|\n/g) ?? [block];
  // tamanho-alvo equilibrado: evita sobrar um post curtinho no fim
  const target = Math.ceil(block.length / Math.ceil(block.length / limit));
  const out: string[] = [];
  let cur = '';
  for (const piece of sentences) {
    const full = (cur + piece).trim().length > limit || cur.trim().length >= target;
    if (full && cur.trim()) {
      out.push(cur.trim());
      cur = '';
    }
    if (piece.length > limit) {
      // frase sozinha maior que o limite: corta por palavras
      let line = '';
      for (const w of piece.split(/\s+/)) {
        if ((line + ' ' + w).trim().length > limit) { out.push(line.trim()); line = ''; }
        line += ' ' + w;
      }
      cur = line;
    } else {
      cur += piece;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * Texto longo → thread. Cada parágrafo (linha em branco) vira um post; parágrafos
 * maiores que 280 caracteres são divididos por frases. A primeira linha de cada post
 * vira o título.
 */
export function splitThread(raw: string, limit = TWEET_LIMIT): { title: string; content: string }[] {
  const blocks = raw.replace(/\r/g, '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  return blocks.flatMap(b => chunk(b, limit)).map(post => {
    const [first, ...rest] = post.split('\n');
    return { title: first.trim(), content: rest.join('\n').trim() };
  });
}
