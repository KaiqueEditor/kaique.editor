import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageDown, Pause, Play } from 'lucide-react';
import { useStore } from '../../store';
import { EXPORT_FORMATS } from '../../types/carousel.types';
import { CarouselSlide } from '../../components/carousel/CarouselSlide';
import { IconButton, Segmented, cx } from '../../ui';
import { useFormat } from './shared';
import { handleSlideClick } from '../../lib/editorEvents';

const TOP_RESERVE = 64;    // pílula de formato
const BOTTOM_RESERVE = 76; // pílula de navegação
const SIDE_PAD = 24;

interface CanvasStageProps {
  onAvatarClick: () => void;
  onVideoUpload: (sectionId: string, file: File) => void;
}

export function CanvasStage({ onAvatarClick, onVideoUpload }: CanvasStageProps) {
  const sections = useStore(s => s.sections);
  const activeSlide = useStore(s => s.activeSlide);
  const setActiveSlide = useStore(s => s.setActiveSlide);
  const config = useStore(s => s.config);
  const exportFormat = useStore(s => s.exportFormat);
  const setExportFormat = useStore(s => s.setExportFormat);
  const updateSection = useStore(s => s.updateSection);
  const generatingIds = useStore(s => s.generatingIds);
  const fmt = useFormat();

  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [playing, setPlaying] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Encaixa o slide no espaço livre entre as barras de vidro.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      setBox({ width, height });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = Math.max(0.1, Math.min(
    (box.width - SIDE_PAD * 2) / fmt.width,
    (box.height - TOP_RESERVE - BOTTOM_RESERVE) / fmt.height,
  ));

  // Reprodução automática dos slides.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const { activeSlide: cur, sections: list } = useStore.getState();
      if (cur >= list.length - 1) { setPlaying(false); setActiveSlide(0); }
      else setActiveSlide(cur + 1);
    }, 2500);
    return () => clearInterval(t);
  }, [playing, setActiveSlide]);

  const section = sections[activeSlide];
  if (!section) return null;

  const go = (i: number) => { setPlaying(false); setActiveSlide(Math.max(0, Math.min(sections.length - 1, i))); };

  const onDrop = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => { if (typeof reader.result === 'string') updateSection(section.id, { imageUrl: reader.result, videoUrl: undefined, showSocialImage: true }); };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      onVideoUpload(section.id, file);
    }
  };

  return (
    <div ref={boxRef} className="absolute left-[164px] right-[364px] top-[84px] bottom-3.5"
      onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragOver(true); } }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="glass absolute top-0 left-1/2 -translate-x-1/2 z-10 h-10 rounded-pill p-[3px] flex items-center">
        <Segmented
          label="Formato"
          value={exportFormat}
          onChange={setExportFormat}
          className="bg-transparent rounded-pill [&>button]:rounded-pill [&>button]:px-3.5"
          options={EXPORT_FORMATS.map(f => ({ value: f.key, label: f.label, ariaLabel: `${f.label} (${f.ratio})` }))}
        />
        <span className="w-px h-[18px] bg-fg/15 mx-1.5" aria-hidden="true" />
        <span className="pr-3 pl-1 text-footnote tabular-nums text-muted" aria-label="Zoom">{Math.round(scale * 100)}%</span>
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-[4px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] transition-[width,height] duration-300 ease-out"
        style={{
          top: TOP_RESERVE + Math.max(0, (box.height - TOP_RESERVE - BOTTOM_RESERVE - fmt.height * scale) / 2),
          width: fmt.width * scale,
          height: fmt.height * scale,
        }}
      >
        <div className="editable-slide" onClick={handleSlideClick} style={{ width: fmt.width, height: fmt.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <CarouselSlide
            section={section}
            config={config}
            index={activeSlide}
            total={sections.length}
            isExport
            isGenerating={generatingIds.includes(section.id)}
            onAvatarClick={onAvatarClick}
            formatWidth={fmt.width}
            formatHeight={fmt.height}
          />
        </div>
        {dragOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm text-white">
            <ImageDown size={28} aria-hidden="true" />
            <span className="text-subhead font-semibold">Solte para usar neste slide</span>
          </div>
        )}
      </div>

      <nav aria-label="Navegação entre slides" className="glass absolute bottom-2 left-1/2 -translate-x-1/2 z-10 h-11 rounded-pill p-1 flex items-center gap-1">
        <IconButton label="Slide anterior" onClick={() => go(activeSlide - 1)} disabled={activeSlide === 0}><ChevronLeft size={18} /></IconButton>
        <IconButton label={playing ? 'Pausar' : 'Reproduzir'} onClick={() => setPlaying(p => !p)} active={playing}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </IconButton>
        <span className={cx('px-2 text-footnote font-medium tabular-nums')} aria-live="polite">
          {activeSlide + 1} de {sections.length}
        </span>
        <IconButton label="Próximo slide" onClick={() => go(activeSlide + 1)} disabled={activeSlide === sections.length - 1}><ChevronRight size={18} /></IconButton>
      </nav>
    </div>
  );
}
