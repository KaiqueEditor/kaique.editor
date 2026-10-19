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

// Fundo padrão escuro + destaque cyan
export const DARK: ThemeTokens = {
  bg: '#000000',              // Fundo puro preto — padrão
  bgCanvas: '#000000',
  sidebar: '#000000',
  card: '#121212',
  cardHover: '#181818',
  glass: 'rgba(255,255,255,0.03)',
  glassMd: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.20)',
  accent: '#00E5C3',          // Cyan — destaque
  accentText: '#000000',
  accentHover: '#00CEB0',
  accentGlow: 'rgba(0,229,195,0.20)',
  textPrimary: '#ffffff',
  textSub: '#A1A1AA',
  textDim: '#71717A',
  textFaint: '#52525B',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.12)',
  inputFocus: 'rgba(0,229,195,0.4)',  // Cyan no foco
  success: '#00E5C3',
  shadow: '0 4px 30px rgba(0,0,0,0.9)',
  shadowStrong: '0 20px 80px rgba(0,0,0,1)',
};

export const LIGHT: ThemeTokens = {
  bg: '#ffffff',
  bgCanvas: '#F3F4F6',
  sidebar: '#F9FAFB',
  card: '#ffffff',
  cardHover: '#F4F4F5',
  glass: 'rgba(0,0,0,0.03)',
  glassMd: 'rgba(0,0,0,0.06)',
  border: 'rgba(0,0,0,0.10)',
  borderStrong: 'rgba(0,0,0,0.20)',
  accent: '#00B89C',          // Cyan saturado para light
  accentText: '#ffffff',
  accentHover: '#009E86',
  accentGlow: 'rgba(0,184,156,0.15)',
  textPrimary: '#111827',
  textSub: '#4B5563',
  textDim: '#6B7280',
  textFaint: '#9CA3AF',
  inputBg: '#ffffff',
  inputBorder: 'rgba(0,0,0,0.15)',
  inputFocus: 'rgba(0,184,156,0.4)',
  success: '#00B89C',
  shadow: '0 8px 30px rgba(0,0,0,0.08)',
  shadowStrong: '0 20px 60px rgba(0,0,0,0.12)',
};

export const getTheme = (theme: Theme): ThemeTokens =>
  theme === 'dark' ? DARK : LIGHT;

// Fallback escuro para componentes que recebem T como prop opcional
export const DARK_FALLBACK: ThemeTokens = DARK;
