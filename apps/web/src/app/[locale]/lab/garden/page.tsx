import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { BppStyles } from '@/components/bpp/BppStyles'
import { bppFonts } from '@/components/bpp/fonts'
import { Garden } from '@/components/garden/Garden'

export const metadata: Metadata = { title: 'The Garden', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/** Hidden prototype of the Aigarth Pool game: the epoch as a garden of brains. Not linked anywhere. */
export default async function GardenLab(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  return (
    <div className={`bpp ${bppFonts}`} style={{ minHeight: '100vh' }}>
      <BppStyles />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(76px, 9vw, 96px) clamp(16px, 4vw, 48px) 48px' }}>
        <Garden />
      </div>
    </div>
  )
}
