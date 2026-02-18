import React from 'react';

interface SlideFooterProps {
  index: number;
  total: number;
  isExport: boolean;
  signature: string;
  color?: string;
  isSocial?: boolean;
}

export const SlideFooter: React.FC<SlideFooterProps> = ({
  index,
  total,
  isExport,
  signature,
  color = '#ffffff',
  isSocial = false
}) => {
  // Social-post usa cor escura (fundo branco), dark layouts usa branco
  const ctaColor = isSocial ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
  const watermarkColor = isSocial ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

  const bottomOffsetText = (isExport ? 100 : 45);
  const bottomOffsetSignature = (isExport ? 45 : 18);

  return (
    <div className="absolute bottom-0 left-0 w-full z-[30]">
      {/* CTA — "arrasta pro lado" / "salve para depois" */}
      <div
        className="absolute w-full flex justify-center"
        style={{ bottom: `${bottomOffsetText}px` }}
      >
        <span
          className="font-bold uppercase tracking-[0.15em] whitespace-nowrap"
          style={{ fontSize: isExport ? '22px' : '9px', color: ctaColor, letterSpacing: '0.2em' }}
        >
          {index === total - 1 ? "SALVE PARA DEPOIS" : "ARRASTA PRO LADO"}
        </span>
      </div>

      {/* Marca d'água — opacidade ultra baixa */}
      {signature && (
        <div
          className="absolute w-full flex justify-center"
          style={{ bottom: `${bottomOffsetSignature}px` }}
        >
          <span
            className="font-black tracking-[0.3em] uppercase whitespace-nowrap px-4"
            style={{ fontSize: isExport ? '18px' : '8px', color: watermarkColor }}
          >
            {signature}
          </span>
        </div>
      )}
    </div>
  );
};
