import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { SITE_URL } from '@/lib/books'
import { LIVE_FEED_EPOCH, epochStart, networkState } from '@/lib/bpp/network'
import { market } from '@/lib/bpp/market'
import { participantCount } from '@/lib/bpp/store'
import { BppStyles } from '@/components/bpp/BppStyles'
import { Cannon } from '@/components/bpp/Cannon'
import { MarketPanel } from '@/components/bpp/MarketPanel'
import { Journal } from '@/components/bpp/Journal'

// Network and market fetches are cached for minutes on their own; the page itself stays live for the participant count.
export const dynamic = 'force-dynamic'

const TITLE = 'BPP-9000: the Bitcoin price predictor of Aigarth, live'
const DESC = 'Hourly UP/DOWN calls from the network Qubic miners train, its accuracy against a coin flip, market mood, and a public journal for everyone who trades on the calls.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/bpp9000` },
  openGraph: { type: 'website', title: 'BPP-9000', description: DESC, url: `${SITE_URL}/bpp9000` },
}

export default async function BppPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const [net, m, count] = await Promise.all([networkState(), market(), participantCount()])
  return (
    <div className="bpp" style={{ minHeight: '100vh', background: 'radial-gradient(1200px 600px at 50% -10%, rgba(61,255,154,.08), transparent 60%), #04070f' }}>
      <BppStyles />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '86px 16px 48px', display: 'grid', gap: 18 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 className="glow-g" style={{ fontSize: 'clamp(38px, 7vw, 72px)', fontWeight: 800, letterSpacing: '.02em', lineHeight: 1, margin: 0 }}>
              BPP-9000
            </h1>
            <p style={{ color: 'var(--dim)', fontSize: 13, margin: '10px 0 0', maxWidth: 640, lineHeight: 1.6 }}>
              The Bitcoin price predictor of Aigarth. Qubic miners train it every hour of every epoch; from epoch {LIVE_FEED_EPOCH} it calls each hour of BTC: UP or DOWN. Here you watch the calls, the record and your own journal.
            </p>
          </div>
          <div className="label" style={{ textAlign: 'right' }}>
            {count} in the experiment
          </div>
        </header>

        <Cannon liveAt={epochStart(LIVE_FEED_EPOCH).toISOString()} liveEpoch={LIVE_FEED_EPOCH} net={net} />
        <MarketPanel m={m} />
        <Journal initialCount={count} />

        <p style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
          Experiment. If you trade with real money, the responsibility is yours.
          <br />
          Network data: Jetski ANN explorer. Market: alternative.me, CoinGecko, Coinbase. Altseason is our count: top-50 coins beating BTC over 30 days.
        </p>
      </div>
    </div>
  )
}
