import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { BppStyles } from '@/components/bpp/BppStyles'
import { bppFonts } from '@/components/bpp/fonts'
import { NetworkStatus } from '@/components/status/NetworkStatus'
import { SITE_URL } from '@/lib/books'
import { ogFor } from '@/lib/og-pages'

const TITLE = 'Is Qubic down? Live network status'
const DESC = 'Is the Qubic network running right now? The live tick, how fast it moves, and every stall we have seen.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/status` },
  openGraph: { type: 'website', title: TITLE, description: DESC, url: `${SITE_URL}/status`, images: ogFor('status').images },
  twitter: ogFor('status').twitter,
}

export default async function StatusPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  return (
    <div className={`bpp ${bppFonts}`} style={{ minHeight: '100vh' }}>
      <BppStyles />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(84px, 10vw, 110px) clamp(16px, 4vw, 48px) 56px' }}>
        <NetworkStatus />
      </div>
    </div>
  )
}
