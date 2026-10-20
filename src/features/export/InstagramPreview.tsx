import { useEffect, useRef, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Download, Heart, MessageCircle, MoreHorizontal, Send, X } from 'lucide-react';
import { useStore } from '../../store';
import { Button, IconButton, Segmented, cx } from '../../ui';
import { SlideThumb, useFormat } from '../editor/shared';
import { plainText } from '../../utils/formatters';

type Mode = 'post' | 'grade';

interface InstagramPreviewProps {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
}

/** "Visualizar": o carrossel como um post no feed do Instagram, ou todos os slides em grade. */
export function InstagramPreview({ open, onClose, onExport }: InstagramPreviewProps) {
  const sections = useStore(s => s.sections);
  const config = useStore(s => s.config);
  const fmt = useFormat();
  const [mode, setMode] = useState<Mode>('post');
  const [index, setIndex] = useState(0);
  const [cardW, setCardW] = useState(400);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    const fit = () => setCardW(Math.min(420, window.innerWidth - 32));
    fit();
    window.addEventListener('resize', fit);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('resize', fit); window.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!open) return null;

  const mediaH = Math.round(cardW * (fmt.height / fmt.width));
  const handle = (config.handle || config.watermark || 'seuperfil').replace(/^@/, '');
  const caption = config.caption?.trim() || plainText(sections[0]?.title ?? '').replace(/\n/g, ' ');

  function go(delta: number) {
    const el = scroller.current;
    if (!el) return;
    const next = Math.max(0, Math.min(sections.length - 1, Math.round(el.scrollLeft / el.clientWidth) + delta));
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  }

  return (
    <div className="fixed inset-0 z-[250] flex flex-col items-center bg-black/55 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="glass sticky top-3 z-10 mt-3 h-12 rounded-pill flex items-center gap-2 px-1.5">
        <Segmented<Mode> label="Modo de visualização" value={mode} onChange={setMode} className="bg-transparent rounded-pill [&>button]:rounded-pill [&>button]:px-4"
          options={[{ value: 'post', label: 'Post' }, { value: 'grade', label: 'Grade', ariaLabel: 'Todos os slides em grade' }]} />
        <Button size="sm" variant="primary" icon={<Download size={14} />} onClick={onExport}>Exportar</Button>
        <IconButton label="Fechar" onClick={onClose}><X size={18} /></IconButton>
      </div>

      {mode === 'post' ? (
        <div className="my-auto py-8 flex items-center gap-4">
          <IconButton label="Slide anterior" onClick={() => go(-1)} disabled={index === 0} className="hidden md:inline-flex glass w-11 h-11">
            <ChevronLeft size={20} />
          </IconButton>

          {/* Post do feed */}
          <article className="bg-bg text-fg rounded-ui-lg overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] font-sans" style={{ width: cardW }}>
            <header className="h-14 px-3 flex items-center gap-2.5">
              <span className="p-[2px] rounded-full bg-story">
                <span className="block p-[2px] rounded-full bg-bg">
                  {config.avatarUrl
                    ? <img src={config.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    : <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-footnote font-semibold">{handle.charAt(0).toUpperCase()}</span>}
                </span>
              </span>
              <span className="text-footnote font-semibold flex-1 truncate">{handle}</span>
              <MoreHorizontal size={18} aria-hidden="true" />
            </header>

            <div className="relative bg-black" style={{ height: mediaH }}>
              <div
                ref={scroller}
                className="h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
                onScroll={e => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              >
                {sections.map((s, i) => (
                  <div key={s.id} className="snap-center flex-shrink-0" style={{ width: cardW, height: mediaH }}>
                    <SlideThumb section={s} index={i} total={sections.length} width={cardW} />
                  </div>
                ))}
              </div>
              <span className="absolute top-3 right-3 h-6 px-2.5 rounded-full bg-black/60 text-white text-caption font-medium tabular-nums flex items-center">
                {index + 1}/{sections.length}
              </span>
            </div>

            <div className="px-3 pt-2.5 pb-1 flex items-center gap-4">
              <Heart size={24} aria-hidden="true" />
              <MessageCircle size={24} aria-hidden="true" />
              <Send size={22} aria-hidden="true" />
              <span className="flex-1 flex justify-center gap-1" aria-hidden="true">
                {sections.slice(0, 12).map((s, i) => (
                  <span key={s.id} className={cx('w-1.5 h-1.5 rounded-full transition-colors', i === index ? 'bg-accent-text' : 'bg-fg/25')} />
                ))}
              </span>
              <Bookmark size={24} aria-hidden="true" />
            </div>
            <p className="px-3 pb-4 text-footnote leading-snug whitespace-pre-line line-clamp-3">
              <span className="font-semibold mr-1.5">{handle}</span>
              <span className="text-fg-2">
                {caption.split(/(#[\p{L}\p{N}_]+)/u).map((part, i) =>
                  part.startsWith('#') ? <span key={i} className="text-[#4f8fe8]">{part}</span> : part)}
              </span>
            </p>
          </article>

          <IconButton label="Próximo slide" onClick={() => go(1)} disabled={index === sections.length - 1} className="hidden md:inline-flex glass w-11 h-11">
            <ChevronRight size={20} />
          </IconButton>
        </div>
      ) : (
        <ul className="w-full max-w-6xl px-4 py-8 flex flex-wrap justify-center gap-4">
          {sections.map((s, i) => (
            <li key={s.id} className="relative rounded-ui-md overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
              <SlideThumb section={s} index={i} total={sections.length} width={Math.min(200, (cardW - 16) / 2)} />
              <span className="absolute top-2 left-2 h-6 min-w-[24px] px-2 rounded-full bg-black/60 text-white text-caption font-semibold tabular-nums flex items-center justify-center">{i + 1}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
