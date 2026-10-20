import type { Section } from '../types';
import { splitThread } from './xPost';
import type { BrandDefaults } from '../store/slices/editorSlice';

export type TextMode = 'feed' | 'x';

const BASE: Omit<Section, 'id' | 'title' | 'content' | 'imagePrompt'> = {
  alignment: 'left',
  layoutType: 'storytelling',
  titleFont: 'bebas-neue',
  bodyFont: 'sans',
  bgColor: '#000000',
  titleColor: '#ffffff',
  bodyColor: '#ffffff',
  brandingColor: '#ffffff',
  titleSize: 30,
  bodySize: 16,
  imagePosX: 50,
  imagePosY: 0,
  imageScale: 1,
  overlayOpacity: 0,
  textPosY: 70,
  showSocialImage: true,
};

const isTimePrimo = (email?: string | null) =>
  ['marcela.depaula@timeprimo.com', 'lorena.volpini@timeprimo.com'].includes(email?.toLowerCase() ?? '');
const isPro = (email?: string | null) =>
  ['kaiqueseditor@gmail.com', 'agente.kaique@gmail.com'].includes(email?.toLowerCase() ?? '');

/** Fontes padrão da conta (antes da marca): algumas contas têm fontes próprias. */
export const accountFonts = (email?: string | null) => ({
  titleFont: isTimePrimo(email) ? 'filson-pro-bold' : isPro(email) ? 'wide' : 'bebas-neue',
  bodyFont: isTimePrimo(email) ? 'open-sans' : isPro(email) ? 'montserrat' : 'sans',
});

/** Formato estruturado "texto 1", "texto 2"… (com ou sem traço). */
export const isStructuredRoteiro = (text: string) => /^texto\s+\d+/im.test(text);

/**
 * Converte um texto em slides, sem efeitos colaterais (usado pela criação e pela prévia).
 * - x: cada parágrafo vira um Post X (parágrafos longos são divididos por frase).
 * - feed com "texto N": capa = texto 1; depois cada par vira título + apoio.
 * - feed livre: cada parágrafo vira um slide (1ª linha = título).
 */
export function buildSectionsFromText(raw: string, mode: TextMode = 'feed', email?: string | null, brand: BrandDefaults = {}): Section[] {
  if (!raw.trim()) return [];
  const stamp = Date.now();
  // Ordem: fonte da marca (Minha marca) → fonte da conta → padrão do app
  const titleFont = brand.titleFont || accountFonts(email).titleFont;
  const bodyFont = brand.bodyFont || accountFonts(email).bodyFont;
  const titleColor = brand.titleColor || BASE.titleColor;

  if (mode === 'x') {
    return splitThread(raw).map((post, idx) => ({
      ...BASE,
      bgColor: '#ffffff',
      titleColor: '#0f1419',
      bodyColor: '#0f1419',
      brandingColor: '#0f1419',
      id: `x-${idx + 1}-${stamp}`,
      title: post.title,
      content: post.content,
      layoutType: 'social-post' as const,
      alignment: 'left' as const,
      titleFont: 'sans',
      bodyFont: 'sans',
      titleSize: 26,
      bodySize: 24,
      textPosY: 85,
      imagePosY: 50,
      showSocialImage: false,
    }));
  }

  if (isStructuredRoteiro(raw)) {
    // Aceita o texto na mesma linha ("texto 1 - Título") ou nas linhas de baixo
    const dataMap: Record<number, string> = {};
    let current: number | null = null;
    raw.replace(/\r/g, '').split('\n').forEach(line => {
      const match = line.match(/^\s*texto\s+(\d+)\s*[-–:]?\s*(.*)$/i);
      if (match) {
        current = parseInt(match[1]);
        dataMap[current] = match[2].trim();
      } else if (current !== null && line.trim()) {
        dataMap[current] = dataMap[current] ? `${dataMap[current]}\n${line.trim()}` : line.trim();
      }
    });
    const keys = Object.keys(dataMap).map(Number).sort((a, b) => a - b);
    if (keys.length === 0) return [];
    const out: Section[] = [];
    if (dataMap[1]) {
      // linha "Fontes: …" debaixo da capa vira o texto de apoio dela
      const coverLines = dataMap[1].split('\n');
      const sources = coverLines.filter(l => /^fontes?\s*:/i.test(l)).join(' ');
      const coverTitle = coverLines.filter(l => !/^fontes?\s*:/i.test(l)).join('\n');
      out.push({
        ...BASE, id: `s-1-${stamp}`, title: coverTitle, content: sources, imagePrompt: coverTitle,
        titleFont, bodyFont, titleColor, alignment: 'center', titleSize: 30, bodySize: 10, textPosY: 70,
      });
    }
    for (let i = 2; i <= keys[keys.length - 1]; i += 2) {
      if (dataMap[i] || dataMap[i + 1]) {
        out.push({
          ...BASE, id: `s-${i}-${stamp}`, title: dataMap[i] || '', content: dataMap[i + 1] || '',
          imagePrompt: `${dataMap[i]} ${dataMap[i + 1]}`, titleFont, bodyFont, titleColor,
        });
      }
    }
    return out;
  }

  return raw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map((block, idx) => {
    const [first, ...rest] = block.split('\n');
    return {
      ...BASE,
      id: `s-${idx + 1}-${stamp}`,
      title: first.trim(),
      content: rest.join(' ').trim(),
      imagePrompt: first.trim(),
      alignment: idx === 0 ? 'center' as const : 'left' as const,
      titleFont,
      bodyFont,
      titleColor,
      titleSize: 30,
      ...(idx === 0 ? { bodySize: 10 } : {}),
    };
  });
}
