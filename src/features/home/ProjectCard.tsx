import { Cloud, Copy, HardDrive, MoreHorizontal, Trash2 } from 'lucide-react';
import { Menu, cx } from '../../ui';
import { SlideThumb } from '../editor/shared';
import { relativeTime, type Project } from './useProjects';
import { plainText } from '../../utils/formatters';

const CARD_W = 208;

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project: p, onOpen, onDuplicate, onDelete }: ProjectCardProps) {
  const cover = p.sections[0];
  return (
    <li className="group flex flex-col gap-2.5">
      <div className="relative">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Abrir ${plainText(p.name)}`}
          className={cx(
            'block w-full aspect-[3/4] rounded-ui-lg overflow-hidden bg-surface',
            'ring-1 ring-fg/[0.06] transition-[transform,box-shadow] duration-300 ease-out',
            'hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)] active:scale-[0.98]',
          )}
        >
          {p.thumbnailUrl ? (
            <img src={p.thumbnailUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
          ) : cover ? (
            <SlideThumb section={cover} index={0} total={p.slideCount} width={CARD_W} config={p.config} className="w-full h-full" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-footnote text-faint">Sem slides</span>
          )}
        </button>

        <span className="absolute top-2.5 left-2.5 h-6 px-2.5 rounded-pill text-caption font-semibold tabular-nums flex items-center bg-black/50 text-white backdrop-blur-md pointer-events-none">
          {p.slideCount} {p.slideCount === 1 ? 'slide' : 'slides'}
        </span>

        <Menu
          align="end"
          className="absolute top-2 right-2"
          items={[
            { label: 'Duplicar', icon: <Copy size={15} />, onSelect: onDuplicate },
            { label: 'Apagar', icon: <Trash2 size={15} />, onSelect: onDelete, danger: true, separated: true },
          ]}
          trigger={t => (
            <button {...t} type="button" aria-label={`Opções de ${p.name}`}
              className={cx(
                'w-8 h-8 rounded-full flex items-center justify-center bg-black/50 text-white backdrop-blur-md transition-opacity',
                t['aria-expanded'] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
              )}>
              <MoreHorizontal size={16} />
            </button>
          )}
        />
      </div>

      <div className="flex flex-col gap-0.5 px-0.5 min-w-0">
        <span className="text-subhead font-medium truncate" title={plainText(p.name)}>{plainText(p.name) || 'Sem título'}</span>
        <span className="flex items-center gap-1.5 text-footnote text-faint">
          {p.source === 'cloud'
            ? <Cloud size={12} aria-label="Na nuvem" />
            : <HardDrive size={12} aria-label="Só neste aparelho" />}
          {relativeTime(p.updatedAt)}
        </span>
      </div>
    </li>
  );
}
