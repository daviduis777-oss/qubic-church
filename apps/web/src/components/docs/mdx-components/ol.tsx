import { cn } from '@/lib/utils'

export const ol = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLOListElement>) => (
  <ol
    className={cn(
      'measure my-6 ml-6 list-decimal space-y-2 text-fg-2 marker:text-muted-foreground',
      className
    )}
    {...props}
  />
)
