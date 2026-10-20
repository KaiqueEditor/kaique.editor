import type { Section } from '../types/carousel.types';
import type { CarouselStarterTemplate } from '../constants/starterTemplates';

// ── Helper: cria uma Section vazia/default ──────────────────────────────────────
export const createDefaultSection = (index: number, userEmail?: string | null): Section => {
  const isTimePrimo = userEmail?.toLowerCase() === 'marcela.depaula@timeprimo.com' || userEmail?.toLowerCase() === 'lorena.volpini@timeprimo.com';
  const adminEmails = ['kaiqueseditor@gmail.com', 'agente.kaique@gmail.com'];
  const isAdmin = adminEmails.includes(userEmail?.toLowerCase() ?? '');

  return {
    id: `default-${Date.now()}-${index}`,
    title: index === 0 ? 'Título da Capa' : `Slide ${index + 1}`,
    content: index === 0 ? 'Comece editando este texto' : 'Adicione seu conteúdo aqui',
    alignment: 'center',
    layoutType: 'storytelling',
    titleFont: isTimePrimo ? 'filson-pro-bold' : isAdmin ? 'wide' : 'plus-jakarta',
    bodyFont: isTimePrimo ? 'open-sans' : isAdmin ? 'montserrat' : 'sans',
    titleColor: '#FFFFFF',
    bodyColor: '#e0e0e0',
    bgColor: '#1a1a2e',
    brandingColor: '#00E5C3',
    titleSize: 70,
    bodySize: 22,
    imagePosX: 50,
    imagePosY: 50,
    imageScale: 1,
    overlayOpacity: 0,
    textPosY: 70,
    showSocialImage: false,
  };
};

export const countSlidesFromText = (text: string): number => {
  const matches = text.match(/^texto\s+\d+/gim);
  if (!matches || matches.length === 0) return 0;
  const maxN = Math.max(...matches.map(m => parseInt(m.match(/\d+/)![0], 10)));
  if (maxN <= 0) return 0;
  // texto 1 = capa (1 slide); cada par seguinte = 1 slide
  return maxN === 1 ? 1 : 1 + Math.ceil((maxN - 1) / 2);
};

/** Quantos slides um roteiro vai gerar: formato "texto N" ou, senão, um por parágrafo. */
export const countSlidesPreview = (text: string): number => {
  if (!text.trim()) return 0;
  const structured = countSlidesFromText(text);
  if (structured > 0) return structured;
  return text.split(/\n\s*\n/).filter(b => b.trim()).length;
};

const isTimePrimoEmail = (email?: string | null) =>
  ['marcela.depaula@timeprimo.com', 'lorena.volpini@timeprimo.com'].includes(email?.toLowerCase() ?? '');

/** Converte um modelo pronto em slides editáveis. */
export const buildTemplateSections = (template: CarouselStarterTemplate, userEmail?: string | null): Section[] => {
  const isTimePrimo = isTimePrimoEmail(userEmail);
  return template.slides.map((slide, idx) => ({
    id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    title: slide.title || '',
    content: slide.content || '',
    alignment: slide.alignment || 'left',
    layoutType: slide.layoutType || 'storytelling',
    titleFont: isTimePrimo ? 'filson-pro-bold' : (slide.titleFont || 'bebas-neue'),
    bodyFont: isTimePrimo ? 'open-sans' : (slide.bodyFont || 'sans'),
    titleSize: slide.titleSize || 40,
    bodySize: slide.bodySize || 18,
    bgColor: slide.bgColor || '#000000',
    titleColor: slide.titleColor || '#ffffff',
    bodyColor: slide.bodyColor || '#cccccc',
    brandingColor: slide.brandingColor || '#ffffff',
    imagePosX: slide.imagePosX ?? 50,
    imagePosY: slide.imagePosY ?? 50,
    imageScale: slide.imageScale ?? 1,
    overlayOpacity: slide.overlayOpacity ?? 0,
    textPosY: slide.textPosY ?? 85,
    showSocialImage: slide.showSocialImage ?? false,
    postTitleBold: slide.postTitleBold,
  }));
};

/** Propriedades visuais copiadas por "Aplicar estilo a todos". */
export const pickSlideStyle = (s: Section): Partial<Section> => ({
  layoutType: s.layoutType,
  titleFont: s.titleFont,
  bodyFont: s.bodyFont,
  titleSize: s.titleSize,
  bodySize: s.bodySize,
  bgColor: s.bgColor,
  titleColor: s.titleColor,
  bodyColor: s.bodyColor,
  brandingColor: s.brandingColor,
  alignment: s.alignment,
  overlayOpacity: s.overlayOpacity,
  gradientIntensity: s.gradientIntensity,
  textPosY: s.textPosY,
  imageHeight: s.imageHeight,
  postTitleBold: s.postTitleBold,
});
