'use client'

/**
 * CosmicWrapper - Fixed pure black background with perspective grid & stars
 * The 3D wireframe grid adds the futuristic depth feel.
 * On homepage: skips cosmic background (DesignerHeroClient has its own).
 */

import { memo, type ReactNode } from 'react'
import { usePathname } from '@/navigation'
import { CosmicBackground } from './CosmicBackground'

// Reading and data pages: keep the background still and quiet behind text
const QUIET_ROUTES = [
  '/docs',
  '/blog',
  '/monitoring',
  '/legal',
  '/research',
  '/get-qubic',
  '/mine-qubic',
  '/donate',
  '/satoshi-nakamoto',
  '/books',
  '/companion',
  '/evidence',
  '/articles',
]

interface CosmicWrapperProps {
  children: ReactNode
}

export const CosmicWrapper = memo(function CosmicWrapper({
  children,
}: CosmicWrapperProps) {
  const pathname = usePathname()
  const isHomepage = pathname === '/' || pathname === ''
  const forum = pathname === '/articles' || pathname.startsWith('/articles/')
  if (forum) {
    // The articles section is an old-style forum: plain light page, no starfield
    return <div className="relative min-h-screen" style={{ background: '#e5e5e8' }}>{children}</div>
  }
  const quiet = QUIET_ROUTES.some(
    r => pathname === r || pathname.startsWith(`${r}/`)
  )


  return (
    <div className="relative min-h-screen bg-black">
      {/* Fixed starfield; the wireframe only on showcase pages, never behind reading or data */}
      <div className="fixed inset-0 z-0">
        <CosmicBackground
          intensity={isHomepage ? 'high' : quiet ? 'low' : 'medium'}
          showStars
          showWireframe={!quiet || isHomepage}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10">{children}</div>
    </div>
  )
})

export default CosmicWrapper
