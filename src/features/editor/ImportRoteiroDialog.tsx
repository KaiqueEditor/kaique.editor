import { useState } from 'react';
import { MessageSquareText, PanelsTopLeft } from 'lucide-react';
import { countSlidesPreview } from '../../lib/sections';
import { splitThread } from '../../lib/xPost';
import { Button, Dialog, Field, Segmented, Textarea } from '../../ui';

export type RoteiroMode = 'feed' | 'x';

interface ImportRoteiroDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (text: string, mode: RoteiroMode) => void;
  busy: boolean;
}

const PLACEHOLDER = `texto 1
Título da capa

texto 2
Título do slide 2
texto 3
Texto de apoio do slide 2`;

export function ImportRoteiroDialog({ open, onClose, onConfirm, busy }: ImportRoteiroDialogProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<RoteiroMode>('feed');
  const count = mode === 'x' ? (text.trim() ? splitThread(text).length : 0) : countSlidesPreview(text);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Importar roteiro"
      description="Os slides atuais serão substituídos pelos do roteiro."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={busy} disabled={count === 0}
            onClick={() => { onConfirm(text, mode); setText(''); }}>
            {count > 0 ? `Gerar ${count} ${count === 1 ? 'slide' : 'slides'}` : 'Gerar slides'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented<RoteiroMode>
          label="Formato"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'feed', label: <><PanelsTopLeft size={15} />Feed</> },
            { value: 'x', label: <><MessageSquareText size={15} />Thread do X</> },
          ]}
        />
        <Field label={mode === 'x' ? 'Texto da thread' : 'Roteiro'}
          hint={mode === 'x'
            ? 'Cada parágrafo vira um post. Parágrafos com mais de 280 caracteres são divididos por frase.'
            : 'Formato "texto 1", "texto 2"… ou parágrafos separados por linha em branco.'}>
          {id => <Textarea id={id} rows={12} value={text} onChange={e => setText(e.target.value)}
            placeholder={mode === 'x' ? 'Cole aqui o texto longo, um post por parágrafo.' : PLACEHOLDER}
            className={mode === 'x' ? 'text-footnote' : 'font-mono text-footnote'} />}
        </Field>
      </div>
    </Dialog>
  );
}
