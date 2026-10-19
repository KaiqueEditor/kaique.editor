import { useEffect, useState } from 'react';
import { Check, FileText, Images, Video } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Dialog, Segmented, cx } from '../../ui';
import { SlideThumb, useFormat } from '../editor/shared';

export type ExportKind = 'zip' | 'pdf';
export type ExportQuality = 1 | 2;

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  step?: string | null;
  onExport: (opts: { kind: ExportKind; indices: number[]; pixelRatio: ExportQuality }) => Promise<void> | void;
}

/** Folha de exportação: formato, quais slides e qualidade, antes de baixar. */
export function ExportDialog({ open, onClose, busy, step, onExport }: ExportDialogProps) {
  const sections = useStore(s => s.sections);
  const fmt = useFormat();
  const [kind, setKind] = useState<ExportKind>('zip');
  const [quality, setQuality] = useState<'1' | '2'>('1');
  const [picked, setPicked] = useState<Set<number>>(new Set());

  // Ao abrir, todos os slides vêm marcados.
  useEffect(() => { if (open) setPicked(new Set(sections.map((_, i) => i))); }, [open, sections.length]);

  const toggle = (i: number) => setPicked(prev => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  const all = picked.size === sections.length;
  const indices = [...picked].sort((a, b) => a - b);
  const videos = indices.filter(i => sections[i]?.videoUrl).length;
  const px = fmt.width * Number(quality);

  return (
    <Dialog
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      title="Exportar"
      description={`${fmt.label} · ${fmt.width}×${fmt.height}`}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button variant="primary" loading={busy} disabled={indices.length === 0}
            onClick={async () => { await onExport({ kind, indices, pixelRatio: Number(quality) as ExportQuality }); }}>
            {busy ? (step || 'Exportando') : `Exportar ${indices.length} ${indices.length === 1 ? 'slide' : 'slides'}`}
          </Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-footnote font-medium text-fg-2">Formato</span>
          <Segmented<ExportKind> label="Formato do arquivo" value={kind} onChange={setKind}
            options={[
              { value: 'zip', label: <><Images size={15} />Imagens</> },
              { value: 'pdf', label: <><FileText size={15} />PDF</> },
            ]} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-footnote font-medium text-fg-2">Qualidade</span>
          <Segmented<'1' | '2'> label="Qualidade" value={quality} onChange={setQuality}
            options={[{ value: '1', label: 'Instagram' }, { value: '2', label: 'Alta' }]} />
        </div>
      </div>
      <p className="text-caption text-faint -mt-2">
        {kind === 'zip' ? 'Um PNG por slide; slides com vídeo saem como MP4 de 15 s.' : 'Um PDF com uma página por slide.'}
        {' '}Largura: {px} px{quality === '1' ? ', o tamanho que o Instagram usa.' : '.'}
      </p>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-footnote font-medium text-fg-2">Slides <span className="text-faint tabular-nums">{indices.length}/{sections.length}</span></span>
          <Button size="sm" variant="ghost" onClick={() => setPicked(all ? new Set() : new Set(sections.map((_, i) => i)))}>
            {all ? 'Desmarcar todos' : 'Marcar todos'}
          </Button>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2.5 max-h-[38vh] overflow-y-auto p-0.5">
          {sections.map((s, i) => {
            const on = picked.has(i);
            return (
              <li key={s.id}>
                <button type="button" onClick={() => toggle(i)} aria-pressed={on} aria-label={`Slide ${i + 1}`}
                  className={cx('relative block w-full rounded-ui-sm overflow-hidden transition-[opacity,box-shadow]',
                    on ? 'ring-2 ring-accent' : 'opacity-40 ring-1 ring-fg/10')}>
                  <SlideThumb section={s} index={i} total={sections.length} width={72} className="w-full" />
                  <span className={cx('absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center',
                    on ? 'bg-accent text-on-accent' : 'bg-black/50 text-transparent')} aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {s.videoUrl && <Video size={12} className="absolute bottom-1 left-1 text-white drop-shadow" aria-hidden="true" />}
                  <span className="absolute bottom-1 right-1.5 text-caption2 font-semibold text-white drop-shadow tabular-nums" aria-hidden="true">{i + 1}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {kind === 'pdf' && videos > 0 && (
          <p className="text-caption text-faint">{videos} {videos === 1 ? 'slide tem' : 'slides têm'} vídeo: no PDF entra o quadro parado.</p>
        )}
      </div>
    </Dialog>
  );
}
