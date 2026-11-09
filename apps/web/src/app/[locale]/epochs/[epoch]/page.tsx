import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { BppStyles } from '@/components/bpp/BppStyles'
import { bppFonts } from '@/components/bpp/fonts'
import {
  DIGESTS,
  type Digest,
  type DigestItem,
  digestOf,
  epochWindow,
} from '@/content/epochs'
import { SITE_URL } from '@/lib/books'
import { epochNumbers } from '@/lib/epochs/digest'

export const revalidate = 1800

export function generateStaticParams() {
  return DIGESTS.map(d => ({ epoch: String(d.epoch) }))
}

const day = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
const dshort = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

export async function generateMetadata(props: {
  params: Promise<{ epoch: string }>
}): Promise<Metadata> {
  const { epoch } = await props.params
  const d = digestOf(Number(epoch))
  if (!d) return {}
  const title = `Epoch ${d.epoch}: the week in Aigarth`
  const url = `${SITE_URL}/epochs/${d.epoch}`
  return {
    title,
    description: d.line,
    alternates: { canonical: url },
    openGraph: { type: 'article', title, description: d.line, url },
  }
}

export default async function EpochPage(props: {
  params: Promise<{ locale: string; epoch: string }>
}) {
  const { locale, epoch } = await props.params
  setRequestLocale(locale)
  const d = digestOf(Number(epoch))
  if (!d) notFound()
  const { start, end } = epochWindow(d.epoch)
  const nums = await epochNumbers(d.epoch)
  const i = DIGESTS.indexOf(d)
  const newer = DIGESTS[i - 1]
  const older = DIGESTS[i + 1]
  const running = Date.now() < end

  return (
    <div className={`bpp ${bppFonts}`} style={{ minHeight: '100vh' }}>
      <BppStyles />
      <article
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'clamp(84px, 10vw, 110px) clamp(16px, 4vw, 48px) 56px',
          display: 'grid',
          gap: 'clamp(28px, 4vw, 40px)',
        }}
      >
        <header style={{ display: 'grid', gap: 14 }}>
          <a
            className="mute"
            href="/epochs"
            style={{ fontSize: 14, textDecoration: 'none' }}
          >
            ← All epochs
          </a>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--bpp-nx), sans-serif',
              fontWeight: 300,
              fontSize: 'clamp(56px, 10vw, 104px)',
              lineHeight: 0.9,
            }}
          >
            <span className="nx lit">Epoch {d.epoch}</span>
          </h1>
          <div className="mute" style={{ fontSize: 14.5 }}>
            {day(start)}, 12:00 UTC to {day(end)}, 12:00 UTC
            {running ? ' · running now' : ''}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(19px, 2.4vw, 23px)',
              lineHeight: 1.4,
              color: '#f3e4ce',
              maxWidth: '62ch',
            }}
          >
            {d.line}
          </p>
        </header>

        <section
          className="panel"
          style={{
            padding: 'clamp(18px, 3vw, 28px)',
            display: 'grid',
            gap: 18,
          }}
        >
          <h2 className="eng" style={H2}>
            BPP-9000 this epoch
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 18,
            }}
          >
            <Num
              k="Networks grown"
              v={
                nums.solutions != null
                  ? nums.solutions.toLocaleString('en-US')
                  : '…'
              }
              sub={running ? 'so far' : 'in the epoch'}
            />
            <Num
              k="Best brain, homework"
              v={nums.best ? `${nums.best.homework.toFixed(1)}%` : '…'}
              sub="the year it was grown on"
            />
            <Num
              k="Best brain, exam"
              lit
              v={
                nums.best?.exam?.rate != null
                  ? `${nums.best.exam.rate.toFixed(1)}%`
                  : '…'
              }
              sub="the hours it never saw; a coin is 50%"
            />
          </div>
          {nums.best && (
            <a
              className="mute"
              href="/bpp9000/brains"
              style={{ fontSize: 13.5, textUnderlineOffset: 3 }}
            >
              Brain {nums.best.hash.slice(0, 10)}… by computor{' '}
              {nums.best.computor.slice(0, 6)}…, under the glass in Brain Watch
            </a>
          )}
        </section>

        <Block items={d.changes} title="What happened" />
        <Block items={d.science} title="Science" />
        {d.quotes.length > 0 && (
          <section style={{ display: 'grid', gap: 14 }}>
            <h2 className="eng" style={H2}>
              In their words
            </h2>
            {d.quotes.map(q => (
              <figure
                className="panel"
                key={q.date + q.text.slice(0, 20)}
                style={{ margin: 0, padding: '18px 20px' }}
              >
                <blockquote
                  style={{
                    margin: 0,
                    fontSize: 16.5,
                    lineHeight: 1.55,
                    color: '#f3e4ce',
                  }}
                >
                  &ldquo;{q.text}&rdquo;
                </blockquote>
                <figcaption
                  className="mute"
                  style={{ marginTop: 8, fontSize: 13.5 }}
                >
                  {q.who}, {dshort(q.date)},{' '}
                  {q.url ? (
                    <a
                      className="mute"
                      href={q.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {q.where}
                    </a>
                  ) : (
                    q.where
                  )}
                </figcaption>
              </figure>
            ))}
          </section>
        )}
        <section style={{ display: 'grid', gap: 12 }}>
          <h2 className="eng" style={H2}>
            Network stalls
          </h2>
          <p
            className="mute"
            style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}
          >
            {nums.stalls.length === 0
              ? 'None caught by the site’s own watch, which began on 9 November 2026.'
              : nums.stalls
                  .map(
                    s =>
                      `Tick ${s.tick.toLocaleString('en-US')}, from ${day(s.from)}${s.to ? ` to ${day(s.to)}` : ', still stalled'}.`
                  )
                  .join(' ')}{' '}
            <a
              className="mute"
              href="/status"
              style={{ textUnderlineOffset: 3 }}
            >
              Live status
            </a>
          </p>
        </section>
        <Block items={d.next} title="What comes next" />

        <nav
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            borderTop: '1px solid var(--line)',
            paddingTop: 18,
          }}
        >
          {older ? (
            <a className="btn" href={`/epochs/${older.epoch}`}>
              ← Epoch {older.epoch}
            </a>
          ) : (
            <span />
          )}
          {newer ? (
            <a className="btn" href={`/epochs/${newer.epoch}`}>
              Epoch {newer.epoch} →
            </a>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </div>
  )
}

const H2: React.CSSProperties = {
  fontSize: 'clamp(16px, 2vw, 19px)',
  fontWeight: 400,
  margin: 0,
  color: '#f3e4ce',
}

function Block({ items, title }: { items: DigestItem[]; title: string }) {
  if (!items.length) return null
  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h2 className="eng" style={H2}>
        {title}
      </h2>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gap: 12,
        }}
      >
        {items.map(it => (
          <li
            key={it.date + it.text.slice(0, 24)}
            style={{
              display: 'grid',
              gridTemplateColumns: '64px minmax(0, 1fr)',
              gap: 14,
            }}
          >
            <span
              className="nx"
              style={{ color: '#FFC46B', fontSize: 18, lineHeight: 1.5 }}
            >
              {dshort(it.date)}
            </span>
            <span style={{ fontSize: 15.5, lineHeight: 1.6, color: '#e9dfcf' }}>
              {it.text}{' '}
              {it.url && (
                <a
                  className="mute"
                  href={it.url}
                  rel={
                    it.url.startsWith('http')
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  style={{ textUnderlineOffset: 3 }}
                  target={it.url.startsWith('http') ? '_blank' : undefined}
                >
                  {it.source ?? 'See it'}
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Num({
  k,
  v,
  sub,
  lit,
}: {
  k: string
  v: string
  sub: string
  lit?: boolean
}) {
  return (
    <div>
      <span className="label" style={{ display: 'block', marginBottom: 6 }}>
        {k}
      </span>
      <b
        className={`nx${lit ? ' lit' : ''}`}
        style={{
          display: 'block',
          fontWeight: 300,
          fontSize: lit ? 'clamp(40px, 5.6vw, 56px)' : 'clamp(30px, 4vw, 42px)',
          lineHeight: 1,
          color: lit ? undefined : '#FFC46B',
        }}
      >
        {v}
      </b>
      <span
        className="mute"
        style={{ fontSize: 12.5, display: 'block', marginTop: 6 }}
      >
        {sub}
      </span>
    </div>
  )
}

export type { Digest }
