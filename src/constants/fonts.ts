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

  // ─── ⭐ SUAS FAVORITAS ────────────────────────────────────────────────────
  {
    id: 'montserrat',
    name: 'Montserrat (PRO)',
    stack: "'Montserrat', sans-serif",
    googleFont: 'Montserrat:wght@400;500;600;700;800;900',
    category: 'favorita',
    label: 'Corpo / Títulos',
    adminOnly: true,
  },
  {
    id: 'wide',
    name: 'Unbounded (PRO)',
    stack: "'Unbounded', sans-serif",
    googleFont: 'Unbounded:wght@400;700;900',
    category: 'favorita',
    label: 'Futurista / Wide',
    adminOnly: true,
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

  // ─── SERIF ────────────────────────────────────────────────────────────────
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
  { key: 'sans', label: 'Sans-Serif Modernas' },
  { key: 'serif', label: 'Serif Clássicas' },
] as const;

export const getFontsByCategory = (cat: string) =>
  FONT_OPTIONS.filter(f => f.category === cat);

export const getFontFamily = (fontKey?: string): string => {
  const font = FONT_OPTIONS.find(f => f.id === fontKey);
  return font ? font.stack : "'Inter', sans-serif";
};
