export interface FontOption {
  id: string;
  name: string;
  stack: string;
  googleFont?: string;
  category: 'favorita' | 'display' | 'sans' | 'serif' | 'mono';
  label?: string; // descrição curta
}

// ── Catálogo de fontes ──────────────────────────────────────────────────────
// Ordem: Favoritas → Display/Impact → Sans → Serif → Mono
export const FONT_OPTIONS: FontOption[] = [

  // ─── ⭐ SUAS FAVORITAS ────────────────────────────────────────────────────
  {
    id: 'druk',
    name: 'Druk Wide',
    stack: "'Bebas Neue', 'Anton', sans-serif",
    googleFont: 'Bebas+Neue|Anton',
    category: 'favorita',
    label: 'Capa / Impacto',
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    stack: "'Montserrat', sans-serif",
    googleFont: 'Montserrat:wght@400;500;600;700;800;900',
    category: 'favorita',
    label: 'Corpo / Títulos',
  },
  {
    id: 'anton',
    name: 'Anton',
    stack: "'Anton', sans-serif",
    googleFont: 'Anton',
    category: 'favorita',
    label: 'Headlines',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    stack: "'Roboto', sans-serif",
    googleFont: 'Roboto:wght@300;400;500;700;900',
    category: 'favorita',
    label: 'Clean / Legível',
  },
  {
    id: 'gotham',
    name: 'Gotham (Nunito Alt.)',
    stack: "'Nunito', 'Montserrat', sans-serif",
    googleFont: 'Nunito:wght@400;600;700;800;900',
    category: 'favorita',
    label: 'Gotham-style',
  },
  {
    id: 'filson',
    name: 'Filson (Rounded Alt.)',
    stack: "'Nunito Sans', 'Poppins', sans-serif",
    googleFont: 'Nunito+Sans:wght@400;600;700;800',
    category: 'favorita',
    label: 'Amigável / Soft',
  },

  // ─── DISPLAY / IMPACTO ────────────────────────────────────────────────────
  {
    id: 'bebas',
    name: 'Bebas Neue',
    stack: "'Bebas Neue', sans-serif",
    googleFont: 'Bebas+Neue',
    category: 'display',
    label: 'Títulos grandes',
  },
  {
    id: 'wide',
    name: 'Unbounded',
    stack: "'Unbounded', sans-serif",
    googleFont: 'Unbounded:wght@400;700;900',
    category: 'display',
    label: 'Futurista / Wide',
  },
  {
    id: 'oswald',
    name: 'Oswald',
    stack: "'Oswald', sans-serif",
    googleFont: 'Oswald:wght@400;600;700',
    category: 'display',
    label: 'Compacto / Bold',
  },
  {
    id: 'barlow',
    name: 'Barlow Condensed',
    stack: "'Barlow Condensed', sans-serif",
    googleFont: 'Barlow+Condensed:wght@400;600;700;800',
    category: 'display',
    label: 'Condensed',
  },

  // ─── SANS-SERIF ───────────────────────────────────────────────────────────
  {
    id: 'sans',
    name: 'Inter',
    stack: "'Inter', sans-serif",
    googleFont: 'Inter:wght@300;400;500;600;700;800;900',
    category: 'sans',
    label: 'UI / Moderno',
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
    id: 'opensans',
    name: 'Open Sans',
    stack: "'Open Sans', sans-serif",
    googleFont: 'Open+Sans:wght@400;600;700',
    category: 'sans',
    label: 'Neutro / Legível',
  },
  {
    id: 'raleway',
    name: 'Raleway',
    stack: "'Raleway', sans-serif",
    googleFont: 'Raleway:wght@400;600;700;800',
    category: 'sans',
    label: 'Elegante',
  },
  {
    id: 'dm',
    name: 'DM Sans',
    stack: "'DM Sans', sans-serif",
    googleFont: 'DM+Sans:wght@400;500;700',
    category: 'sans',
    label: 'Editorial',
  },

  // ─── SERIF ────────────────────────────────────────────────────────────────
  {
    id: 'playfair',
    name: 'Playfair Display',
    stack: "'Playfair Display', serif",
    googleFont: 'Playfair+Display:ital,wght@0,400;0,700;0,900;1,400',
    category: 'serif',
    label: 'Luxo / Clássico',
  },
  {
    id: 'lora',
    name: 'Lora',
    stack: "'Lora', serif",
    googleFont: 'Lora:ital,wght@0,400;0,700;1,400',
    category: 'serif',
    label: 'Editorial Quente',
  },
  {
    id: 'cormorant',
    name: 'Cormorant Garamond',
    stack: "'Cormorant Garamond', serif",
    googleFont: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400',
    category: 'serif',
    label: 'Alta costura',
  },

  // ─── MONO ─────────────────────────────────────────────────────────────────
  {
    id: 'jetbrains',
    name: 'JetBrains Mono',
    stack: "'JetBrains Mono', monospace",
    googleFont: 'JetBrains+Mono:wght@400;700',
    category: 'mono',
    label: 'Tech / Código',
  },
];

// ── Agrupado por categoria (para UI) ──────────────────────────────────────
export const FONT_CATEGORIES = [
  { key: 'favorita', label: '⭐ Populares' },
  { key: 'display',  label: 'Display / Impacto' },
  { key: 'sans',     label: 'Sans-Serif' },
  { key: 'serif',    label: 'Serif' },
  { key: 'mono',     label: 'Mono' },
] as const;

export const getFontsByCategory = (cat: string) =>
  FONT_OPTIONS.filter(f => f.category === cat);

export const getFontFamily = (fontKey?: string): string => {
  const font = FONT_OPTIONS.find(f => f.id === fontKey);
  return font ? font.stack : "'Inter', sans-serif";
};
