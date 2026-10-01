import { cn } from '@/lib/utils'

export const li = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => (
  <li className={cn('pl-1 leading-7', className)} {...props} />
)
