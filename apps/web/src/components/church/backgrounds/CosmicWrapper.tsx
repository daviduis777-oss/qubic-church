'use client'

/**
 * CosmicWrapper - Fixed pure black background with perspective grid & stars
 * The 3D wireframe grid adds the futuristic depth feel.
 * On homepage: skips cosmic background (DesignerHeroClient has its own).
 */

import { memo, type ReactNode } from 'react'
import { usePathname } from '@/navigation'
import { CosmicBackground } from './CosmicBackground'

interface CosmicWrapperProps {
  children: ReactNode
}

export const CosmicWrapper = memo(function CosmicWrapper({ children }: CosmicWrapperProps) {
  const pathname = usePathname()
  const isHomepage = pathname === '/' || pathname === ''

  // Homepage uses DesignerHeroClient's own background — no cosmic overlay
  if (isHomepage) {
    return (
      <div className="relative min-h-screen bg-black">
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Fixed starfield + perspective grid */}
      <div className="fixed inset-0 z-0">
        <CosmicBackground
          intensity="medium"
          showStars
          showWireframe
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
})

export default CosmicWrapper
