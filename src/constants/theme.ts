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

export const DARK: ThemeTokens = {
  bg: '#0a0a0a',
  bgCanvas: '#1c1c1e',
  sidebar: '#0a0a0a',
  card: '#111111',
  cardHover: '#1a1a1a',
  glass: 'rgba(255,255,255,0.04)',
  glassMd: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.15)',
  accent: '#ffffff',
  accentText: '#000000',
  accentHover: 'rgba(255,255,255,0.9)',
  accentGlow: 'rgba(255,255,255,0.12)',
  textPrimary: '#ffffff',
  textSub: 'rgba(255,255,255,0.7)',
  textDim: 'rgba(255,255,255,0.4)',
  textFaint: 'rgba(255,255,255,0.18)',
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.08)',
  inputFocus: 'rgba(255,255,255,0.3)',
  success: '#30d158',
  shadow: '0 4px 24px rgba(0,0,0,0.6)',
  shadowStrong: '0 20px 60px rgba(0,0,0,0.8)',
};

export const LIGHT: ThemeTokens = {
  bg: '#f5f5f7',
  bgCanvas: '#e8e8ed',
  sidebar: '#ffffff',
  card: '#f2f2f7',
  cardHover: '#e8e8ed',
  glass: 'rgba(0,0,0,0.03)',
  glassMd: 'rgba(0,0,0,0.06)',
  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.2)',
  accent: '#000000',
  accentText: '#ffffff',
  accentHover: '#1d1d1f',
  accentGlow: 'rgba(0,0,0,0.08)',
  textPrimary: '#1d1d1f',
  textSub: 'rgba(0,0,0,0.7)',
  textDim: 'rgba(0,0,0,0.45)',
  textFaint: 'rgba(0,0,0,0.25)',
  inputBg: 'rgba(0,0,0,0.04)',
  inputBorder: 'rgba(0,0,0,0.1)',
  inputFocus: 'rgba(0,0,0,0.35)',
  success: '#28a745',
  shadow: '0 4px 24px rgba(0,0,0,0.1)',
  shadowStrong: '0 20px 60px rgba(0,0,0,0.15)',
};

export const getTheme = (theme: Theme): ThemeTokens =>
  theme === 'dark' ? DARK : LIGHT;
