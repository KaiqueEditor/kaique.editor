import { useEffect, useLayoutEffect, useRef } from 'react';

export type InlineField = 'title' | 'content';

export interface InlineEditTarget {
  field: InlineField;
  /** Posição do cursor no texto bruto (com as marcações **, ==…). */
  caret: number;
  /** Geometria no espaço do slide (px de 1080), já descontado o zoom da tela. */
  left: number;
  top: number;
  width: number;
  /** Escala extra do bloco (posts que encolhem para caber). */
  localScale: number;
  style: React.CSSProperties;
}

// Marcações que o renderFormattedText esconde (=1=, ==, **, *, _, ~, ^, { })
const MARKER = /^(=\d=|==|\*\*|\*|_|~|\^|\{|\})/;

/** Converte a posição no texto visível do slide para a posição no texto bruto. */
export function rawIndexFromVisible(raw: string, visible: number) {
  let v = 0;
  let i = 0;
  while (i < raw.length) {
    const m = raw.slice(i).match(MARKER);
    if (m) { i += m[0].length; continue; }
    if (v === visible) return i;
    v++;
    i++;
  }
  return raw.length;
}

/** Quantos caracteres visíveis existem antes do ponto clicado dentro de `el`. */
function visibleOffsetAt(el: HTMLElement, x: number, y: number) {
  const doc = el.ownerDocument as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  let node: Node | null = null;
  let offset = 0;
  if (doc.caretPositionFromPoint) {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos) { node = pos.offsetNode; offset = pos.offset; }
  } else if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(x, y);
    if (range) { node = range.startContainer; offset = range.startOffset; }
  }
  if (!node || !el.contains(node)) return null;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let count = 0;
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (t === node) return count + offset;
    count += t.textContent?.length ?? 0;
  }
  return null;
}

const COPIED = [
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform',
  'textAlign', 'color', 'textShadow', 'whiteSpace', 'wordBreak', 'overflowWrap',
] as const;

/**
 * Mede o texto clicado e devolve onde abrir o campo de edição por cima dele.
 * `stage` é o contêiner do slide em escala 1080; `zoom` é a escala da tela.
 */
export function measureInlineTarget(el: HTMLElement, stage: HTMLElement, zoom: number, raw: string, x: number, y: number): InlineEditTarget {
  const field = el.dataset.edit as InlineField;
  const box = el.parentElement ?? el;
  const stageRect = stage.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();
  const boxStyle = getComputedStyle(box);
  const effective = box.offsetWidth ? boxRect.width / box.offsetWidth : zoom;
  const localScale = effective / zoom;
  const padL = parseFloat(boxStyle.paddingLeft) || 0;
  const padR = parseFloat(boxStyle.paddingRight) || 0;

  const cs = getComputedStyle(el);
  const style: React.CSSProperties = {};
  for (const k of COPIED) (style as Record<string, string>)[k] = cs[k];

  const visible = visibleOffsetAt(el, x, y);
  return {
    field,
    caret: visible == null ? raw.length : rawIndexFromVisible(raw, visible),
    left: (boxRect.left - stageRect.left) / zoom + padL * localScale,
    top: (elRect.top - stageRect.top) / zoom,
    width: box.offsetWidth - padL - padR,
    localScale,
    style,
  };
}

interface InlineTextEditorProps {
  target: InlineEditTarget;
  value: string;
  onChange: (value: string) => void;
  onDone: () => void;
}

/** Campo transparente posicionado sobre o texto do slide, com a mesma tipografia. */
export function InlineTextEditor({ target, value, onChange, onDone }: InlineTextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Abre com o cursor exatamente onde a pessoa clicou
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(target.caret, target.caret);
  }, [target]);

  // Altura acompanha o texto
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, target]);

  return (
    <textarea
      ref={ref}
      aria-label={target.field === 'title' ? 'Título do slide' : 'Texto de apoio do slide'}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onDone}
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onDone(); } }}
      onClick={e => e.stopPropagation()}
      spellCheck
      className="absolute z-20 m-0 p-0 border-0 bg-transparent resize-none overflow-hidden outline-none"
      style={{
        ...target.style,
        left: target.left,
        top: target.top,
        width: target.width,
        transform: target.localScale !== 1 ? `scale(${target.localScale})` : undefined,
        transformOrigin: 'top left',
        caretColor: target.style.color,
        outline: '4px dashed rgb(var(--c-accent) / 0.7)',
        outlineOffset: 10,
        borderRadius: 8,
      }}
    />
  );
}
