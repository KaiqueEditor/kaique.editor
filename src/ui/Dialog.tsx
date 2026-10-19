import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { cx } from './cx';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/** Janela modal em vidro. Esc ou clique fora fecha; o foco volta para quem abriu. */
export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const first = panelRef.current?.querySelector<HTMLElement>('textarea, input, select, button:not([data-dialog-close])');
    first?.focus();
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cx('glass-strong relative w-full max-w-lg rounded-ui-xl p-6 flex flex-col gap-5 animate-scale-in', className)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-title3 font-semibold">{title}</h2>
            {description && <p id={descId} className="text-subhead text-muted">{description}</p>}
          </div>
          <IconButton label="Fechar" onClick={onClose} data-dialog-close className="-mr-2 -mt-1"><X size={18} /></IconButton>
        </div>
        {children}
        {footer && <div className="flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
