import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { SITE_URL } from '@/lib/books'
import { LIVE_FEED_EPOCH, epochStart } from '@/lib/bpp/network'
import { market } from '@/lib/bpp/market'
import { participantCount } from '@/lib/bpp/store'
import { BppStyles } from '@/components/bpp/BppStyles'
import { BppLive } from '@/components/bpp/BppLive'
import { Crowd, HeaderNav } from '@/components/bpp/Crowd'
import { Journal } from '@/components/bpp/Journal'
import { BppHow } from '@/components/bpp/BppHow'
import { BPP_FAQ, BPP_MD_URL, BPP_SUMMARY, BPP_URL } from '@/lib/bpp/explainer'
import { bppFonts } from '@/components/bpp/fonts'

// Market is cached for minutes on its own; the page stays live for the counts.
export const dynamic = 'force-dynamic'

const TITLE = 'BPP-9000: watch the Bitcoin predictor Qubic miners grow'
const DESC = 'The network Qubic miners grow to call each hour of bitcoin, UP or DOWN, running live in your browser. Live calls from 18 November. Join the experiment and keep your own journal.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/bpp9000`, types: { 'text/markdown': BPP_MD_URL } },
  openGraph: { type: 'website', title: 'BPP-9000', description: DESC, url: `${SITE_URL}/bpp9000`, images: [{ url: `${SITE_URL}/og/bpp/home.png`, width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: 'BPP-9000', description: DESC, images: [`${SITE_URL}/og/bpp/home.png`] },
}

const fngWord = (v: number) => (v < 25 ? 'extreme fear' : v < 45 ? 'fear' : v < 56 ? 'neutral' : v < 76 ? 'greed' : 'extreme greed')

export default async function BppPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const [m, count] = await Promise.all([market(), participantCount()])
  const liveAt = epochStart(LIVE_FEED_EPOCH).toISOString()
  return (
    <div className={`bpp ${bppFonts}`} style={{ minHeight: '100vh' }}>
      <BppStyles />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'BPP-9000', url: BPP_URL, description: BPP_SUMMARY, applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, publisher: { '@type': 'Organization', name: 'Qubic Church', url: SITE_URL } },
            { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: BPP_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
          ]).replace(/</g, '\\u003c'),
        }}
        type="application/ld+json"
      />
      <div style={{ maxWidth: 1340, margin: '0 auto', padding: 'clamp(76px, 9vw, 96px) clamp(16px, 4vw, 48px) 48px', display: 'grid', gap: 'clamp(28px, 4vw, 40px)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 className="eng" style={{ fontSize: 'clamp(18px, 2.4vw, 22px)', fontWeight: 400, margin: 0, color: '#f3e4ce', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span aria-hidden className="pilot" />
            BPP-9000
          </h1>
          <HeaderNav count={count} />
        </header>

        <BppLive liveAt={liveAt} />

        <Crowd initial={{ signedUp: count, trades: 0, total: 0 }} />

        <BppHow />

        <section aria-label="Market mood" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'clamp(18px, 3vw, 32px)', paddingTop: 24, borderTop: '1px solid var(--line)' }}>
          <Mood big={m.fng ? String(m.fng.value) : '—'} small={m.fng ? `Fear & greed: ${fngWord(m.fng.value)}` : 'Fear & greed'} />
          <Mood big={m.dominance ? `${m.dominance.btc.toFixed(1)}%` : '—'} small="BTC dominance" />
          <Mood big={m.altseason ? String(m.altseason.index) : '—'} small={m.altseason ? `Altseason: ${m.altseason.beat} of ${m.altseason.of} top coins beat BTC in 30 days` : 'Altseason'} />
        </section>

        <div id="journal" style={{ scrollMarginTop: 80 }}>
          <span id="join" style={{ display: 'block', position: 'relative', top: -80 }} />
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
