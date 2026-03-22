import { useToastStore } from '../../store/toastStore'

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md pointer-events-none"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={[
            'pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm transition-all',
            t.variant === 'error' &&
              'bg-red-950/90 border-red-600/60 text-red-50',
            t.variant === 'warning' &&
              'bg-amber-950/90 border-amber-600/60 text-amber-50',
            t.variant === 'success' &&
              'bg-emerald-950/90 border-emerald-600/60 text-emerald-50',
            t.variant === 'info' &&
              'bg-slate-900/90 border-slate-600/60 text-slate-100',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="flex items-start gap-3">
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded px-1"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
