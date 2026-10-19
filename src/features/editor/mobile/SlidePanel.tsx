import { ArrowDown, ArrowUp, Copy, Download, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../../../store';
import { createDefaultSection } from '../../../lib/sections';
import { Button } from '../../../ui';
import { Group, useActiveSection } from '../shared';

/** Ações do slide atual no celular (no desktop ficam no menu da miniatura). */
export function SlidePanel({ onDownloadSlide }: { onDownloadSlide: (index: number) => void }) {
  const { section: s, index, sections } = useActiveSection();
  const setActiveSlide = useStore(st => st.setActiveSlide);
  const reorderSections = useStore(st => st.reorderSections);
  const duplicateSection = useStore(st => st.duplicateSection);
  const deleteSection = useStore(st => st.deleteSection);
  const addSection = useStore(st => st.addSection);
  const userEmail = useStore(st => st.userEmail);
  if (!s) return null;

  const move = (to: number) => { if (to < 0 || to >= sections.length) return; reorderSections(index, to); setActiveSlide(to); };

  return (
    <div className="flex flex-col gap-6">
      <Group title={`Slide ${index + 1} de ${sections.length}`}>
        <div className="grid grid-cols-2 gap-2">
          <Button icon={<Copy size={16} />} onClick={() => { duplicateSection(s.id); setActiveSlide(index + 1); }}>Duplicar</Button>
          <Button icon={<Download size={16} />} onClick={() => onDownloadSlide(index)}>Baixar {s.videoUrl ? 'MP4' : 'PNG'}</Button>
          <Button icon={<ArrowUp size={16} />} onClick={() => move(index - 1)} disabled={index === 0}>Para trás</Button>
          <Button icon={<ArrowDown size={16} />} onClick={() => move(index + 1)} disabled={index === sections.length - 1}>Para frente</Button>
        </div>
        <Button variant="danger" icon={<Trash2 size={16} />} disabled={sections.length <= 1}
          onClick={() => {
            deleteSection(s.id);
            setActiveSlide(Math.max(0, Math.min(index, sections.length - 2)));
            toast.success('Slide apagado');
          }}>
          Apagar slide
        </Button>
      </Group>
      <Button variant="primary" icon={<Plus size={16} />}
        onClick={() => { addSection(createDefaultSection(sections.length, userEmail)); setActiveSlide(sections.length); }}>
        Adicionar slide no final
      </Button>
    </div>
  );
}
