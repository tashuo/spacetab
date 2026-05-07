import type { Toast } from '@/stores/space-store'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export function ToastStack({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 min-w-[260px] max-w-[400px]">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`toast-in px-3 py-2 text-xs text-left rounded shadow-lg ${
            t.kind === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {t.text}
        </button>
      ))}
    </div>
  )
}
