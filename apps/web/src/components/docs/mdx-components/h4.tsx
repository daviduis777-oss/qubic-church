import { cn } from '@/lib/utils'

export const h4 = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h4
    className={cn(
      'measure mt-8 scroll-m-24 text-lg font-semibold text-foreground',
      className
    )}
    {...props}
  />
)
