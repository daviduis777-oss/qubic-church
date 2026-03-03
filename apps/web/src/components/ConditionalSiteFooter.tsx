'use client'

import { usePathname } from '@/navigation'

export function ConditionalSiteFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomepage = pathname === '/' || pathname === ''

  if (isHomepage) return null

  return <>{children}</>
}
