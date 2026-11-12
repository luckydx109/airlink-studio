import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassBadgeProps {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'wifi' | 'usb';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  className,
  dot = false,
}) => {
  const variantStyles = {
    brand: 'bg-brand-500/15 text-brand-300 border-brand-400/25',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-400/25',
    neutral: 'bg-white/[0.06] text-slate-300 border-white/10',
    wifi: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/25',
    usb: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/25',
  }[variant];

  const dotColors = {
    brand: 'bg-brand-400 shadow-[0_0_8px_#38a8f8]',
    success: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    warning: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    danger: 'bg-rose-400 shadow-[0_0_8px_#f87171]',
    neutral: 'bg-slate-400',
    wifi: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
    usb: 'bg-indigo-400 shadow-[0_0_8px_#818cf8]',
  }[variant];

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-md',
          variantStyles,
          className
        )
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', dotColors)} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

