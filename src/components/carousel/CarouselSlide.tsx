import React from 'react';
import { Section, ProjectConfig } from '../../types';
import { SlideFooter } from './SlideFooter';
import { VerifiedBadge } from '../icons/VerifiedBadge';
import { getFontFamily } from '../../constants/fonts';
import { renderFormattedText } from '../../utils/formatters';
import { ImageIcon, Loader2 } from 'lucide-react';

interface CarouselSlideProps {
  section: Section;
  config: ProjectConfig;
  index: number;
  total: number;
  isExport?: boolean;
  isGenerating?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
  onAvatarClick?: () => void;
}

export const CarouselSlide: React.FC<CarouselSlideProps> = React.memo(({
  section,
  config,
  index,
  total,
  isExport = false,
  isGenerating = false,
  innerRef,
  onAvatarClick,
}) => {
  const layout = section.layoutType || 'storytelling';
  const isSocial = layout === 'social-post';
  const isFullBg = layout === 'background';

  const containerStyle: React.CSSProperties = isExport
    ? { width: '1080px', height: '1440px' }
    : { width: '100%', aspectRatio: '1080/1440' };

  const scaleFactor = isExport ? 2.16 : 1;
  // Mantém proporção idêntica entre preview e export (1080x1440),
  // evitando quebra de linha diferente por largura útil do texto.
  const basePaddingX = 40;
  const paddingX = basePaddingX * scaleFactor;

  const finalTitleColor = section.titleColor || (isSocial ? '#000000' : '#ffffff');
  const finalBodyColor = section.bodyColor || (isSocial ? '#000000' : '#ffffff');
  const finalBrandingColor = section.brandingColor || (isSocial ? '#000000' : '#ffffff');
  const finalBrandingBgColor = section.bgColor || (isSocial ? '#ffffff' : '#000000');

  const finalTitleSize = `${(section.titleSize || (isFullBg ? 48 : (isSocial ? 26 : 30))) * scaleFactor}px`;
  const finalBodySize = `${(section.bodySize || (isFullBg ? 18 : 20)) * scaleFactor}px`;

  const textAlign = section.alignment || (isFullBg ? 'center' : 'left');
  const imgPosX = section.imagePosX ?? 50;
  const imgPosY = section.imagePosY ?? 50;
  const imgScale = section.imageScale ?? 1;
  const overlayOpacity = section.overlayOpacity ?? (isFullBg ? 0.4 : isSocial ? 0 : 0.2);
  const clipStart = Math.max(0, section.videoTrimStart ?? 0);
  const clipEnd = clipStart + 15;

  const manualTextOffset = (section.textPosY ?? 85);
  const contentPaddingBottom = (isExport ? manualTextOffset * 2.16 : manualTextOffset);

  if (isSocial) {
    const avatar = section.avatarUrl || config.avatarUrl || "https://avatar.vercel.sh/kaique";
    return (
      <div
        ref={innerRef}
        className={`flex flex-col relative overflow-hidden ${isExport ? '' : 'aspect-[1080/1440]'}`}
        style={{ ...containerStyle, backgroundColor: finalBrandingBgColor }}
      >
        <div className="flex items-center gap-4 px-10 pt-16 mb-8" style={{ paddingLeft: `${paddingX}px`, paddingRight: `${paddingX}px` }}>
          <div
            onClick={!isExport ? onAvatarClick : undefined}
            className={`rounded-full overflow-hidden flex-shrink-0 ${!isExport ? 'cursor-pointer transition-all' : ''}`}
            style={{ width: `${64 * scaleFactor}px`, height: `${64 * scaleFactor}px`, border: `2px solid rgba(0,0,0,0.08)` }}
          >
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ fontSize: `${20 * scaleFactor}px`, fontFamily: getFontFamily('sans'), color: finalBrandingColor }}>{config.branding || 'Seu Nome Completo'}</span>
              <VerifiedBadge size={16 * scaleFactor} />
            </div>
            <span style={{ fontSize: `${16 * scaleFactor}px`, fontFamily: getFontFamily('sans'), color: '#64748b' }}>{config.handle || '@seuusuario'}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col px-10 gap-6" style={{ paddingLeft: `${paddingX}px`, paddingRight: `${paddingX}px`, paddingBottom: `${contentPaddingBottom}px`, justifyContent: 'flex-end' }}>
          <div className="flex flex-col gap-6">
            <h2
              className="font-bold leading-[1.2]"
              style={{
                fontSize: finalTitleSize,
                color: finalTitleColor,
                fontFamily: getFontFamily(section.titleFont || 'anton'),
                textAlign: textAlign as any
              }}
            >
              {renderFormattedText(section.title)}
            </h2>

            <p
              className="leading-relaxed"
              style={{
                fontSize: finalBodySize,
                color: finalBodyColor,
                fontFamily: getFontFamily(section.bodyFont || 'sans'),
                textAlign: textAlign as any,
                opacity: 1
              }}
            >
              {renderFormattedText(section.content)}
            </p>

            {(section.showSocialImage !== false) && (
              <div className="relative w-full rounded-[1rem] overflow-hidden mt-4" style={{ aspectRatio: '1.77/1', background: 'rgba(0,0,0,0.06)', border: `1px solid rgba(0,0,0,0.08)` }}>
                {isGenerating ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 animate-pulse text-white/40 gap-2">
                    <Loader2 className="animate-spin" size={32 * scaleFactor} />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">IA Criando...</span>
                  </div>
                ) : section.videoUrl ? (
                  <video
                    key={`${section.videoUrl}-${clipStart}`}
                    src={section.videoUrl}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: `${imgPosX}% ${imgPosY}%`, transform: `scale(${imgScale})` }}
                    onLoadedData={e => {
                      e.currentTarget.currentTime = clipStart;
                      void e.currentTarget.play().catch(() => {});
                    }}
                    onTimeUpdate={e => {
                      if (e.currentTarget.currentTime >= clipEnd) {
                        e.currentTarget.currentTime = clipStart;
                      }
                    }}
                  />
                ) : section.imageUrl ? (
                  <img src={section.imageUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: `${imgPosX}% ${imgPosY}%`, transform: `scale(${imgScale})` }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <ImageIcon size={48 * scaleFactor} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <SlideFooter index={index} total={total} isExport={isExport} signature={config.watermark || config.handle || ''} isSocial={true} />
      </div>
    );
  }

  return (
    <div
      ref={innerRef}
      className={`flex flex-col justify-between text-white relative overflow-hidden ${isExport ? '' : 'aspect-[1080/1440]'}`}
      style={{ ...containerStyle, backgroundColor: section.bgColor || '#000000' }}
    >
      <div
        className={`absolute inset-0 ${!isFullBg ? 'h-[55%]' : 'h-full'} overflow-hidden`}
      >
        {isGenerating ? (
          <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-white opacity-40" size={64 * scaleFactor} />
          </div>
        ) : section.videoUrl ? (
          <video
            key={`${section.videoUrl}-${clipStart}`}
            src={section.videoUrl}
            autoPlay
            muted
            playsInline
            crossOrigin="anonymous"
            preload="auto"
            className="w-full h-full object-cover transition-all"
            style={{ objectPosition: `${imgPosX}% ${imgPosY}%`, transform: `scale(${imgScale})` }}
            onLoadedData={e => {
              e.currentTarget.currentTime = clipStart;
              void e.currentTarget.play().catch(() => {});
            }}
            onTimeUpdate={e => {
              if (e.currentTarget.currentTime >= clipEnd) {
                e.currentTarget.currentTime = clipStart;
              }
            }}
          />
        ) : section.imageUrl ? (
          <img src={section.imageUrl} crossOrigin="anonymous" alt="" className="w-full h-full object-cover transition-all" style={{ objectPosition: `${imgPosX}% ${imgPosY}%`, transform: `scale(${imgScale})` }} />
        ) : (
          <div className="w-full h-full opacity-10" style={{ background: `linear-gradient(135deg, #ffffff, rgba(255,255,255,0.3))` }}></div>
        )}
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 pt-12 flex flex-col items-center w-full">
        {config.branding && !(isFullBg || layout === 'storytelling') && (
          <span className="font-bold uppercase tracking-[0.25em] opacity-80 text-center px-4" style={{ fontSize: isExport ? '28px' : '10px', color: finalBrandingColor, fontFamily: getFontFamily('sans') }}>
            {config.branding}
          </span>
        )}
      </div>

      <div
        className={`relative z-10 flex flex-col w-full flex-1 ${isFullBg ? 'items-center justify-center' : 'items-start justify-end'}`}
        style={{
          paddingLeft: `${paddingX}px`,
          paddingRight: `${paddingX}px`,
          paddingBottom: `${contentPaddingBottom}px`,
          textAlign: textAlign as any
        }}
      >
        <div className={`w-full flex flex-col ${textAlign === 'center' ? 'items-center' : textAlign === 'right' ? 'items-end' : 'items-start'}`}>
          <h2
            className={`font-black uppercase mb-6 leading-[1.1] whitespace-pre-wrap`}
            style={{
              fontFamily: getFontFamily(section.titleFont || 'anton'),
              fontSize: finalTitleSize,
              color: finalTitleColor,
              textShadow: '0 4px 30px rgba(0,0,0,0.8)'
            }}
          >
            {renderFormattedText(section.title)}
          </h2>

          {section.content && (
            <p
              className={`leading-relaxed whitespace-pre-wrap font-normal`}
              style={{
                fontSize: finalBodySize,
                fontFamily: getFontFamily(section.bodyFont || 'sans'),
                color: finalBodyColor,
                maxWidth: isFullBg ? '95%' : '100%',
                textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                opacity: 0.9
              }}
            >
              {renderFormattedText(section.content)}
            </p>
          )}
        </div>
      </div>
      <SlideFooter index={index} total={total} isExport={isExport} signature={config.watermark || config.handle || ''} />
    </div>
  );
});

CarouselSlide.displayName = 'CarouselSlide';
