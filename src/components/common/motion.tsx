import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Shared motion primitive wrappers for consistent entrance animations
 * across the app. FadeIn / SlideIn / ScaleIn for single elements,
 * Stagger + StaggerItem for lists/cards.
 */

const ease = [0.22, 1, 0.36, 1] as const;

function buildVariants(direction: 'up' | 'down' | 'left' | 'right', distance = 16): Variants {
  const offset: Record<string, number> = {};
  if (direction === 'up') offset.y = distance;
  if (direction === 'down') offset.y = -distance;
  if (direction === 'left') offset.x = distance;
  if (direction === 'right') offset.x = -distance;
  return {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.4, ease },
    },
  };
}

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Fade + slide in on mount. */
export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  className,
}: {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  className?: string;
}) {
  const variants = buildVariants(direction);
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/** Fade + scale on mount. */
export function ScaleIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease },
  },
};

/** Parent that staggers the entrance of child <StaggerItem>s. */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

/** A child of <Stagger>. */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}
