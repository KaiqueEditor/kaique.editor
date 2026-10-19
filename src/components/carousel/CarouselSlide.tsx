import React from 'react';
import { Section, ProjectConfig } from '../../types';
import { SlideFooter } from './SlideFooter';
import { VerifiedBadge } from '../icons/VerifiedBadge';
import { getFontFamily } from '../../constants/fonts';
import { renderFormattedText } from '../../utils/formatters';
import { Loader2 } from 'lucide-react';
import { X_FONT_STACK } from '../../lib/xPost';

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='8' fill='%23334155'/><circle cx='20' cy='15' r='7' fill='%2394a3b8'/><ellipse cx='20' cy='33' rx='11' ry='8' fill='%2394a3b8'/></svg>`;

interface CarouselSlideProps {
  section: Section;
  config: ProjectConfig;
  index: number;
  total: number;
  isExport?: boolean;
  isGenerating?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
  onAvatarClick?: () => void;
  formatWidth?: number;
  formatHeight?: number;
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
  formatWidth = 1080,
  formatHeight = 1440,
}) => {
  // Proporção real da mídia do Post X (limitada entre 16:9 e 4:5, como no X)
  const [mediaRatio, setMediaRatio] = React.useState(16 / 9);
  const onMediaSize = (w: number, h: number) => {
    if (w > 0 && h > 0) setMediaRatio(Math.min(16 / 9, Math.max(4 / 5, w / h)));
  };
  // Post X: se texto + imagem não couberem, o post inteiro diminui por igual (como um print)
  const fitRef = React.useRef<HTMLDivElement>(null);
  const [fit, setFit] = React.useState(1);
  React.useLayoutEffect(() => {
    const el = fitRef.current;
    const root = el?.parentElement;
    if (!el || !root) return;
    const measure = () => {
      const cs = getComputedStyle(root);
      const avail = root.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const need = el.offsetHeight;
      const next = avail > 0 && need > avail ? avail / need : 1;
      setFit(prev => (Math.abs(prev - next) > 0.005 ? next : prev));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(root);
    return () => ro.disconnect();
  }, [section.layoutType]);
  const layout = section.layoutType || 'storytelling';
  const isSocial = layout === 'social-post';
  const isFullBg = layout === 'background';

  const containerStyle: React.CSSProperties = isExport
    ? { width: `${formatWidth}px`, height: `${formatHeight}px` }
    : { width: '100%', aspectRatio: `${formatWidth}/${formatHeight}` };

  const scaleFactor = isExport ? (formatHeight / 1440) * 2.16 : 1;
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
    const avatar = section.avatarUrl || config.avatarUrl || DEFAULT_AVATAR;
    const showImage = section.showSocialImage !== false;
    const hasImage = !!(section.imageUrl || section.videoUrl);
    const titleBold = section.postTitleBold !== false;
    // Fonte padrão do post imita a do X; outras fontes escolhidas continuam valendo
    const postFont = (key?: string) => (!key || key === 'sans' ? X_FONT_STACK : getFontFamily(key));
    // textPosY controla o espaço do topo — igual ao Feed que controla do fundo
    const socialTopPad = (manualTextOffset * 0.4) * scaleFactor;
    return (
      <div
        ref={innerRef}
        className="flex flex-col relative overflow-hidden"
        style={{
          ...containerStyle,
          backgroundColor: finalBrandingBgColor,
          paddingTop: `${socialTopPad}px`,
          paddingBottom: `${(isExport ? 64 * (formatHeight / 1440) + 40 : 46)}px`,
        }}
      >
        <div ref={fitRef} className="flex flex-col flex-shrink-0 w-full" style={{ transform: fit < 1 ? `scale(${fit})` : undefined, transformOrigin: 'top center' }}>
        {/* Header com avatar */}
        <div className="flex items-center flex-shrink-0" style={{ gap: `${14 * scaleFactor}px`, paddingLeft: `${paddingX * 1.2}px`, paddingRight: `${paddingX * 1.2}px`, paddingBottom: `${4 * scaleFactor}px` }}>
          <div
            onClick={!isExport ? onAvatarClick : undefined}
            className={`rounded-full overflow-hidden flex-shrink-0 ${!isExport ? 'cursor-pointer transition-all' : ''}`}
            style={{ width: `${48 * scaleFactor}px`, height: `${48 * scaleFactor}px`, border: `2px solid rgba(0,0,0,0.08)` }}
          >
            <img src={avatar} crossOrigin="anonymous" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col" style={{ gap: `${1 * scaleFactor}px` }}>
            <div className="flex items-center" style={{ gap: `${6 * scaleFactor}px` }}>
              <span className="font-bold" style={{ fontSize: `${18 * scaleFactor}px`, fontFamily: X_FONT_STACK, color: finalBrandingColor }}>{config.branding || 'Seu Nome'}</span>
              <VerifiedBadge size={16 * scaleFactor} />
            </div>
            <span style={{ fontSize: `${15 * scaleFactor}px`, fontFamily: X_FONT_STACK, color: '#71767b' }}>{config.handle || '@seuusuario'}</span>
          </div>
        </div>

        {/* Conteúdo de texto — nunca encolhe por causa da imagem */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            paddingLeft: `${paddingX * 1.2}px`,
            paddingRight: `${paddingX * 1.2}px`,
            paddingTop: `${20 * scaleFactor}px`,
            paddingBottom: `${16 * scaleFactor}px`,
            gap: `${16 * scaleFactor}px`,
            flex: '0 0 auto',
          }}
        >
          <h2
            style={{
              fontSize: finalTitleSize,
              color: finalTitleColor,
              fontFamily: postFont(section.titleFont),
              textAlign: textAlign as any,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              fontWeight: !titleBold ? 400 : section.titleFont === 'filson-pro-bold' ? 800 : section.titleFont === 'wide' ? 900 : section.titleFont?.startsWith('gilroy') ? 400 : 700,
              lineHeight: section.titleFont === 'wide' ? 1.15 : 1.35,
              textTransform: section.titleFont === 'wide' ? 'uppercase' : undefined,
              letterSpacing: section.titleFont === 'wide' ? '-0.01em' : undefined,
            }}
          >
            {renderFormattedText(section.title)}
          </h2>

          {section.content && (
            <p
              style={{
                fontSize: finalBodySize,
                color: finalBodyColor,
                fontFamily: postFont(section.bodyFont),
                textAlign: textAlign as any,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                fontWeight: section.bodyFont === 'filson-pro-bold' ? 800 : 400,
                lineHeight: 1.45,
              }}
            >
              {renderFormattedText(section.content)}
            </p>
          )}
        </div>

        {/* Imagem — segue a proporção real dela */}
        {showImage && hasImage && (
          <div className="flex-shrink-0" style={{ paddingLeft: `${paddingX}px`, paddingRight: `${paddingX}px`, paddingBottom: `${16 * scaleFactor}px` }}>
            <div className="relative w-full rounded-[1rem] overflow-hidden" style={{ aspectRatio: `${mediaRatio}`, background: 'rgba(0,0,0,0.06)', border: `1px solid rgba(0,0,0,0.08)` }}>
              {isGenerating ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 animate-pulse text-white/40 gap-2">
                  <Loader2 className="animate-spin" size={32 * scaleFactor} />
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
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `${imgPosX}% ${imgPosY}%`, transform: `scale(${imgScale})` }}
                  onLoadedMetadata={e => onMediaSize(e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
                  onLoadedData={e => {
                    e.currentTarget.currentTime = clipStart;
                    void e.currentTarget.play().catch(() => { });
                  }}
                  onTimeUpdate={e => {
                    if (e.currentTarget.currentTime >= clipEnd) {
                      e.currentTarget.currentTime = clipStart;
                    }
                  }}
                />
              ) : section.imageUrl ? (
                <img src={section.imageUrl} crossOrigin="anonymous" alt="" className="w-full h-full object-cover"
                  onLoad={e => onMediaSize(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
                  style={{ objectPosition: `${imgPosX}% ${imgPosY}%`, transform: `scale(${imgScale})` }} />
              ) : null}
            </div>
          </div>
        )}
        </div>

        <SlideFooter index={index} total={total} isExport={isExport} signature={config.watermark || config.handle || ''} isSocial={true} formatHeight={formatHeight} bgColor={section.bgColor || '#ffffff'} />
      </div>
    );
  }

  return (
    <div
      ref={innerRef}
      className={`flex flex-col justify-between text-white relative overflow-hidden ${isExport ? '' : ''}`}
      style={{ ...containerStyle, backgroundColor: section.bgColor || '#000000' }}
    >
      <div
        className={`absolute inset-0 overflow-hidden`}
        style={{ height: isFullBg ? '100%' : `${section.imageHeight ?? 55}%` }}
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
              void e.currentTarget.play().catch(() => { });
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
        <div className="absolute inset-0" style={{ backgroundColor: section.bgColor || '#000000', opacity: overlayOpacity }}></div>
        {(() => {
          const gIntensity = section.gradientIntensity ?? 0.8;
          if (gIntensity <= 0) return null;
          // Converte bgColor hex em rgb para usar com alpha
          const bg = section.bgColor || '#000000';
          const r = parseInt(bg.slice(1, 3), 16) || 0;
          const g = parseInt(bg.slice(3, 5), 16) || 0;
          const b = parseInt(bg.slice(5, 7), 16) || 0;
          return (
            <div className="absolute inset-0" style={{
              background: `linear-gradient(to top, rgba(${r},${g},${b},1) 0%, rgba(${r},${g},${b},0.85) 3%, rgba(${r},${g},${b},0.6) 7%, rgba(${r},${g},${b},0.35) 11%, rgba(${r},${g},${b},0.12) 16%, rgba(${r},${g},${b},0.03) 20%, transparent 25%)`
            }}></div>
          );
        })()}
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
            className={`uppercase mb-6 leading-[1.1] whitespace-pre-wrap`}
            style={{
              fontFamily: getFontFamily(section.titleFont || 'anton'),
              fontSize: finalTitleSize,
              color: finalTitleColor,
              textShadow: '0 4px 30px rgba(0,0,0,0.8)',
              fontWeight: section.titleFont === 'filson-pro-bold' ? 800 : section.titleFont === 'wide' ? 900 : section.titleFont?.startsWith('gilroy') ? 400 : 700,
              lineHeight: section.titleFont === 'wide' ? 1.15 : 1.1,
              textTransform: section.titleFont === 'wide' ? 'uppercase' : undefined,
              letterSpacing: section.titleFont === 'wide' ? '-0.01em' : undefined,
            }}
          >
            {renderFormattedText(section.title)}
          </h2>

          {section.content && (
            <p
              className={`leading-relaxed whitespace-pre-wrap`}
              style={{
                fontSize: finalBodySize,
                fontFamily: getFontFamily(section.bodyFont || 'sans'),
                color: finalBodyColor,
                maxWidth: isFullBg ? '95%' : '100%',
                textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                fontWeight: section.bodyFont === 'filson-pro-bold' ? 800 : section.bodyFont?.startsWith('gilroy') ? 400 : 400,
                opacity: 0.9
              }}
            >
              {renderFormattedText(section.content)}
            </p>
          )}
        </div>
      </div>
      <SlideFooter index={index} total={total} isExport={isExport} signature={config.watermark || config.handle || ''} formatHeight={formatHeight} bgColor={section.bgColor || '#000000'} />
    </div>
  );
});

CarouselSlide.displayName = 'CarouselSlide';
