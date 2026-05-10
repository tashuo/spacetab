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
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`toast-in pointer-events-auto flex items-center gap-3 px-3.5 py-2.5 text-xs rounded-lg shadow-lg border cursor-pointer ${
            t.kind === 'error'
              ? 'bg-red-600 text-white border-red-700/30'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <span className="flex-1 text-left">{t.text}</span>
          {t.action && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                t.action!.perform()
                onDismiss(t.id)
              }}
              className="px-2 py-1 -my-1 -mr-1 rounded text-[11px] font-semibold uppercase tracking-wider text-emerald-300 hover:text-emerald-200 hover:bg-white/10 transition-colors"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
