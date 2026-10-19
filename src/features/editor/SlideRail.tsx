import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Download, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../../store';
import { createDefaultSection } from '../../lib/sections';
import { IconButton, Menu, cx } from '../../ui';
import { SlideThumb } from './shared';

const THUMB_W = 96;

export function SlideRail({ onDownloadSlide }: { onDownloadSlide: (index: number) => void }) {
  const sections = useStore(s => s.sections);
  const activeSlide = useStore(s => s.activeSlide);
  const setActiveSlide = useStore(s => s.setActiveSlide);
  const reorderSections = useStore(s => s.reorderSections);
  const duplicateSection = useStore(s => s.duplicateSection);
  const deleteSection = useStore(s => s.deleteSection);
  const addSection = useStore(s => s.addSection);
  const userEmail = useStore(s => s.userEmail);

  const dragFrom = useRef<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length) return;
    reorderSections(from, to);
    setActiveSlide(to);
  };

  const remove = (index: number) => {
    if (sections.length <= 1) { toast('O carrossel precisa de pelo menos 1 slide.'); return; }
    deleteSection(sections[index].id);
    setActiveSlide(Math.max(0, Math.min(index, sections.length - 2)));
  };

  const add = () => {
    addSection(createDefaultSection(sections.length, userEmail));
    setActiveSlide(sections.length);
  };

  return (
    <aside aria-label="Slides" className="glass absolute left-3.5 top-[84px] bottom-3.5 z-20 w-[136px] rounded-ui-xl flex flex-col">
      <div className="px-3 pt-3.5 pb-2 text-center text-footnote font-semibold text-muted tabular-nums">
        {sections.length} {sections.length === 1 ? 'slide' : 'slides'}
      </div>

      <ol className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 pb-3 flex flex-col items-center gap-3">
        {sections.map((s, i) => {
          const active = i === activeSlide;
          return (
            <li
              key={s.id}
              className="relative group"
              draggable
              onDragStart={e => { dragFrom.current = i; e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={e => { if (dragFrom.current !== null) { e.preventDefault(); setDropAt(i); } }}
              onDragLeave={() => setDropAt(d => (d === i ? null : d))}
              onDrop={e => {
                e.preventDefault();
                if (dragFrom.current !== null && dragFrom.current !== i) move(dragFrom.current, i);
                dragFrom.current = null; setDropAt(null);
              }}
              onDragEnd={() => { dragFrom.current = null; setDropAt(null); }}
            >
              {dropAt === i && dragFrom.current !== i && (
                <span className="absolute -top-2 left-0 right-0 h-[3px] rounded-full bg-accent-text" aria-hidden="true" />
              )}
              <button
                type="button"
                onClick={() => setActiveSlide(i)}
                aria-label={`Slide ${i + 1}${i === 0 ? ' (capa)' : ''}: ${s.title || 'sem título'}`}
                aria-current={active ? 'true' : undefined}
                className={cx(
                  'block rounded-[12px] overflow-hidden transition-[box-shadow,transform] duration-200 ease-out active:scale-[0.97]',
                  active ? 'ring-2 ring-accent-text ring-offset-2 ring-offset-transparent' : 'ring-1 ring-fg/10 hover:ring-fg/25',
                )}
              >
                <SlideThumb section={s} index={i} total={sections.length} width={THUMB_W} />
              </button>
              <span className={cx(
                'absolute left-1.5 bottom-1.5 min-w-[20px] h-5 px-1.5 rounded-pill text-caption2 font-semibold tabular-nums',
                'flex items-center justify-center bg-black/55 text-white backdrop-blur',
              )} aria-hidden="true">{i + 1}</span>

              <Menu
                align="start"
                className="absolute right-1 top-1"
                items={[
                  { label: 'Duplicar', icon: <Copy size={15} />, onSelect: () => { duplicateSection(s.id); setActiveSlide(i + 1); } },
                  { label: 'Mover para cima', icon: <ArrowUp size={15} />, onSelect: () => move(i, i - 1), disabled: i === 0 },
                  { label: 'Mover para baixo', icon: <ArrowDown size={15} />, onSelect: () => move(i, i + 1), disabled: i === sections.length - 1 },
                  { label: s.videoUrl ? 'Baixar MP4' : 'Baixar PNG', icon: <Download size={15} />, onSelect: () => onDownloadSlide(i) },
                  { label: 'Apagar', icon: <Trash2 size={15} />, onSelect: () => remove(i), danger: true, separated: true },
                ]}
                trigger={p => (
                  <button {...p} type="button" aria-label={`Opções do slide ${i + 1}`}
                    className={cx(
                      'w-7 h-7 rounded-full flex items-center justify-center bg-black/55 text-white backdrop-blur transition-opacity',
                      p['aria-expanded'] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                    )}>
                    <MoreHorizontal size={15} />
                  </button>
                )}
              />
            </li>
          );
        })}
      </ol>

      <div className="p-3 pt-0 flex justify-center">
        <IconButton label="Adicionar slide" onClick={add} className="w-11 h-11 bg-fg/10 hover:bg-fg/[0.15] text-fg">
          <Plus size={19} />
        </IconButton>
      </div>
    </aside>
  );
}
