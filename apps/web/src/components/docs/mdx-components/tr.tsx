import { cn } from '@/lib/utils'

export const tr = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn('border-b border-border last:border-b-0', className)}
    {...props}
  />
)
