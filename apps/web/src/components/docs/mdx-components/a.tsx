import { cn } from '@/lib/utils'

export const a = ({
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a
    className={cn(
      'font-medium text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold break-words',
      className
    )}
    {...props}
  />
)
