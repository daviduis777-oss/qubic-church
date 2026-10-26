import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { SITE_URL } from '@/lib/books'
import { getParticipant } from '@/lib/bpp/store'
import { statsOf } from '@/lib/bpp/stats'
import { BppStyles } from '@/components/bpp/BppStyles'
import { bppFonts } from '@/components/bpp/fonts'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await props.params
  const p = await getParticipant(handle).catch(() => null)
  if (!p) return { title: 'BPP-9000' }
  const s = statsOf(p.trades, p.start, p.joined)
  const title = `${p.name} × BPP-9000 · Day ${s.day}`
  const img = `${SITE_URL}/og/bpp/${handle.toLowerCase()}.png?v=${s.trades}-${s.day}`
  return {
    title: { absolute: title },
    description: `${s.wins}W ${s.losses}L · win rate ${s.winRate == null ? '—' : `${s.winRate.toFixed(1)}%`} · on BPP-9000 calls. Experiment.`,
    robots: { index: false },
    openGraph: { title, url: `${SITE_URL}/bpp9000/u/${handle.toLowerCase()}`, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, images: [img] },
  }
}

export default async function BppUser(props: { params: Promise<{ locale: string; handle: string }> }) {
  const { locale, handle } = await props.params
  setRequestLocale(locale)
  const p = await getParticipant(handle).catch(() => null)
  if (!p) notFound()
  const s = statsOf(p.trades, p.start, p.joined)
  return (
    <div className={`bpp ${bppFonts}`} style={{ minHeight: '100vh' }}>
      <BppStyles />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '96px 16px 48px', textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`${p.name} × BPP-9000`} src={`/og/bpp/${handle.toLowerCase()}.png?v=${s.trades}-${s.day}`} style={{ width: '100%', borderRadius: 14, border: '1px solid var(--line)' }} />
        <p style={{ marginTop: 20 }}>
          <Link className="btn btn-main" href="/bpp9000">
            Open BPP-9000
          </Link>
        </p>
        <p style={{ fontSize: 12, color: 'var(--dim)' }}>Experiment. If you trade with real money, the responsibility is yours.</p>
      </div>
    </div>
  )
}
