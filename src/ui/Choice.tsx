import React, { useRef } from 'react';
import { cx } from './cx';

export interface ChoiceOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Nome acessível quando o rótulo é só um ícone. */
  ariaLabel?: string;
}

// T vem de `value` (o tipo do estado); opções e onChange não ampliam para string.
interface ChoiceProps<T extends string> {
  options: ChoiceOption<NoInfer<T>>[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
  label: string;
  className?: string;
}

/** Setas do teclado movem a seleção entre as opções (padrão WAI de tabs/radios). */
function useArrowKeys<T extends string>(options: ChoiceOption<T>[], value: T, onChange: (v: T) => void) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = options.findIndex(o => o.value === value);
    const next = (i + dir + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return { refs, onKeyDown };
}

/** Abas em cápsula — para trocar de painel (Texto · Imagem · Estilo). */
export function Tabs<T extends string>({ options, value, onChange, label, className }: ChoiceProps<T>) {
  const { refs, onKeyDown } = useArrowKeys(options, value, onChange);
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown}
      className={cx('flex p-[3px] gap-[3px] rounded-pill bg-fg/[0.07]', className)}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={el => { refs.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={o.ariaLabel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex-1 min-w-0 h-8 px-2.5 rounded-pill text-footnote whitespace-nowrap transition-[background-color,color,box-shadow] duration-200 ease-out',
              selected
                ? 'bg-raised text-fg font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-muted hover:text-fg',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Controle segmentado — para escolher um valor (alinhamento, formato). */
export function Segmented<T extends string>({ options, value, onChange, label, className }: ChoiceProps<T>) {
  const { refs, onKeyDown } = useArrowKeys(options, value, onChange);
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown}
      className={cx('flex gap-[2px] p-[2px] rounded-ui-sm bg-fg/[0.07]', className)}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={el => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.ariaLabel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex-1 h-7 px-2 inline-flex items-center justify-center gap-1.5 rounded-ui-sm text-footnote transition-[background-color,color] duration-200 ease-out',
              selected ? 'bg-raised text-fg font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.18)]' : 'text-muted hover:text-fg',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
