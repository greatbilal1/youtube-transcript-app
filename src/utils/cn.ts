import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names, filtering out falsy values and resolving Tailwind
 * conflicts (e.g. `bg-white dark:bg-gray-900` won't both apply — later
 * conflicting utilities win).
 */
export function cn(...classes: Array<ClassValue>): string {
  return twMerge(clsx(classes));
}
