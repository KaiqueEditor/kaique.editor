import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { Bold, Eraser, Italic, Strikethrough } from 'lucide-react';
import { TEXT_COLORS } from '../../lib/textMarks';
import { clearSelection, paintSelection, placeCaret, renderInto, serialize, toggleMarkSelection } from './richText';

export interface RichEditableHandle {
  paint: (code: number) => void;
  /** Liga/desliga negrito (**), itálico (_) ou riscado (~). */
  toggle: (mark: '**' | '_' | '~') => void;
  clear: () => void;
  focusAt: (offset: number | 'end') => void;
}

interface RichEditableProps {
  value: string;
  onChange: (value: string) => void;
  /** Avisa quando há (ou deixa de haver) texto selecionado no campo. */
  onSelectionChange?: (hasSelection: boolean) => void;
  /** Campo do painel: branco e preto ganham fundo para aparecer. */
  panel?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel: string;
  dataField?: string;
  placeholder?: string;
  onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Campo de texto que mostra a formatação pronta (cores, negrito) em vez dos códigos.
 * Por baixo continua lendo e gravando as marcações de sempre.
 */
export const RichEditable = forwardRef<RichEditableHandle, RichEditableProps>(function RichEditable(
  { value, onChange, onSelectionChange, panel = false, className, style, ariaLabel, dataField, placeholder, onBlur, onKeyDown, onClick },
  ref,
) {
  const el = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string | null>(null);

  // Só redesenha quando o valor veio de fora (outro campo, troca de slide);
  // enquanto a pessoa digita, o DOM já é a verdade e o cursor não pula.
  useLayoutEffect(() => {
    const root = el.current;
    if (!root || value === lastEmitted.current) return;
    root.replaceChildren();
    renderInto(root, value, panel);
    lastEmitted.current = value;
  }, [value, panel]);

  const emit = () => {
    const root = el.current;
    if (!root) return;
    const v = serialize(root);
    lastEmitted.current = v;
    onChange(v);
  };

  useImperativeHandle(ref, () => ({
    paint: code => { if (el.current && paintSelection(el.current, code, panel)) emit(); },
    toggle: mark => { if (el.current && toggleMarkSelection(el.current, mark, panel)) emit(); },
    clear: () => { if (el.current && clearSelection(el.current)) emit(); },
    focusAt: offset => { if (el.current) { el.current.focus({ preventScroll: true }); placeCaret(el.current, offset); } },
  }));

  // Seleção dentro do campo → mostra a barra de cores
  useEffect(() => {
    if (!onSelectionChange) return;
    const check = () => {
      const root = el.current;
      const sel = document.getSelection();
      onSelectionChange(!!root && !!sel && sel.rangeCount > 0 && !sel.isCollapsed && root.contains(sel.anchorNode) && root.contains(sel.focusNode));
    };
    document.addEventListener('selectionchange', check);
    return () => document.removeEventListener('selectionchange', check);
  }, [onSelectionChange]);

  return (
    <div
      ref={el}
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel}
      data-field={dataField}
      data-placeholder={placeholder}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      onInput={emit}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onClick={onClick}
      className={className}
      style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', ...style }}
    />
  );
});

/** Barra que aparece ao selecionar texto: cores, negrito e limpar. */
export function MarkToolbar({ editor }: { editor: React.RefObject<RichEditableHandle | null> }) {
  // onMouseDown + preventDefault: o campo não perde o foco nem a seleção
  const keep = (e: React.MouseEvent) => e.preventDefault();
  return (
    <div role="toolbar" aria-label="Formatar seleção" onMouseDown={keep} onPointerDown={keep}
      className="glass-strong rounded-pill h-10 px-1.5 flex items-center gap-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)] max-w-[calc(100vw-24px)] overflow-x-auto no-scrollbar">
      {TEXT_COLORS.map(c => (
        <button key={c.code} type="button" title={c.name} aria-label={`Pintar de ${c.name.toLowerCase()}`}
          onMouseDown={keep} onPointerDown={keep} onClick={() => editor.current?.paint(c.code)}
          className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
          <span className="w-5 h-5 rounded-full shadow-[inset_0_0_0_1.5px_rgba(128,128,128,0.55)]" style={{ background: c.hex }} />
        </button>
      ))}
      <span className="w-px h-5 bg-fg/15 mx-0.5" aria-hidden="true" />
      {([
        { mark: '**', label: 'Negrito', icon: <Bold size={16} /> },
        { mark: '_', label: 'Itálico', icon: <Italic size={16} /> },
        { mark: '~', label: 'Riscado', icon: <Strikethrough size={16} /> },
      ] as const).map(b => (
        <button key={b.mark} type="button" title={b.label} aria-label={b.label} onMouseDown={keep} onPointerDown={keep} onClick={() => editor.current?.toggle(b.mark)}
          className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-fg hover:bg-fg/10">{b.icon}</button>
      ))}
      <button type="button" title="Limpar formatação" aria-label="Limpar formatação" onMouseDown={keep} onPointerDown={keep} onClick={() => editor.current?.clear()}
        className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-fg hover:bg-fg/10"><Eraser size={16} /></button>
    </div>
  );
}
