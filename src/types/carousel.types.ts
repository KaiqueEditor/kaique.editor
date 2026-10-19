export interface Section {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  videoMimeType?: string;
  imagePrompt?: string;
  alignment: 'left' | 'center' | 'right';
  layoutType: 'background' | 'storytelling' | 'social-post';
  titleFont: string;
  bodyFont: string;
  ctaText?: string;
  // Individual color overrides
  titleColor: string;
  bodyColor: string;
  bgColor: string;
  brandingColor: string;
  // Individual size overrides
  titleSize: number;
  bodySize: number;
  // Image Adjustments
  imagePosX: number;
  imagePosY: number;
  imageScale: number;
  overlayOpacity: number;
  // Text Adjustments
  textPosY: number;
  // Gradient
  gradientIntensity?: number;   // 0 a 1 (0 = sem degradê, 1 = máximo)
  // Image area
  imageHeight?: number;         // 30 a 100 (% da altura do slide que a imagem ocupa)
  // Social Post specific
  showSocialImage: boolean;
  avatarUrl?: string;
  postTitleBold?: boolean;            // false = título com o mesmo peso do texto (tweet corrido)
  // Video trim
  videoTrimStart?: number; // segundos — ponto de início da janela de 15s
}

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ProjectConfig {
  branding: string;    // Nome do criador
  handle: string;      // @identificador — aparece nos slides social-post
  watermark: string;   // Marca d'água discreta no rodapé de todos os slides
  avatarUrl: string;
  numSlides: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  config: ProjectConfig;
}

export interface StylePreset {
  id: string;
  name: string;
  layoutType: Section['layoutType'];
  titleFont: string;
  bodyFont: string;
  titleSize: number;
  bodySize: number;
  bgColor: string;
  titleColor: string;
  bodyColor: string;
  brandingColor: string;
  alignment: 'left' | 'center' | 'right';
  overlayOpacity: number;
  textPosY: number;
  imageScale: number;
}

// Estilo de slide sem id/name (usado nos templates)
export type SlideStyle = Omit<StylePreset, 'id' | 'name'>;

export interface CarouselTemplate {
  id: string;
  name: string;
  capaStyle: SlideStyle;
  slidesStyle: SlideStyle;
}

// ── Export Formats ──
export type ExportFormatKey = 'carousel' | 'stories' | 'feed' | 'linkedin';

export interface ExportFormat {
  key: ExportFormatKey;
  label: string;
  width: number;
  height: number;
  ratio: string;
}

export const EXPORT_FORMATS: ExportFormat[] = [
  { key: 'carousel', label: 'Feed', width: 1080, height: 1440, ratio: '3:4' },
  { key: 'stories', label: 'Stories', width: 1080, height: 1920, ratio: '9:16' },
  { key: 'linkedin', label: 'LinkedIn', width: 1080, height: 1080, ratio: '1:1' },
];

// ── Brand Kit ──
export interface BrandKit {
  id: string;
  name: string;
  branding: string;
  handle: string;
  watermark: string;
  avatarUrl: string;
  titleFont: string;
  bodyFont: string;
  titleColor: string;
  bodyColor: string;
  bgColor: string;
  brandingColor: string;
}

