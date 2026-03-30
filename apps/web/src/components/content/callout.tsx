import { Callout as BaseCallout } from '@/components/callout'
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'

interface CalloutProps {
  type?: 'warning' | 'info' | 'error' | 'success'
  title?: string
  children: React.ReactNode
}

const iconMap = {
  warning: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const icon = iconMap[type]

  return (
    <BaseCallout icon={icon as any} title={title}>
      {children}
    </BaseCallout>
  )
}
