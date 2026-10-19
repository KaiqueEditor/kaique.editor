import React, { useId } from 'react';
import { cx } from './cx';

// Campos preenchidos, sem borda, com anel azul no foco (estilo iOS).
const CONTROL =
  'w-full bg-fg/[0.07] border border-transparent text-fg text-subhead rounded-ui-sm placeholder:text-faint ' +
  'transition-[background-color,box-shadow] duration-200 ease-out hover:bg-fg/[0.09] ' +
  'focus:outline-none focus:bg-fg/[0.05] focus:ring-4 focus:ring-accent/30 focus:border-accent disabled:opacity-50';

interface FieldProps {
  label: string;
  /** Valor exibido à direita do rótulo (ex.: "70%"). */
  aside?: React.ReactNode;
  hint?: string;
  className?: string;
  children: (id: string) => React.ReactNode;
}

/** Rótulo + controle ligados por id. Uso: <Field label="Título">{id => <Input id={id} />}</Field> */
export function Field({ label, aside, hint, className, children }: FieldProps) {
  const id = useId();
  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-footnote font-medium text-fg-2">{label}</label>
        {aside != null && <span className="text-footnote tabular-nums text-faint">{aside}</span>}
      </div>
      {children(id)}
      {hint && <p className="text-caption text-faint">{hint}</p>}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cx(CONTROL, 'h-control px-3', className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cx(CONTROL, 'px-3 py-2.5 leading-relaxed resize-none', className)} {...props} />;
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cx(CONTROL, 'h-control px-3 pr-8 appearance-none bg-no-repeat', className)}
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2.5'%3E%3Cpath d='m7 10 5 5 5-5'/%3E%3C/svg%3E\")",
          backgroundPosition: 'right 12px center',
        }}
        {...props}
      >
        {children}
      </select>
    );
  },
);

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

export function Slider({ value, onChange, className, ...props }: SliderProps) {
  return (
    <input
      type="range"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className={cx('w-full h-6 cursor-pointer accent-[rgb(var(--c-accent-text))]', className)}
      {...props}
    />
  );
}
