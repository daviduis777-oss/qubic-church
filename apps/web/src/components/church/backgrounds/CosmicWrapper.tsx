'use client'

/**
 * CosmicWrapper: the site shell. Every page (except the light forum) sits on SiteGlass,
 * the vacuum-tube background first approved on BPP-9000.
 */

import { memo, type ReactNode } from 'react'
import { usePathname } from '@/navigation'
import { SiteGlass } from './SiteGlass'

interface CosmicWrapperProps {
  children: ReactNode
}

export const CosmicWrapper = memo(function CosmicWrapper({
  children,
}: CosmicWrapperProps) {
  const pathname = usePathname()
  const forum = pathname === '/articles' || pathname.startsWith('/articles/')
  if (forum) {
    // The articles section is an old-style forum: plain light page, no starfield
    return <div className="relative min-h-screen" style={{ background: '#e5e5e8' }}>{children}</div>
  }
  return (
    <div className="relative min-h-screen" style={{ background: '#0B0A0E' }}>
      <SiteGlass />
      <div className="relative z-10">{children}</div>
    </div>
  )
})

export default CosmicWrapper
