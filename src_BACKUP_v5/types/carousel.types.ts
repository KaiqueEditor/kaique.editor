export interface Section {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  imagePrompt?: string;
  googleSearchTerm?: string;
  alignment: 'left' | 'center' | 'right';
  layoutType: 'background' | 'foreground' | 'storytelling' | 'social-post';
  titleFont: string;
  bodyFont: string;
  ctaText?: string;
  // Individual color overrides
  titleColor: string;
  bodyColor: string;
  bgColor: string;
  brandingColor: string;
  signatureColor?: string;
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
  // Social Post specific
  showSocialImage: boolean;
  avatarUrl?: string;
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
  branding: string;    // Nome do criador: "Kaique Torres"
  handle: string;      // @identificador: "@kaique.editor" — aparece nos slides social-post
  watermark: string;   // Marca d'água discreta no rodapé de todos os slides
  avatarUrl: string;
  numSlides: number;
  // Legacy (mantido para compatibilidade)
  signature?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  config: ProjectConfig;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  sections: Section[];
  config: ProjectConfig;
}
