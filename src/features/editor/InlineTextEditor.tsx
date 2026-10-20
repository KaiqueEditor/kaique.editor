import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MarkToolbar, RichEditable, type RichEditableHandle } from './RichEditable';

export type InlineField = 'title' | 'content';

export interface InlineEditTarget {
  field: InlineField;
  /** Posição do cursor no texto visível (sem os códigos). */
  caret: number | 'end';
  /** Geometria no espaço do slide (px de 1080), já descontado o zoom da tela. */
  left: number;
  top: number;
  width: number;
  /** Escala extra do bloco (posts que encolhem para caber). */
  localScale: number;
  style: React.CSSProperties;
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
export function measureInlineTarget(el: HTMLElement, stage: HTMLElement, zoom: number, x: number, y: number): InlineEditTarget {
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
    caret: visible ?? 'end',
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
  /** Onde desenhar a barra de cores (fora do slide, que fica reduzido na tela). */
  toolbarHost?: HTMLElement | null;
  /** Canto superior esquerdo do texto, em px do `toolbarHost`. */
  toolbarAt?: { left: number; top: number };
}

/** Campo posicionado sobre o texto do slide, com a mesma tipografia e as cores já aplicadas. */
export function InlineTextEditor({ target, value, onChange, onDone, toolbarHost, toolbarAt }: InlineTextEditorProps) {
  const editor = useRef<RichEditableHandle>(null);
  const [hasSelection, setHasSelection] = useState(false);

  // Abre com o cursor exatamente onde a pessoa clicou
  useEffect(() => { editor.current?.focusAt(target.caret); }, [target]);

  return (
    <>
      <RichEditable
        ref={editor}
        value={value}
        onChange={onChange}
        onSelectionChange={setHasSelection}
        ariaLabel={target.field === 'title' ? 'Título do slide' : 'Texto de apoio do slide'}
        onBlur={onDone}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onDone(); } }}
        onClick={e => e.stopPropagation()}
        className="absolute z-20 m-0 p-0 border-0 bg-transparent outline-none"
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
      {hasSelection && toolbarHost && toolbarAt && createPortal(
        <div className="absolute z-40 -translate-y-full pb-3" style={{ left: toolbarAt.left, top: toolbarAt.top }}>
          <MarkToolbar editor={editor} />
        </div>,
        toolbarHost,
      )}
    </>
  );
}
