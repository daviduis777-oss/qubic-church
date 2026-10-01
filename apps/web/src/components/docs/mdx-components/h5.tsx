import { cn } from '@/lib/utils'

export const h5 = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5
    className={cn(
      'measure mt-8 scroll-m-24 text-base font-semibold text-foreground',
      className
    )}
    {...props}
  />
)
