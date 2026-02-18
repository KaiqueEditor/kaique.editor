import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-3 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl';

  const variantStyles = {
    primary: 'bg-white hover:bg-white/90 disabled:bg-white/20 text-black',
    secondary: 'bg-transparent hover:bg-white/5 text-white border border-white/15',
    ghost: 'bg-transparent hover:bg-white/8 text-white/60 hover:text-white',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-4 text-sm',
    lg: 'px-8 py-5 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" size={20} /> : icon}
      {children}
    </button>
  );
};
