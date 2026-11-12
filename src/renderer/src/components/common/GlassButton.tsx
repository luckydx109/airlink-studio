import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'glass',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm font-medium rounded-xl gap-2',
    lg: 'px-6 py-3 text-base font-semibold rounded-2xl gap-2.5',
    icon: 'p-2 text-sm rounded-xl aspect-square justify-center items-center',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white shadow-lg shadow-brand-500/25 border border-white/20',
    secondary:
      'bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md',
    glass:
      'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/10 backdrop-blur-lg hover:border-white/20 shadow-sm',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 backdrop-blur-md',
    emerald:
      'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 backdrop-blur-md',
    ghost:
      'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border-transparent',
  }[variant];

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      disabled={disabled || isLoading}
      className={twMerge(
        clsx(
          'relative inline-flex items-center justify-center transition-colors select-none outline-none',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          sizeClasses,
          variantClasses,
          className
        )
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

