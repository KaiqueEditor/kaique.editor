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

// Monocromático. Espelha src/styles/tokens.css (hex aqui porque o
// código inline concatena alfa, ex.: `${T.accent}30`).
export const DARK: ThemeTokens = {
  bg: '#000000',
  bgCanvas: '#0C0C0C',
  sidebar: '#000000',
  card: '#141414',
  cardHover: '#202020',
  glass: 'rgba(255,255,255,0.04)',
  glassMd: 'rgba(255,255,255,0.08)',
  border: '#262626',
  borderStrong: '#404040',
  accent: '#FFFFFF',
  accentText: '#1A1A1A',
  accentHover: '#E6E6E6',
  accentGlow: 'rgba(255,255,255,0.15)',
  textPrimary: '#FFFFFF',
  textSub: '#A6A6A6',
  textDim: '#8C8C8C',
  textFaint: '#8C8C8C',
  inputBg: '#141414',
  inputBorder: '#404040',
  inputFocus: 'rgba(255,255,255,0.5)',
  success: '#58C322',
  shadow: '0 10px 40px rgba(0,0,0,0.5)',
  shadowStrong: '0 24px 80px rgba(0,0,0,0.7)',
};

export const LIGHT: ThemeTokens = {
  bg: '#FFFFFF',
  bgCanvas: '#F2F2F2',
  sidebar: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F0F0F0',
  glass: 'rgba(0,0,0,0.03)',
  glassMd: 'rgba(0,0,0,0.06)',
  border: '#E5E5E5',
  borderStrong: '#1A1A1A',
  accent: '#1A1A1A',
  accentText: '#FFFFFF',
  accentHover: '#000000',
  accentGlow: 'rgba(0,0,0,0.12)',
  textPrimary: '#1A1A1A',
  textSub: '#6B6B6B',
  textDim: '#6B6B6B',
  textFaint: '#6B6B6B',
  inputBg: '#FFFFFF',
  inputBorder: '#1A1A1A',
  inputFocus: 'rgba(0,0,0,0.4)',
  success: '#3D8A16',
  shadow: '0 10px 40px rgba(0,0,0,0.06)',
  shadowStrong: '0 24px 60px rgba(0,0,0,0.1)',
};

export const getTheme = (theme: Theme): ThemeTokens =>
  theme === 'dark' ? DARK : LIGHT;

// Fallback escuro para componentes que recebem T como prop opcional
export const DARK_FALLBACK: ThemeTokens = DARK;
