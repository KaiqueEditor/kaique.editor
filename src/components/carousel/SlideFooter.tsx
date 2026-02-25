import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SlideFooterProps {
  index: number;
  total: number;
  isExport: boolean;
  signature: string;
  isSocial?: boolean;
}

export const SlideFooter: React.FC<SlideFooterProps> = ({
  index,
  total,
  isExport,
  signature,
  isSocial = false,
}) => {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const ctaColor = isSocial ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
  const watermarkColor = isSocial ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';

  const paddingBottom = isExport ? 64 : 26;
  const ctaFontSize = isExport ? '20px' : '8px';
  const watermarkFontSize = isExport ? '14px' : '6px';
  const chevronSize = isExport ? 16 : 7;
  const gap = isExport ? 6 : 2;

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
