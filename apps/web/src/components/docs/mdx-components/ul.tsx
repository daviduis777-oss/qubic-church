import { cn } from '@/lib/utils'

export const ul = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) => (
  <ul
    className={cn(
      'measure my-6 ml-6 list-disc space-y-2 text-fg-2 marker:text-muted-foreground',
      className
    )}
    {...props}
  />
)
