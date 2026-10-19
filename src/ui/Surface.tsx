import React from 'react';
import { cx } from './cx';

interface SurfacePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Vidro translúcido (para painéis que flutuam sobre o canvas). */
  glass?: boolean;
}

/** Painel agrupado — base de cards e seções. */
export function Panel({ glass = false, className, ...props }: SurfacePanelProps) {
  return <div className={cx(glass ? 'glass' : 'bg-surface', 'rounded-ui-lg', className)} {...props} />;
}

/** Título de seção pequeno, ex.: "Slides 9". */
export function SectionLabel({ children, count, className }: { children: React.ReactNode; count?: number; className?: string }) {
  return (
    <span className={cx('text-footnote font-semibold text-muted', className)}>
      {children}
      {count != null && <span className="ml-1.5 tabular-nums text-faint">{count}</span>}
    </span>
  );
}

interface SwatchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  color: string;
  label: string;
  selected?: boolean;
}

export function Swatch({ color, label, selected = false, className, ...props }: SwatchProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={cx(
        'w-7 h-7 rounded-full transition-transform duration-200 ease-out hover:scale-110',
        'shadow-[inset_0_0_0_1px_rgba(128,128,128,0.35)]',
        selected && 'ring-2 ring-accent-text ring-offset-2 ring-offset-bg',
        className,
      )}
      style={{ background: color }}
      {...props}
    />
  );
}

/** Ponto + texto de status, ex.: "Salvo na nuvem". */
export function StatusDot({ tone = 'ok', children }: { tone?: 'ok' | 'busy' | 'error'; children: React.ReactNode }) {
  const dot = tone === 'ok' ? 'bg-success' : tone === 'busy' ? 'bg-faint animate-pulse' : 'bg-danger';
  return (
    <span className="inline-flex items-center gap-1.5 text-footnote text-faint whitespace-nowrap" role="status">
      <span className={cx('w-[7px] h-[7px] rounded-full', dot)} aria-hidden="true" />
      {children}
    </span>
  );
}
