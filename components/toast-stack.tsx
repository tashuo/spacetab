import type { Toast } from '@/stores/space-store'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export function ToastStack({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1 z-20">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`px-3 py-2 text-xs text-left rounded shadow ${
            t.kind === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {t.text}
        </button>
      ))}
    </div>
  )
}
