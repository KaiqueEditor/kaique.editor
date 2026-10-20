import { useEffect, useState } from 'react';
import { focusTextField, onEditRequest } from '../../../lib/editorEvents';
import { Image as ImageIcon, Palette, Type } from 'lucide-react';
import { Tabs } from '../../../ui';
import { useActiveSection } from '../shared';
import { TextPanel } from './TextPanel';
import { ImagePanel } from './ImagePanel';
import { StylePanel } from './StylePanel';

type Tab = 'texto' | 'imagem' | 'estilo';

interface InspectorProps {
  onImageUpload: (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (sectionId: string, file: File) => void;
  onDownloadSlide: (index: number) => void;
}

export function Inspector(props: InspectorProps) {
  const [tab, setTab] = useState<Tab>('texto');
  useEffect(() => onEditRequest((target, focusPanel) => {
    setTab(target === 'media' ? 'imagem' : 'texto');
    if (target !== 'media' && focusPanel) focusTextField(target);
  }), []);
  const { index, sections } = useActiveSection();
  const label = index === 0 ? 'Capa' : index === sections.length - 1 ? 'Último slide' : `Slide ${index + 1}`;

  return (
    <aside aria-label="Inspetor do slide" className="glass absolute right-3.5 top-[84px] bottom-3.5 z-20 w-[336px] rounded-ui-xl flex flex-col">
      <div className="p-3 pb-0 flex flex-col gap-3">
        <Tabs<Tab>
          label="Painel do slide"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'texto', label: <span className="inline-flex items-center gap-1.5"><Type size={14} />Texto</span> },
            { value: 'imagem', label: <span className="inline-flex items-center gap-1.5"><ImageIcon size={14} />Imagem</span> },
            { value: 'estilo', label: <span className="inline-flex items-center gap-1.5"><Palette size={14} />Estilo</span> },
          ]}
        />
        <p className="px-1 text-footnote text-muted">Editando: <span className="text-fg font-medium">{label}</span></p>
      </div>
      <div role="tabpanel" aria-label={tab} className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 pt-4">
        {tab === 'texto' && <TextPanel />}
        {tab === 'imagem' && <ImagePanel {...props} />}
        {tab === 'estilo' && <StylePanel />}
      </div>
    </aside>
  );
}
