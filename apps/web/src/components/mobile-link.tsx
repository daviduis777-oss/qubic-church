'use client'

import type { LinkProps } from 'next/link'

import { Link, useRouter } from '@/navigation'
import { cn } from '@/lib/utils'

export interface MobileLinkProps extends Omit<LinkProps, 'locale'> {
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function MobileLink({
  href,
  children,
  className,
  onOpenChange,
  ...props
}: MobileLinkProps) {
  const router = useRouter()

  // Filter out prefetch if it has incompatible values
  const { prefetch, ...filteredProps } = props
  const linkProps = typeof prefetch === 'boolean' ? props : filteredProps

  return (
    <Link
      className={cn(className)}
      href={href}
      onClick={() => {
        router.push(href.toString())
        onOpenChange?.(false)
      }}
      {...linkProps}
    >
      {children}
    </Link>
  )
}
