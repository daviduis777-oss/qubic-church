'use client'

import { usePathname } from '@/navigation'

export function ConditionalSiteFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  void pathname
  return <>{children}</>
}
