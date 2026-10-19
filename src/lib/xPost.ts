import type { Section } from '../types/carousel.types';
import { plainText } from '../utils/formatters';

/** Fonte padrão do Post X: Manrope, a mais próxima dos posts de referência. */
export const X_FONT_STACK = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

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
