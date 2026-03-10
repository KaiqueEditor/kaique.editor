import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SlideFooterProps {
  index: number;
  total: number;
  isExport: boolean;
  signature: string;
  isSocial?: boolean;
  formatHeight?: number;
  bgColor?: string;
}

// Calcula luminância relativa para decidir se o fundo é claro ou escuro
const isLightBackground = (hex: string): boolean => {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Fórmula de luminância percebida
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

export const SlideFooter: React.FC<SlideFooterProps> = ({
  index,
  total,
  isExport,
  signature,
  isSocial = false,
  formatHeight = 1440,
  bgColor = '#000000',
}) => {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // Auto-contraste: texto escuro em fundo claro, texto claro em fundo escuro
  const isLight = isLightBackground(bgColor);
  const ctaColor = isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
  const watermarkColor = isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';

  const hScale = formatHeight / 1440;
  const paddingBottom = isExport ? Math.round(64 * hScale) : 26;
  const ctaFontSize = isExport ? `${Math.round(20 * hScale)}px` : '8px';
  const watermarkFontSize = isExport ? `${Math.round(14 * hScale)}px` : '6px';
  const chevronSize = isExport ? Math.round(16 * hScale) : 7;
  const gap = isExport ? Math.round(6 * hScale) : 2;

  const ctaText = isLast ? 'SALVE PARA DEPOIS' : 'ARRASTA PRO LADO';

  return (
    <div
      className="absolute bottom-0 left-0 w-full z-[30] flex flex-col items-center"
      style={{ paddingBottom: `${paddingBottom}px`, gap: `${gap}px` }}
    >
      {/* CTA */}
      <div className="flex items-center" style={{ gap: isExport ? '4px' : '2px' }}>
        <span
          className="font-bold uppercase whitespace-nowrap"
          style={{ fontSize: ctaFontSize, color: ctaColor, letterSpacing: '0.2em' }}
        >
          {ctaText}
        </span>
        {isFirst && !isLast && (
          <span className="flex items-center" style={{ color: ctaColor, marginLeft: isExport ? 2 : 1 }}>
            <ChevronRight size={chevronSize} strokeWidth={3} />
            <ChevronRight size={chevronSize} strokeWidth={3} style={{ marginLeft: isExport ? -5 : -2 }} />
            <ChevronRight size={chevronSize} strokeWidth={3} style={{ marginLeft: isExport ? -5 : -2 }} />
          </span>
        )}
      </div>

      {/* Marca d'água */}
      {signature && (
        <span
          className="font-black tracking-[0.3em] uppercase whitespace-nowrap"
          style={{ fontSize: watermarkFontSize, color: watermarkColor }}
        >
          {signature}
        </span>
      )}
    </div>
  );
};
