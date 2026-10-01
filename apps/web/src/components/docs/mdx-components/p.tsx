import { cn } from '@/lib/utils'

export const p = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('measure leading-7 text-fg-2 not-first:mt-5', className)}
    {...props}
  />
)
