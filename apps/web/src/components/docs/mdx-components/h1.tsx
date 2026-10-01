import { cn } from '@/lib/utils'

export const h1 = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h1
    className={cn(
      'measure mt-2 scroll-m-24 text-3xl font-semibold tracking-tight text-balance text-foreground',
      className
    )}
    {...props}
  />
)
