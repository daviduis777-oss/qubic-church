import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { BppStyles } from '@/components/bpp/BppStyles'
import { bppFonts } from '@/components/bpp/fonts'
import { DIGESTS, epochWindow } from '@/content/epochs'
import { SITE_URL } from '@/lib/books'

const TITLE = 'Epochs: the week in Aigarth'
const DESC =
  'One page a week, one per Qubic epoch: what changed in the network and the BPP-9000 task, what the science side released, and what was said, word for word.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/epochs` },
  openGraph: {
    type: 'website',
    title: TITLE,
    description: DESC,
    url: `${SITE_URL}/epochs`,
  },
}

const day = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

export default async function EpochsPage(props: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await props.params
  setRequestLocale(locale)
  return (
    <div className={`bpp ${bppFonts}`} style={{ minHeight: '100vh' }}>
      <BppStyles />
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'clamp(84px, 10vw, 110px) clamp(16px, 4vw, 48px) 56px',
          display: 'grid',
          gap: 28,
        }}
      >
        <header style={{ display: 'grid', gap: 12 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--bpp-nx), sans-serif',
              fontWeight: 300,
              fontSize: 'clamp(56px, 10vw, 104px)',
              lineHeight: 0.9,
            }}
          >
            <span className="nx lit">Epochs</span>
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(18px, 2.2vw, 21px)',
              lineHeight: 1.45,
              color: '#f3e4ce',
              maxWidth: '60ch',
            }}
          >
            Qubic lives in weeks: every Wednesday at 12:00 UTC a new epoch
            begins. One page per epoch, so you don&apos;t have to scroll Discord
            to know what happened.
          </p>
        </header>
        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gap: 12,
          }}
        >
          {DIGESTS.map(d => {
            const { start, end } = epochWindow(d.epoch)
            const now = Date.now() >= start && Date.now() < end
            return (
              <li key={d.epoch}>
                <a
                  className="panel"
                  href={`/epochs/${d.epoch}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr)',
                    gap: 20,
                    alignItems: 'center',
                    padding: '18px 22px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <span
                    className={`nx${now ? ' lit' : ''}`}
                    style={{
                      fontFamily: 'var(--bpp-nx), sans-serif',
                      fontSize: 46,
                      fontWeight: 300,
                      lineHeight: 1,
                      color: now ? undefined : '#FFC46B',
                    }}
                  >
                    {d.epoch}
                  </span>
                  <span style={{ display: 'grid', gap: 4 }}>
                    <span className="mute" style={{ fontSize: 13 }}>
                      {day(start)} to {day(end)}
                      {now ? ' · now' : ''}
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        lineHeight: 1.45,
                        color: '#f3e4ce',
                      }}
                    >
                      {d.line}
                    </span>
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
