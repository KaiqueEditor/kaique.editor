import { useDeferredValue, useMemo, useState } from 'react';
import { LayoutTemplate, MessageSquareText, PanelsTopLeft, Plus } from 'lucide-react';
import { useStore } from '../../store';
import { buildSectionsFromText, type TextMode } from '../../lib/buildSections';
import { Button, Dialog, cx } from '../../ui';
import { SlideThumb } from '../editor/shared';

interface NewCarouselDialogProps {
  open: boolean;
  /** Primeira vez na plataforma: muda o título e a mensagem. */
  first?: boolean;
  busy?: boolean;
  onClose: () => void;
  onCreate: (text: string, mode: TextMode) => void;
  onBlank: () => void;
  onTemplates: () => void;
}

const EXAMPLES: Record<TextMode, string> = {
  feed: `texto 1
3 erros que travam o crescimento do seu perfil

texto 2
Postar sem constância
texto 3
O algoritmo entrega mais para quem aparece toda semana. Escolha 3 dias e cumpra.

texto 4
Falar com todo mundo
texto 5
Quem tenta agradar todos não conecta com ninguém. Escreva para uma pessoa.

texto 6
Não pedir nada
texto 7
Termine com uma ação clara: salvar, comentar ou compartilhar.`,
  x: `Ninguém te conta isso sobre consistência.

Ela não é sobre motivação. É sobre aparecer nos dias em que ninguém está olhando.

Quem posta toda semana por um ano ganha de quem posta todo dia por um mês.

Salva esse post e manda pra quem precisa ler.`,
};

const FORMATS: { value: TextMode; title: string; text: string; icon: React.ReactNode }[] = [
  { value: 'feed', title: 'Feed', text: 'Título grande, imagem e texto de apoio', icon: <PanelsTopLeft size={18} /> },
  { value: 'x', title: 'Post do X', text: 'Visual de tweet, texto limpo', icon: <MessageSquareText size={18} /> },
];

/** Criação rápida: formato + texto, com prévia dos slides enquanto digita. */
export function NewCarouselDialog({ open, first, busy, onClose, onCreate, onBlank, onTemplates }: NewCarouselDialogProps) {
  const [mode, setMode] = useState<TextMode>('feed');
  const [text, setText] = useState('');
  const email = useStore(s => s.userEmail);
  const deferred = useDeferredValue(text);
  const slides = useMemo(() => buildSectionsFromText(deferred, mode, email), [deferred, mode, email]);

  const create = () => {
    if (!slides.length) return;
    onCreate(text, mode);
    setText('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-3xl"
      title={first ? 'Vamos criar seu primeiro carrossel' : 'Novo carrossel'}
      description="Escolha o formato e cole o texto. Cada parte vira um slide, e dá para ajustar tudo depois."
      footer={
        <div className="w-full flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" icon={<Plus size={15} />} onClick={onBlank}>Em branco</Button>
            <Button variant="ghost" size="sm" icon={<LayoutTemplate size={15} />} onClick={onTemplates}>Modelos</Button>
          </div>
          <Button variant="primary" loading={busy} disabled={!slides.length} onClick={create}>
            {slides.length ? `Criar ${slides.length} ${slides.length === 1 ? 'slide' : 'slides'}` : 'Criar carrossel'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div role="radiogroup" aria-label="Formato" className="grid grid-cols-2 gap-2.5">
          {FORMATS.map(f => (
            <button key={f.value} type="button" role="radio" aria-checked={mode === f.value} onClick={() => { setMode(f.value); if (text === EXAMPLES[mode]) setText(EXAMPLES[f.value]); }}
              className={cx(
                'flex items-center gap-3 p-3.5 rounded-ui-md text-left transition-colors border',
                mode === f.value ? 'border-fg bg-fg/[0.06]' : 'border-line hover:border-fg/40',
              )}>
              <span className={cx('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', mode === f.value ? 'bg-fg text-bg' : 'bg-fg/[0.08] text-muted')} aria-hidden="true">{f.icon}</span>
              <span className="flex flex-col min-w-0">
                <span className="text-subhead font-semibold">{f.title}</span>
                <span className="text-footnote text-muted">{f.text}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="new-carousel-text" className="text-footnote font-medium text-muted">
              {mode === 'x' ? 'Texto (um post por parágrafo)' : 'Roteiro (“texto 1”, “texto 2”… ou parágrafos)'}
            </label>
            {!text && (
              <button type="button" onClick={() => setText(EXAMPLES[mode])} className="text-footnote font-medium underline underline-offset-4 hover:no-underline">
                Usar exemplo
              </button>
            )}
          </div>
          <textarea
            id="new-carousel-text"
            data-autofocus
            rows={7}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={mode === 'x' ? 'Cole aqui o seu texto. Deixe uma linha em branco entre os posts.' : 'Cole aqui o seu roteiro. Deixe uma linha em branco entre os slides.'}
            className="w-full rounded-ui-md bg-fg/[0.06] px-3.5 py-3 text-subhead leading-relaxed outline-none focus:ring-4 focus:ring-accent/30 resize-y"
          />
        </div>

        <div className="flex flex-col gap-2" aria-live="polite">
          <span className="text-footnote text-muted tabular-nums">
            {slides.length ? `Prévia · ${slides.length} ${slides.length === 1 ? 'slide' : 'slides'}` : 'A prévia aparece aqui enquanto você escreve.'}
          </span>
          <div className="flex gap-2.5 overflow-x-auto pb-1 min-h-[136px]">
            {slides.slice(0, 8).map((s, i) => (
              <SlideThumb key={s.id} section={s} index={i} total={slides.length} width={102} className="rounded-ui-sm flex-shrink-0 ring-1 ring-fg/10" />
            ))}
            {!slides.length && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[102px] h-[136px] rounded-ui-sm bg-fg/[0.05] flex-shrink-0" aria-hidden="true" />
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
