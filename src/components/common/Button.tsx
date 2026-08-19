import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-brand text-white shadow-glow-primary hover:shadow-glow-lg focus-visible:ring-brand-400',
  secondary:
    'bg-white/70 text-gray-800 hover:bg-white dark:bg-gray-700/70 dark:text-gray-100 dark:hover:bg-gray-600/70 focus-visible:ring-gray-400 border border-gray-200/70 dark:border-white/10',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100/70 dark:text-gray-300 dark:hover:bg-gray-800/70 focus-visible:ring-gray-400',
  danger:
    'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400',
};

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      disabled={disabled}
      // Standard HTML button props are forwarded to the motion element.
      // The cast reconciles Framer's HTMLMotionProps with React's
      // ButtonHTMLAttributes (they diverge on a few animation/drag handlers).
      {...(props as HTMLMotionProps<'button'>)}
    >
      {children}
    </motion.button>
  );
}
