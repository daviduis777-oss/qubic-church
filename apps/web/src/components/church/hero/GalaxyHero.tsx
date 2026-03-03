'use client'

/**
 * GalaxyHero - Client Component Wrapper
 * Dynamically loads the designer hero (1:1 port of reference HTML)
 */

import dynamic from 'next/dynamic'

const DesignerHeroClient = dynamic(
  () => import('./DesignerHeroClient').then((mod) => mod.DesignerHeroClient),
  {
    ssr: false,
    loading: () => (
      <section className="relative w-full h-screen overflow-hidden bg-black" />
    ),
  }
)

export function GalaxyHero() {
  return <DesignerHeroClient />
}
