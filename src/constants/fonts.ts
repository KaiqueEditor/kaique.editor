export interface FontOption {
  id: string;
  name: string;
  stack: string;
  googleFont?: string;
  category: 'favorita' | 'display' | 'sans' | 'serif' | 'mono';
  label?: string; // descrição curta
  adminOnly?: boolean;
}

// ── Catálogo de fontes ──────────────────────────────────────────────────────
// Ordem: Favoritas → Display/Impact → Sans → Serif → Mono
export const FONT_OPTIONS: FontOption[] = [

  // ─── ⭐ FAVORITAS ──────────────────────────────────────────────────────────
  {
    id: 'montserrat',
    name: 'Montserrat',
    stack: "'Montserrat', sans-serif",
    googleFont: 'Montserrat:wght@400;500;600;700;800;900',
    category: 'favorita',
    label: 'Corpo / Títulos',
  },
  {
    id: 'wide',
    name: 'Unbounded',
    stack: "'Unbounded', sans-serif",
    googleFont: 'Unbounded:wght@400;700;900',
    category: 'favorita',
    label: 'Futurista / Wide',
  },
  {
    id: 'outfit',
    name: 'Outfit',
    stack: "'Outfit', sans-serif",
    googleFont: 'Outfit:wght@300;400;500;600;700;800;900',
    category: 'favorita',
    label: 'Moderno / Arredondado',
  },
  {
    id: 'syne',
    name: 'Syne',
    stack: "'Syne', sans-serif",
    googleFont: 'Syne:wght@400;600;700;800',
    category: 'favorita',
    label: 'Vanguardista / Bold',
  },
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    stack: "'Plus Jakarta Sans', sans-serif",
    googleFont: 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
    category: 'favorita',
    label: 'Clean / Premium',
  },

  // ─── DISPLAY / IMPACTO ─────────────────────────────────────────────────────
  {
    id: 'bebas-neue',
    name: 'Bebas Neue',
    stack: "'Bebas Neue', sans-serif",
    googleFont: 'Bebas+Neue',
    category: 'display',
    label: 'Impacto / Headlines',
  },

  // ─── SANS-SERIF ────────────────────────────────────────────────────────────
  {
    id: 'sans',
    name: 'Inter',
    stack: "'Inter', sans-serif",
    googleFont: 'Inter:wght@300;400;500;600;700;800;900',
    category: 'sans',
    label: 'UI / Moderno',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    stack: "'Roboto', sans-serif",
    googleFont: 'Roboto:wght@300;400;500;700;900',
    category: 'sans',
    label: 'Universal / Google',
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    stack: "'Open Sans', sans-serif",
    googleFont: 'Open+Sans:wght@300;400;500;600;700;800',
    category: 'sans',
    label: 'Legível / Versátil',
  },
  {
    id: 'poppins',
    name: 'Poppins',
    stack: "'Poppins', sans-serif",
    googleFont: 'Poppins:wght@300;400;500;600;700;800',
    category: 'sans',
    label: 'Geométrico',
  },
  {
    id: 'lato',
    name: 'Lato',
    stack: "'Lato', sans-serif",
    googleFont: 'Lato:wght@300;400;700;900',
    category: 'sans',
    label: 'Humanista / Elegante',
  },
  {
    id: 'helvetica',
    name: 'Helvetica',
    stack: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    category: 'sans',
    label: 'Clássica / Sistema',
  },
  {
    id: 'arial',
    name: 'Arial',
    stack: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
    category: 'sans',
    label: 'Universal / Sistema',
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    stack: "'Space Grotesk', sans-serif",
    googleFont: 'Space+Grotesk:wght@400;500;600;700',
    category: 'sans',
    label: 'Tech / Brutalist',
  },
  {
    id: 'lexend',
    name: 'Lexend',
    stack: "'Lexend', sans-serif",
    googleFont: 'Lexend:wght@400;500;600;700;800',
    category: 'sans',
    label: 'Claro / Expandido',
  },

  // ─── SERIF ─────────────────────────────────────────────────────────────────
  {
    id: 'playfair',
    name: 'Playfair Display',
    stack: "'Playfair Display', serif",
    googleFont: 'Playfair+Display:ital,wght@0,400;0,700;0,900;1,400',
    category: 'serif',
    label: 'Luxo / Clássico',
  },
];

// ── Agrupado por categoria (para UI) ──────────────────────────────────────
export const FONT_CATEGORIES = [
  { key: 'favorita', label: '⭐ Premium' },
  { key: 'display', label: '🔥 Display / Impacto' },
  { key: 'sans', label: 'Sans-Serif Modernas' },
  { key: 'serif', label: 'Serif Clássicas' },
] as const;

export const getFontsByCategory = (cat: string) =>
  FONT_OPTIONS.filter(f => f.category === cat);

export const getFontFamily = (fontKey?: string): string => {
  const font = FONT_OPTIONS.find(f => f.id === fontKey);
  return font ? font.stack : "'Inter', sans-serif";
};
