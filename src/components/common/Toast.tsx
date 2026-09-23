import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toast notifications, powered by Sonner. The `<ToastContainer />` renders
 * the `Toaster` shell; toasts are fired via the imperative `toast` API
 * (a forwarded re-export below) so components/App can keep using it without
 * reaching into Sonner directly.
 */
export { toast } from 'sonner';

export function ToastContainer() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--toast-bg, #ffffff)',
          color: 'var(--toast-fg, #111827)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '0.75rem',
          boxShadow: '0 8px 32px -12px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(12px)',
        },
      }}
      theme="system"
      richColors
    />
  );
}
