'use client'

import { useEffect, useState } from 'react'
import type { Hour, RecordStats } from '@/lib/bpp/record-view'

export type RecordResp = { ok: boolean; chain: { ok: boolean; head: string; entries: number }; stats: RecordStats; hours: Hour[] }

/** The record from /api/bpp/record, refreshed every five minutes. Shared by the record and Trader Maria. */
export function useRecord() {
  const [r, setR] = useState<RecordResp | null>(null)
  useEffect(() => {
    let live = true
    const load = () =>
      fetch('/api/bpp/record', { cache: 'no-store' })
        .then(x => (x.ok ? (x.json() as Promise<RecordResp>) : null))
        .then(j => live && j && setR(j))
        .catch(() => {})
    load()
    const t = setInterval(load, 5 * 60_000)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [])
  return r
}

const pct = (n: number | null, d = 1) => (n == null ? '—' : `${n.toFixed(d)}%`)
const hh = (unix: number) => `${String(new Date(unix * 1000).getUTCHours()).padStart(2, '0')}:00`

/**
 * The record: every live call, sealed before its hour closes and checked against the close, kept by the
 * site itself in a hash chain. Empty until the first live call; nothing is ever back-filled.
 */
export function TrackRecord({ r }: { r: RecordResp | null }) {
  const s = r?.stats
  const hours = r?.hours ?? []
  const last = hours.slice(-48)
  const lamps = Array.from({ length: 48 }, (_, i) => last[i - (48 - last.length)] ?? null)
  const started = (s?.checked ?? 0) + (s?.pending ?? 0) > 0
  const runText = !s || s.run === 0 ? '—' : s.run > 0 ? `${s.run} right` : `${-s.run} wrong`
  return (
    <section aria-labelledby="record-h" id="record" style={{ display: 'grid', gap: 22, paddingTop: 28, borderTop: '1px solid var(--line)', scrollMarginTop: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h2 className="eng" id="record-h" style={{ fontSize: 'clamp(18px, 2.4vw, 22px)', fontWeight: 400, margin: 0, color: '#f3e4ce' }}>
          The record
        </h2>
        <span className="mute" style={{ fontSize: 13.5 }}>
          Kept by this site. Every call sealed before its hour closes, checked against the close.
        </span>
      </div>

      {!started && (
        <p className="mute" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, maxWidth: '68ch' }}>
          It opens with the first live call, 18 November at 12:00 UTC. From then on the site writes down every hour&apos;s call while the hour is still open, then checks it against the real close. Each entry carries the hash of the one before it, so no call can be changed or slipped in afterwards.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 18 }}>
        <Big big={pct(s?.rate ?? null)} small={s?.checked ? `right, over ${s.checked} live ${s.checked === 1 ? 'hour' : 'hours'}` : 'right, live'} lit />
        <Big big={s?.last24.checked ? pct((s.last24.hits / s.last24.checked) * 100, 0) : '—'} small="in the last 24 hours" />
        <Big big={runText} small={s?.bestRun ? `in a row now, best run ${s.bestRun}` : 'in a row'} />
        <Big big={s?.luck == null ? '—' : s.luck < 0.001 ? '<0.1%' : pct(s.luck * 100)} small={s?.luck == null ? 'chance it is luck, shown from 10 hours' : 'chance a coin would do this well'} />
      </div>

      <div>
        <div className="label" style={{ marginBottom: 10 }}>
          The last 48 hours
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          {[0, 24].map(off => (
            <div className="lamps" key={off}>
              {lamps.slice(off, off + 24).map((h, i) => (
                <i
                  className={!h || h.hit == null ? 'off' : h.hit ? 'hit' : 'miss'}
                  key={i}
                  title={h ? `${hh(h.hour)} UTC: called ${h.side.toUpperCase()}${h.went ? `, went ${h.went.toUpperCase()}` : ', not closed yet'}` : undefined}
                >
                  {h && h.side !== 'skip' ? (h.side === 'up' ? '▲' : '▼') : h ? '·' : ''}
                </i>
              ))}
            </div>
          ))}
        </div>
        <div className="mute" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 8, gap: 8 }}>
          <span>48 hours ago</span>
          <span>now</span>
        </div>
        <div className="mute" style={{ fontSize: 12.5, marginTop: 4 }}>lit: right · dark: wrong · dim: still open or sat out</div>
      </div>

      {s && s.days.length > 1 && <Days days={s.days.slice(-30)} />}

      <p className="mute" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7 }}>
        {r?.chain.entries ? (
          <>
            {r.chain.entries} sealed entries, chain {r.chain.ok ? 'intact' : 'BROKEN'}, head <code style={{ color: 'var(--ink)' }}>{r.chain.head.slice(0, 16)}…</code>.{' '}
          </>
        ) : null}
        <a className="mute" href="/api/bpp/record?raw=1" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Every entry and its hash
        </a>
        , so anyone can check them. Up means the hour closed at or above its open, on Binance BTC/USDT.
      </p>
    </section>
  )
}

function Big({ big, small, lit }: { big: string; small: string; lit?: boolean }) {
  return (
    <div>
      <b className={`nx${lit ? ' lit' : ''}`} style={{ display: 'block', fontWeight: lit ? 300 : 400, fontSize: lit ? 'clamp(48px, 7vw, 72px)' : 'clamp(30px, 4vw, 42px)', lineHeight: 1, color: lit ? undefined : 'var(--fil)' }}>
        {big}
      </b>
      <span className="mute" style={{ fontSize: 13, lineHeight: 1.4, display: 'block', marginTop: 8 }}>
        {small}
      </span>
    </div>
  )
}

/** Hit rate per day as bars around the 50% line a coin would sit on. Plain boxes, so text never scales. */
function Days({ days }: { days: RecordStats['days'] }) {
  const H = 120
  return (
    <figure style={{ margin: 0 }}>
      <div className="label" style={{ marginBottom: 10 }}>
        Right, day by day
      </div>
      <div aria-label="Share of hours called right, per day" role="img" style={{ position: 'relative', height: H, display: 'flex', alignItems: 'flex-end', gap: 4, maxWidth: Math.max(240, days.length * 56) }}>
        <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: H / 2, borderTop: '1px dashed rgba(255,200,140,.35)' }} />
        <span aria-hidden className="mute" style={{ position: 'absolute', right: 0, bottom: H / 2 + 4, fontSize: 11.5 }}>
          a coin: 50%
        </span>
        {days.map(d => {
          const p = (d.hits / d.checked) * 100
          return (
            <div
              key={d.day}
              style={{ flex: 1, height: `${Math.max(2, p)}%`, borderRadius: '6px 6px 2px 2px', background: p >= 50 ? 'linear-gradient(to top, rgba(232,145,46,.55), var(--fil))' : 'rgba(255,255,255,.14)', boxShadow: p >= 50 ? '0 0 12px rgba(232,145,46,.3)' : 'none' }}
              title={`${d.day}: ${d.hits} of ${d.checked} right (${p.toFixed(0)}%)`}
            />
          )
        })}
      </div>
      <div className="mute" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6, maxWidth: Math.max(240, days.length * 56) }}>
        <span>{days[0]!.day.slice(5)}</span>
        <span>{days.at(-1)!.day.slice(5)}</span>
      </div>
    </figure>
  )
}
