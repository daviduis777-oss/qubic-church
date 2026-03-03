import { Clock } from 'lucide-react'

import { Badge, type BadgeProps } from '../ui/badge'
import { cn } from '@/lib/utils'

interface ReadTimeProps extends BadgeProps {
  time: number
  iconSize?: number

  messages: {
    min_read: string
  }
}

export function ReadTime({
  time,
  messages,
  className,
  iconSize = 10,
  ...props
}: ReadTimeProps) {
  if (!time) {
    return null
  }

  return (
    <Badge
      className={cn('gap-1 min-w-fit', className)}
      variant="secondary"
      {...props}
    >
      <Clock className="max-h-full" size={iconSize} /> {time}{' '}
      {messages.min_read}
    </Badge>
  )
}
