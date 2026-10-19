import React, { useEffect, useId, useRef, useState } from 'react';
import { cx } from './cx';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Linha separadora antes deste item. */
  separated?: boolean;
  hint?: string;
}

interface MenuProps {
  items: MenuItem[];
  align?: 'start' | 'end';
  /** Abre para cima (ex.: menus perto do rodapé). */
  side?: 'bottom' | 'top';
  className?: string;
  /** O botão que abre o menu. Recebe as props de acessibilidade e o clique. */
  trigger: (props: {
    'aria-haspopup': 'menu'; 'aria-expanded': boolean; 'aria-controls': string; onClick: () => void;
  }) => React.ReactNode;
}

/** Menu suspenso em vidro. Fecha com Esc, clique fora ou ao escolher. Setas navegam. */
export function Menu({ items, trigger, align = 'start', side = 'bottom', className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    listRef.current?.querySelector<HTMLButtonElement>('[role=menuitem]:not([disabled])')?.focus();
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const nodes = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]:not([disabled])') ?? []);
    const i = nodes.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % nodes.length : (i - 1 + nodes.length) % nodes.length;
    nodes[next]?.focus();
  };

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      {trigger({ 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': id, onClick: () => setOpen(o => !o) })}
      {open && (
        <div
          ref={listRef}
          id={id}
          role="menu"
          onKeyDown={onListKey}
          className={cx(
            'glass-strong absolute z-50 min-w-[248px] max-w-[calc(100vw-24px)] p-1.5 rounded-ui-md animate-scale-in',
            side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map(item => (
            <React.Fragment key={item.label}>
              {item.separated && <div className="my-1 h-px bg-fg/10" role="separator" />}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => { setOpen(false); item.onSelect(); }}
                className={cx(
                  'w-full h-9 px-2.5 flex items-center gap-2.5 rounded-ui-sm text-subhead text-left',
                  'transition-colors duration-150 disabled:opacity-40',
                  'hover:bg-fg/[0.08] focus:bg-fg/[0.08] focus:outline-none',
                  item.danger ? 'text-danger' : 'text-fg',
                )}
              >
                {item.icon && <span className={cx('w-4 flex justify-center', item.danger ? 'text-danger' : 'text-muted')} aria-hidden="true">{item.icon}</span>}
                <span className="flex-1 truncate">{item.label}</span>
                {item.hint && <span className="text-footnote text-faint">{item.hint}</span>}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
