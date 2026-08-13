import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-brand-500" />,
};

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(toast.id), 3500);
    return () => window.clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg',
        'bg-white dark:bg-gray-800',
        'border-gray-200 dark:border-gray-700',
      )}
    >
      {ICONS[toast.type]}
      <span className="text-sm text-gray-800 dark:text-gray-100">{toast.message}</span>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
