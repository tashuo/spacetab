import type { Toast } from '@/stores/space-store'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export function ToastStack({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 min-w-[260px] max-w-[400px] pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`toast-in pointer-events-auto px-3.5 py-2.5 text-xs text-left rounded-lg shadow-lg border ${
            t.kind === 'error'
              ? 'bg-red-600 text-white border-red-700/30'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {t.text}
        </button>
      ))}
    </div>
  )
}
