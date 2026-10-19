import React from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  loading?: boolean;
  block?: boolean;
}

// Botões em pílula, preenchidos como no iOS: azul para a ação principal,
// cinza translúcido para as demais.
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.2)]',
  secondary: 'bg-fg/10 text-fg hover:bg-fg/[0.15] font-medium',
  ghost: 'bg-transparent text-accent-text hover:bg-fg/[0.06] font-medium',
  danger: 'bg-danger/[0.14] text-danger hover:bg-danger/20 font-medium',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-footnote gap-1.5',
  md: 'h-control px-4 text-subhead gap-2',
  lg: 'h-control-lg px-5 text-body gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, loading = false, block = false, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center rounded-pill whitespace-nowrap select-none',
        'transition-[background-color,transform] duration-200 ease-out active:scale-[0.97]',
        'disabled:opacity-40 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
});

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obrigatório: botões só com ícone precisam de nome acessível. */
  label: string;
  size?: 'sm' | 'md';
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', active = false, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex items-center justify-center rounded-pill select-none',
        'transition-[background-color,transform] duration-200 ease-out active:scale-[0.94]',
        'disabled:opacity-35 disabled:pointer-events-none',
        size === 'sm' ? 'w-8 h-8' : 'w-9 h-9',
        active ? 'bg-fg/[0.12] text-fg' : 'text-fg-2 hover:bg-fg/[0.08] hover:text-fg',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
