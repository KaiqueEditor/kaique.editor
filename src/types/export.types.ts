export interface ExportOptions {
  format: 'png' | 'mp4' | 'zip';
  quality: number;
  includeWatermark?: boolean;
}

export interface ExportProgress {
  step: string;
  progress: number;
  currentSlide?: number;
  totalSlides?: number;
}
