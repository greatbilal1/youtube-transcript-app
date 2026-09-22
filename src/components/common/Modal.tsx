import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Dialog.Content asChild>
                <motion.div
                  className={cn(
                    'glass-strong w-full max-w-2xl rounded-2xl flex flex-col',
                    'max-h-[90vh]',
                    className,
                  )}
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center justify-between border-b border-gray-200/70 px-5 py-4 dark:border-white/10">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="overflow-y-auto p-5">{children}</div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
