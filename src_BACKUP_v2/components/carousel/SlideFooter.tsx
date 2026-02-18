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
  const textColor = isSocial ? '#64748b' : color;
  const bottomOffsetText = (isExport ? 100 : 45);
  const bottomOffsetSignature = (isExport ? 45 : 20);

  return (
    <div className="absolute bottom-0 left-0 w-full z-[30]">
      <div
        className="absolute w-full flex justify-center"
        style={{ bottom: `${bottomOffsetText}px` }}
      >
        <span
          className="font-bold uppercase tracking-[0.1em] opacity-40 whitespace-nowrap"
          style={{ fontSize: isExport ? '24px' : '10px', color: textColor }}
        >
          {index === total - 1 ? "SALVE PARA DEPOIS" : "ARRASTA PRO LADO"}
        </span>
      </div>

      <div
        className="absolute w-full flex justify-center"
        style={{ bottom: `${bottomOffsetSignature}px` }}
      >
        <span
          className="font-bold tracking-widest opacity-20 uppercase whitespace-nowrap px-4"
          style={{ fontSize: isExport ? '20px' : '9px', color: textColor }}
        >
          {signature}
        </span>
      </div>
    </div>
  );
};
