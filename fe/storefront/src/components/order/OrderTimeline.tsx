import type { TrackingStep } from '@/types/order'

interface OrderTimelineProps {
  tracking: TrackingStep[]
}

export function OrderTimeline({ tracking }: OrderTimelineProps) {
  return (
    <div className="flex items-start">
      {tracking.map((step, index) => {
        const isCompleted = step.state === 'completed'
        const isCurrent = step.state === 'current'
        const isLast = index === tracking.length - 1

        return (
          <div key={step.label} className="relative flex flex-1 flex-col items-center">
            {!isLast ? (
              <span
                className={`absolute left-1/2 top-4 h-0.5 w-full ${
                  isCompleted || isCurrent ? 'bg-slate-400' : 'bg-[var(--line)]'
                }`}
              />
            ) : null}
            <div className="relative z-10 flex flex-col items-center bg-white px-1.5">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                  isCompleted
                    ? 'border-slate-700 bg-slate-700 text-white'
                    : isCurrent
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-[var(--line)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </span>
              <p className="mt-2 text-center text-[11px] font-medium text-[var(--text-secondary)] sm:text-xs">{step.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
