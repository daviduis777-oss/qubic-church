import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { SITE_URL } from '@/lib/books'
import { LIVE_FEED_EPOCH, epochStart } from '@/lib/bpp/network'
import { market } from '@/lib/bpp/market'
import { participantCount, watching } from '@/lib/bpp/store'
import { BppStyles } from '@/components/bpp/BppStyles'
import { BppLive } from '@/components/bpp/BppLive'
import { Crowd } from '@/components/bpp/Crowd'
import { Journal } from '@/components/bpp/Journal'
import { bppFonts } from '@/components/bpp/fonts'

// Market is cached for minutes on its own; the page stays live for the counts.
export const dynamic = 'force-dynamic'

const TITLE = 'BPP-9000: watch the Bitcoin predictor Qubic miners grow'
const DESC = 'The network Qubic miners grow to call each hour of bitcoin, UP or DOWN, running live in your browser. Live calls from 18 November. Join the experiment and keep a public journal.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/bpp9000` },
  openGraph: { type: 'website', title: 'BPP-9000', description: DESC, url: `${SITE_URL}/bpp9000`, images: [{ url: `${SITE_URL}/og/bpp/home.png`, width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: 'BPP-9000', description: DESC, images: [`${SITE_URL}/og/bpp/home.png`] },
}

const fngWord = (v: number) => (v < 25 ? 'extreme fear' : v < 45 ? 'fear' : v < 56 ? 'neutral' : v < 76 ? 'greed' : 'extreme greed')

export default async function BppPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const [m, count, seen] = await Promise.all([market(), participantCount(), watching()])
  const liveAt = epochStart(LIVE_FEED_EPOCH).toISOString()
  return (
    <div className={`bpp ${bppFonts}`} style={{ minHeight: '100vh' }}>
      <BppStyles />
      <div style={{ maxWidth: 1340, margin: '0 auto', padding: 'clamp(76px, 9vw, 96px) clamp(16px, 4vw, 48px) 48px', display: 'grid', gap: 'clamp(28px, 4vw, 40px)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 className="eng" style={{ fontSize: 'clamp(18px, 2.4vw, 22px)', fontWeight: 400, margin: 0, color: '#f3e4ce', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span aria-hidden className="pilot" />
            BPP-9000
          </h1>
          <nav aria-label="BPP-9000" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="mute bpp-hide-sm" style={{ fontSize: 14, marginRight: 4 }}>
              {count > 0 ? (
                <>
                  <b className="nx" style={{ fontWeight: 500, fontSize: 24, color: 'var(--hot)', marginRight: 4 }}>
                    {count.toLocaleString('en-US')}
                  </b>
                  signed up
                </>
              ) : (
                'Be among the first to sign up'
              )}
            </span>
            <a className="btn bpp-hide-sm" href="#journal">
              My journal
            </a>
            <a className="btn btn-main" href="#journal">
              Join the experiment
            </a>
          </nav>
        </header>

        <BppLive liveAt={liveAt} />

        <Crowd initial={{ signedUp: count, watching: seen, trades: 0, long: 0, short: 0 }} />

        <section id="how" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'clamp(18px, 3vw, 32px)', paddingTop: 24, borderTop: '1px solid var(--line)', scrollMarginTop: 80 }}>
          <Mood big={m.fng ? String(m.fng.value) : '—'} small={m.fng ? `Fear & greed: ${fngWord(m.fng.value)}` : 'Fear & greed'} />
          <Mood big={m.dominance ? `${m.dominance.btc.toFixed(1)}%` : '—'} small="BTC dominance" />
          <Mood big={m.altseason ? String(m.altseason.index) : '—'} small={m.altseason ? `Altseason: ${m.altseason.beat} of ${m.altseason.of} top coins beat BTC in 30 days` : 'Altseason'} />
          <p className="mute" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, gridColumn: 'span 2', minWidth: 'min(100%, 420px)' }}>
            <b style={{ color: 'var(--ink)' }}>How it works.</b> The network never sees the price. It is a rhythm of ternary neurons: miners mutate it millions of times a week until its beat matches a real year of bitcoin, hour by hour. The best one is scored by every Qubic node. Here it replays that year once an hour, timed to finish as the candle closes. From epoch {LIVE_FEED_EPOCH} it gets live data and calls the next hour.
          </p>
        </section>

        <div id="journal" style={{ scrollMarginTop: 80 }}>
          <Journal initialCount={count} />
        </div>

        <p className="mute" style={{ fontSize: 12.5, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.7 }}>
          Experiment. If you trade with real money, the responsibility is yours.
          <br />
          Network: Jetski ANN Explorer, run here with the qubic/core scoring rule. Market: alternative.me, CoinGecko. Altseason is our count: top-50 coins beating BTC over 30 days.
        </p>
      </div>
    </div>
  )
}

function Mood({ big, small }: { big: string; small: string }) {
  return (
    <div>
      <b className="nx" style={{ display: 'block', fontWeight: 400, fontSize: 36, lineHeight: 1 }}>
        {big}
      </b>
      <span className="mute" style={{ fontSize: 13 }}>
        {small}
      </span>
    </div>
  )
}
