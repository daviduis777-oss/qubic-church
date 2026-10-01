import { cn } from '@/lib/utils'

export const h2 = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn(
      'measure mt-14 scroll-m-24 text-2xl font-semibold tracking-tight text-balance text-foreground first:mt-0',
      className
    )}
    {...props}
  />
)
