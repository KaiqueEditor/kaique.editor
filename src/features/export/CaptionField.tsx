import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useStore } from '../../store';
import { Button, cx } from '../../ui';

const MAX_CHARS = 2200;   // limite do Instagram
const MAX_TAGS = 30;

export const countHashtags = (text: string) => (text.match(/#[\p{L}\p{N}_]+/gu) ?? []).length;

/** Copia a legenda; devolve se deu certo. */
export async function copyCaption(text: string) {
  if (!text.trim()) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Legenda do post (salva no projeto) com contadores e botão de copiar. */
export function CaptionField({ rows = 4 }: { rows?: number }) {
  const caption = useStore(s => s.config.caption ?? '');
  const updateConfig = useStore(s => s.updateConfig);
  const [copied, setCopied] = useState(false);
  const tags = countHashtags(caption);
  const over = caption.length > MAX_CHARS || tags > MAX_TAGS;

  const copy = async () => {
    if (await copyCaption(caption)) {
      setCopied(true);
      toast.success('Legenda copiada');
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error('Não deu para copiar. Selecione o texto e copie manualmente.');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="post-caption" className="text-footnote font-medium text-fg-2">Legenda do post</label>
        <Button size="sm" variant="secondary" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copy} disabled={!caption.trim()}>
          {copied ? 'Copiada' : 'Copiar'}
        </Button>
      </div>
      <textarea
        id="post-caption"
        rows={rows}
        value={caption}
        onChange={e => updateConfig({ caption: e.target.value })}
        placeholder={'Escreva a legenda e as hashtags.\n\n#marketing #conteudo'}
        className="w-full rounded-ui-sm bg-fg/[0.07] px-3 py-2.5 text-subhead leading-relaxed outline-none focus:ring-4 focus:ring-accent/30 resize-y"
      />
      <p className={cx('text-caption tabular-nums text-right', over ? 'text-danger' : 'text-faint')} aria-live="polite">
        {caption.length}/{MAX_CHARS} caracteres · {tags}/{MAX_TAGS} hashtags
      </p>
    </div>
  );
}
