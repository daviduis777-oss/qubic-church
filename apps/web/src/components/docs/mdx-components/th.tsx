import { cn } from '@/lib/utils'

export const th = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'bg-surface-2 px-4 py-2.5 text-left align-bottom font-medium text-foreground data-numeric:text-right [&[align=center]]:text-center [&[align=right]]:text-right',
      className
    )}
    {...props}
  />
)
