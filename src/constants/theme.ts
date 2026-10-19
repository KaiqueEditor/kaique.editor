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

// Cores do Instagram. Espelha src/styles/tokens.css (hex aqui porque o
// código inline concatena alfa, ex.: `${T.accent}30`).
export const DARK: ThemeTokens = {
  bg: '#000000',
  bgCanvas: '#0A0A0A',
  sidebar: '#000000',
  card: '#121212',
  cardHover: '#262626',
  glass: 'rgba(255,255,255,0.04)',
  glassMd: 'rgba(255,255,255,0.08)',
  border: '#262626',
  borderStrong: '#363636',
  accent: '#0095F6',
  accentText: '#FFFFFF',
  accentHover: '#1877F2',
  accentGlow: 'rgba(0,149,246,0.28)',
  textPrimary: '#F5F5F5',
  textSub: '#A8A8A8',
  textDim: '#8E8E8E',
  textFaint: '#8E8E8E',
  inputBg: '#121212',
  inputBorder: '#363636',
  inputFocus: 'rgba(0,149,246,0.5)',
  success: '#58C322',
  shadow: '0 10px 40px rgba(0,0,0,0.55)',
  shadowStrong: '0 24px 80px rgba(0,0,0,0.7)',
};

export const LIGHT: ThemeTokens = {
  bg: '#FFFFFF',
  bgCanvas: '#EFEFEF',
  sidebar: '#FFFFFF',
  card: '#FAFAFA',
  cardHover: '#EFEFEF',
  glass: 'rgba(0,0,0,0.03)',
  glassMd: 'rgba(0,0,0,0.06)',
  border: '#EFEFEF',
  borderStrong: '#DBDBDB',
  accent: '#0095F6',
  accentText: '#FFFFFF',
  accentHover: '#1877F2',
  accentGlow: 'rgba(0,149,246,0.18)',
  textPrimary: '#000000',
  textSub: '#737373',
  textDim: '#737373',
  textFaint: '#737373',
  inputBg: '#FFFFFF',
  inputBorder: '#DBDBDB',
  inputFocus: 'rgba(0,149,246,0.4)',
  success: '#3D8A16',
  shadow: '0 10px 40px rgba(0,0,0,0.08)',
  shadowStrong: '0 24px 60px rgba(0,0,0,0.12)',
};

export const getTheme = (theme: Theme): ThemeTokens =>
  theme === 'dark' ? DARK : LIGHT;

// Fallback escuro para componentes que recebem T como prop opcional
export const DARK_FALLBACK: ThemeTokens = DARK;
