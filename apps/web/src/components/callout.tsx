import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'

import { cn } from '@/lib/utils'

type CalloutType = 'info' | 'warning' | 'warn' | 'error' | 'success'

const TONES = {
  info: { rule: 'border-l-fg-2', icon: Info, iconClass: 'text-fg-2' },
  warning: {
    rule: 'border-l-warning',
    icon: AlertTriangle,
    iconClass: 'text-warning',
  },
  error: {
    rule: 'border-l-danger',
    icon: AlertCircle,
    iconClass: 'text-danger',
  },
  success: {
    rule: 'border-l-verified',
    icon: CheckCircle,
    iconClass: 'text-verified',
  },
} as const

interface CalloutProps {
  type?: CalloutType
  title?: string
  /** Legacy: an emoji or node shown instead of the type icon */
  icon?: React.ReactNode
  children?: React.ReactNode
}

/** One callout style for all MDX content: quiet surface, coloured left rule. */
export function Callout({
  type = 'info',
  title,
  icon,
  children,
}: CalloutProps) {
  const tone = TONES[type === 'warn' ? 'warning' : type] ?? TONES.info
  const Icon = tone.icon

  return (
    <aside
      className={cn(
        'measure my-6 flex gap-3 border border-border border-l-2 bg-surface-1 px-4 py-3.5 text-sm leading-relaxed text-fg-2',
        tone.rule
      )}
    >
      <span
        aria-hidden="true"
        className={cn('mt-0.5 shrink-0', tone.iconClass)}
      >
        {icon ?? <Icon className="size-4" />}
      </span>
      <div className="min-w-0">
        {title && <p className="mb-1 font-medium text-foreground">{title}</p>}
        {children}
      </div>
    </aside>
  )
}
