import { cn } from '@/lib/utils'

export const td = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn(
      'px-4 py-2.5 text-left align-top leading-relaxed text-fg-2 data-numeric:text-right data-numeric:whitespace-nowrap [&[align=center]]:text-center [&[align=right]]:text-right',
      className
    )}
    {...props}
  />
)
