import type { Section } from '../types/carousel.types';

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
