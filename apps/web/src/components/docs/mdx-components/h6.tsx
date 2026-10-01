import { cn } from '@/lib/utils'

export const h6 = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h6
    className={cn(
      'measure mt-8 scroll-m-24 text-base font-medium text-fg-2',
      className
    )}
    {...props}
  />
)
