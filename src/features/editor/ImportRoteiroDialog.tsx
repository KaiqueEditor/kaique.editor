import { useState } from 'react';
import { countSlidesPreview } from '../../lib/sections';
import { Button, Dialog, Field, Textarea } from '../../ui';

interface ImportRoteiroDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
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
  const count = countSlidesPreview(text);

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
            onClick={() => { onConfirm(text); setText(''); }}>
            {count > 0 ? `Gerar ${count} ${count === 1 ? 'slide' : 'slides'}` : 'Gerar slides'}
          </Button>
        </>
      }
    >
      <Field label="Roteiro" hint='Formato "texto 1", "texto 2"… ou parágrafos separados por linha em branco.'>
        {id => <Textarea id={id} rows={12} value={text} onChange={e => setText(e.target.value)} placeholder={PLACEHOLDER} className="font-mono text-footnote" />}
      </Field>
    </Dialog>
  );
}
