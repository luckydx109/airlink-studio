import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hoverEffect?: boolean;
  blurLevel?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = false,
  hoverEffect = false,
  blurLevel = 'lg',
  ...props
}) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-xl',
    xl: 'backdrop-blur-2xl',
  }[blurLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.15 } } : undefined}
      className={twMerge(
        clsx(
          'relative rounded-2xl p-5 overflow-hidden',
          'bg-white/[0.04] dark:bg-[#111726]/60',
          'border border-white/[0.08] dark:border-white/[0.07]',
          'shadow-glass-subtle',
          blurClasses,
          glow && 'ring-1 ring-brand-400/25 shadow-glass-glow',
          hoverEffect && 'cursor-pointer hover:border-white/[0.18] hover:bg-white/[0.07] dark:hover:bg-[#161e32]/80',
          className
        )
      )}
      {...(props as any)}
    >
      {/* Specular sheen gradient on top edge */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};

