import { cn } from '@/lib/utils'

export const blockquote = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => (
  <blockquote
    className={cn(
      'measure mt-6 border-l-2 border-gold/60 pl-5 text-fg-2',
      className
    )}
    {...props}
  />
)
