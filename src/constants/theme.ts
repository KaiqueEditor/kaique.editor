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

// Cinzas Apple + azul de ação. Espelha src/styles/tokens.css (hex aqui porque o
// código inline concatena alfa, ex.: `${T.accent}30`).
export const DARK: ThemeTokens = {
  bg: '#0B0B0D',
  bgCanvas: '#111113',
  sidebar: '#0B0B0D',
  card: '#1C1C1E',
  cardHover: '#2C2C2E',
  glass: 'rgba(255,255,255,0.04)',
  glassMd: 'rgba(255,255,255,0.08)',
  border: '#2C2C2E',
  borderStrong: '#3A3A3C',
  accent: '#0071E3',
  accentText: '#FFFFFF',
  accentHover: '#0077ED',
  accentGlow: 'rgba(0,113,227,0.25)',
  textPrimary: '#F5F5F7',
  textSub: '#98989F',
  textDim: '#8E8E93',
  textFaint: '#8E8E93',
  inputBg: '#1C1C1E',
  inputBorder: '#3A3A3C',
  inputFocus: 'rgba(0,113,227,0.5)',
  success: '#30D158',
  shadow: '0 10px 40px rgba(0,0,0,0.45)',
  shadowStrong: '0 24px 80px rgba(0,0,0,0.6)',
};

export const LIGHT: ThemeTokens = {
  bg: '#F5F5F7',
  bgCanvas: '#E8E8ED',
  sidebar: '#F5F5F7',
  card: '#FFFFFF',
  cardHover: '#F2F2F7',
  glass: 'rgba(0,0,0,0.03)',
  glassMd: 'rgba(0,0,0,0.06)',
  border: '#E5E5EA',
  borderStrong: '#D1D1D6',
  accent: '#0071E3',
  accentText: '#FFFFFF',
  accentHover: '#0077ED',
  accentGlow: 'rgba(0,113,227,0.18)',
  textPrimary: '#1D1D1F',
  textSub: '#6E6E73',
  textDim: '#6E6E73',
  textFaint: '#6E6E73',
  inputBg: '#FFFFFF',
  inputBorder: '#D1D1D6',
  inputFocus: 'rgba(0,113,227,0.4)',
  success: '#248A3D',
  shadow: '0 10px 40px rgba(0,0,0,0.08)',
  shadowStrong: '0 24px 60px rgba(0,0,0,0.12)',
};

export const getTheme = (theme: Theme): ThemeTokens =>
  theme === 'dark' ? DARK : LIGHT;

// Fallback escuro para componentes que recebem T como prop opcional
export const DARK_FALLBACK: ThemeTokens = DARK;
