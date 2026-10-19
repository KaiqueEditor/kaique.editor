export type Theme = 'dark' | 'light';

export interface ThemeTokens {
  // Backgrounds
  bg: string;
  bgCanvas: string;
  sidebar: string;
  card: string;
  cardHover: string;
  glass: string;
  glassMd: string;
  // Borders
  border: string;
  borderStrong: string;
  // Accent
  accent: string;
  accentText: string;
  accentHover: string;
  accentGlow: string;
  // Text
  textPrimary: string;
  textSub: string;
  textDim: string;
  textFaint: string;
  // Input
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  // Status
  success: string;
  // Shadow
  shadow: string;
  shadowStrong: string;
}

// Paleta Índigo Noturno. Espelha src/styles/tokens.css (hex aqui porque o
// código inline concatena alfa, ex.: `${T.accent}30`).
export const DARK: ThemeTokens = {
  bg: '#0C0C14',
  bgCanvas: '#10101A',
  sidebar: '#0C0C14',
  card: '#171724',
  cardHover: '#232336',
  glass: 'rgba(255,255,255,0.04)',
  glassMd: 'rgba(255,255,255,0.08)',
  border: '#232336',
  borderStrong: '#2E2E46',
  accent: '#6D5DFC',
  accentText: '#FFFFFF',
  accentHover: '#7B6CFF',
  accentGlow: 'rgba(109,93,252,0.28)',
  textPrimary: '#F4F3FF',
  textSub: '#A09FBF',
  textDim: '#8E8DB0',
  textFaint: '#8E8DB0',
  inputBg: '#171724',
  inputBorder: '#2E2E46',
  inputFocus: 'rgba(109,93,252,0.5)',
  success: '#34D399',
  shadow: '0 10px 40px rgba(4,4,12,0.5)',
  shadowStrong: '0 24px 80px rgba(4,4,12,0.65)',
};

export const LIGHT: ThemeTokens = {
  bg: '#F6F6FB',
  bgCanvas: '#EAEAF3',
  sidebar: '#F6F6FB',
  card: '#FFFFFF',
  cardHover: '#EEEEF6',
  glass: 'rgba(22,21,42,0.03)',
  glassMd: 'rgba(22,21,42,0.06)',
  border: '#E4E4EF',
  borderStrong: '#D2D2E2',
  accent: '#5B4BEA',
  accentText: '#FFFFFF',
  accentHover: '#4F3FE0',
  accentGlow: 'rgba(91,75,234,0.18)',
  textPrimary: '#16152A',
  textSub: '#66658A',
  textDim: '#66658A',
  textFaint: '#66658A',
  inputBg: '#FFFFFF',
  inputBorder: '#D2D2E2',
  inputFocus: 'rgba(91,75,234,0.4)',
  success: '#047857',
  shadow: '0 10px 40px rgba(22,21,42,0.08)',
  shadowStrong: '0 24px 60px rgba(22,21,42,0.12)',
};

export const getTheme = (theme: Theme): ThemeTokens =>
  theme === 'dark' ? DARK : LIGHT;

// Fallback escuro para componentes que recebem T como prop opcional
export const DARK_FALLBACK: ThemeTokens = DARK;
