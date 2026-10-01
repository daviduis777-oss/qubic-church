import { cn } from '@/lib/utils'

export const code = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  return (
    <code
      className={cn(
        'relative break-words border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-sm text-foreground',
        className
      )}
      {...props}
    />
  )
}
