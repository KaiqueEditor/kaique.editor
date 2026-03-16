import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Img, Video } from 'remotion';
import { Section, ProjectConfig } from '../../types';
import { CarouselSlide } from '../carousel/CarouselSlide';
import { SlideFooter } from '../carousel/SlideFooter';
import { getFontFamily } from '../../constants/fonts';
import { renderFormattedText } from '../../utils/formatters';

interface CarouselVideoProps {
  sections: Section[];
  config: ProjectConfig;
}

const CinematicSlide: React.FC<{ section: Section; config: ProjectConfig; index: number; total: number }> = ({ section, config, index, total }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 1. BG Scale Animation (Smooth zoom-out)
  const bgScale = interpolate(frame, [0, fps * 4], [1.12, 1], {
    extrapolateRight: 'clamp',
  });

  // 2. Title Animation (Spring up + fade)
  const titleProgress = spring({
    frame: Math.max(0, frame - 15), // starts after 15 frames
    fps,
    config: { damping: 14, mass: 0.8 },
  });
  
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  // 3. Body Animation (Delayed spring up + fade)
  const bodyProgress = spring({
    frame: Math.max(0, frame - 25), // starts after 25 frames
    fps,
    config: { damping: 14, mass: 0.8 },
  });
  
  const bodyY = interpolate(bodyProgress, [0, 1], [30, 0]);
  const bodyOpacity = interpolate(bodyProgress, [0, 1], [0, 1]);

  // 4. Footer Animation (Simple fade)
  const footerProgress = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 20 },
  });
  const footerOpacity = interpolate(footerProgress, [0, 1], [0, 1]);

  // Fallback for social-post layout (uses standard slide with fade-in scale)
  if (section.layoutType === 'social-post') {
    const socialProgress = spring({ frame, fps, config: { damping: 16 } });
    const socialOpacity = interpolate(socialProgress, [0, 1], [0, 1]);
    const socialScale = interpolate(socialProgress, [0, 1], [0.98, 1]);
    return (
      <AbsoluteFill style={{ opacity: socialOpacity, transform: `scale(${socialScale})` }}>
        <CarouselSlide
          section={section}
          config={config}
          index={index}
          total={total}
          isExport={true}
          formatWidth={width}
          formatHeight={height}
        />
      </AbsoluteFill>
    );
  }

  // Design decisions (copied from CarouselSlide)
  const isFullBg = section.layoutType === 'background';
  const scaleFactor = (height / 1440) * 2.16;
  const paddingX = 40 * scaleFactor;
  const manualTextOffset = (section.textPosY ?? 85);
  const contentPaddingBottom = manualTextOffset * 2.16;

  const finalTitleColor = section.titleColor || '#ffffff';
  const finalBodyColor = section.bodyColor || '#ffffff';
  const finalTitleSize = `${(section.titleSize || (isFullBg ? 48 : 30)) * scaleFactor}px`;
  const finalBodySize = `${(section.bodySize || (isFullBg ? 18 : 20)) * scaleFactor}px`;
  const textAlign = section.alignment || (isFullBg ? 'center' : 'left');

  const imgPosX = section.imagePosX ?? 50;
  const imgPosY = section.imagePosY ?? 50;
  const imgScale = section.imageScale ?? 1;
  const overlayOpacity = section.overlayOpacity ?? (isFullBg ? 0.4 : 0.2);
  
  const clipStart = Math.max(0, section.videoTrimStart ?? 0);

  // BG color gradient parsing
  const bg = section.bgColor || '#000000';
  const r = parseInt(bg.slice(1, 3), 16) || 0;
  const g = parseInt(bg.slice(3, 5), 16) || 0;
  const b = parseInt(bg.slice(5, 7), 16) || 0;
  const gIntensity = section.gradientIntensity ?? 0.8;
  const hasGradient = gIntensity > 0;

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      {/* Background Layer */}
      <AbsoluteFill style={{ height: isFullBg ? '100%' : `${section.imageHeight ?? 55}%`, overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', transform: `scale(${bgScale})`, transformOrigin: 'center' }}>
          {section.videoUrl ? (
            <Video
              src={section.videoUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${imgPosX}% ${imgPosY}%`, transform: `scale(${imgScale})` }}
              startFrom={Math.floor(clipStart * fps)}
            />
          ) : section.imageUrl ? (
            <Img
              src={section.imageUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${imgPosX}% ${imgPosY}%`, transform: `scale(${imgScale})` }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', opacity: 0.1, background: `linear-gradient(135deg, #ffffff, rgba(255,255,255,0.3))` }} />
          )}
        </div>
        
        {/* Overlays */}
        <AbsoluteFill style={{ backgroundColor: bg, opacity: overlayOpacity }} />
        {hasGradient && (
          <AbsoluteFill style={{
            background: `linear-gradient(to top, rgba(${r},${g},${b},1) 0%, rgba(${r},${g},${b},0.85) 3%, rgba(${r},${g},${b},0.6) 7%, rgba(${r},${g},${b},0.35) 11%, rgba(${r},${g},${b},0.12) 16%, rgba(${r},${g},${b},0.03) 20%, transparent 25%)`
          }} />
        )}
      </AbsoluteFill>

      {/* Main Text Layer */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: isFullBg ? 'center' : 'flex-start',
          justifyContent: isFullBg ? 'center' : 'flex-end',
          height: '100%',
          paddingLeft: paddingX,
          paddingRight: paddingX,
          paddingBottom: contentPaddingBottom,
          textAlign: textAlign as any,
          zIndex: 10
        }}
      >
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
          
          <h2
            style={{
              textTransform: section.titleFont === 'wide' ? 'uppercase' : undefined,
              letterSpacing: section.titleFont === 'wide' ? '-0.01em' : undefined,
              marginBottom: 24,
              lineHeight: section.titleFont === 'wide' ? 1.15 : 1.1,
              fontFamily: getFontFamily(section.titleFont || 'anton'),
              fontSize: finalTitleSize,
              color: finalTitleColor,
              textShadow: '0 4px 30px rgba(0,0,0,0.8)',
              fontWeight: section.titleFont === 'filson-pro-bold' ? 800 : section.titleFont === 'wide' ? 900 : 700,
              whiteSpace: 'pre-wrap',
              transform: `translateY(${titleY}px)`,
              opacity: titleOpacity,
            }}
          >
            {renderFormattedText(section.title)}
          </h2>

          {section.content && (
            <p
              style={{
                lineHeight: 1.5,
                fontSize: finalBodySize,
                fontFamily: getFontFamily(section.bodyFont || 'sans'),
                color: finalBodyColor,
                maxWidth: isFullBg ? '95%' : '100%',
                textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                fontWeight: section.bodyFont === 'filson-pro-bold' ? 800 : 400,
                opacity: bodyOpacity,
                transform: `translateY(${bodyY}px)`,
                whiteSpace: 'pre-wrap',
              }}
            >
              {renderFormattedText(section.content)}
            </p>
          )}

        </div>
      </div>

      {/* Footer Layer */}
      <div style={{ opacity: footerOpacity }}>
        <SlideFooter 
          index={index} 
          total={total} 
          isExport={true} 
          signature={config.watermark || config.handle || ''} 
          formatHeight={height} 
          bgColor={bg} 
        />
      </div>
    </AbsoluteFill>
  );
};


export const CarouselVideo: React.FC<CarouselVideoProps> = ({ sections = [], config }) => {
  const durationPerSlide = 120; // 4 seconds at 30fps

  if (sections.length === 0) return null;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {sections.map((section, index) => {
        return (
          <Sequence
            key={section.id}
            from={index * durationPerSlide}
            durationInFrames={durationPerSlide}
          >
            <CinematicSlide section={section} config={config} index={index} total={sections.length} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
