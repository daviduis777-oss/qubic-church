import { cn } from '@/lib/utils'

export const h3 = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      'measure mt-10 scroll-m-24 text-xl font-semibold tracking-tight text-balance text-foreground',
      className
    )}
    {...props}
  />
)
