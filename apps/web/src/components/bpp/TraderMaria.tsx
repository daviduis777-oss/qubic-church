'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Halo } from '@/components/pool/maria/Halo'
import { betBreakEven, breakEven, money, TRADER, traderCurve, type Venue, VENUES, whatIf } from '@/lib/bpp/record-view'
import type { RecordResp } from './TrackRecord'

const MARIA_X = 'https://x.com/maria_aigarth'
const SPANS = [
  { bets: 24, label: 'a day' },
  { bets: 168, label: 'a week' },
  { bets: 720, label: 'a month' },
] as const

/**
 * Trader Maria: a paper bot that bets every live BPP-9000 call under real conditions, at a prediction market
 * and at a binary broker, so anyone can see what the network's calls would have done with $100. Paper only for now:
 * she touches no money until the record has run for months. Below, the what-if: the typical outcome for any accuracy, before or after launch.
 */
export function TraderMaria({ r }: { r: RecordResp | null }) {
  const hours = r?.hours ?? []
  const live = hours.some(h => h.hit != null)
  const [rate, setRate] = useState(54.5)
  const [span, setSpan] = useState<(typeof SPANS)[number]>(SPANS[1])
  const curves = useMemo(() => VENUES.map(v => ({ v, c: traderCurve(hours, v) })), [hours])
  // her halo idles like the pool's, and thinks for a moment whenever the what-if changes
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const think = () => {
    setBusy(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setBusy(false), 1400)
  }
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <section aria-labelledby="trader-h" id="trader" style={{ display: 'grid', gap: 24, paddingTop: 28, borderTop: '1px solid var(--line)', scrollMarginTop: 80 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Halo face={36} label="Trader Maria" mode={busy ? 'thinking' : 'idle'} size={104} tone="#FFC46B" />
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 className="eng" id="trader-h" style={{ fontSize: 'clamp(18px, 2.4vw, 22px)', fontWeight: 400, margin: 0, color: '#f3e4ce' }}>
            Trader Maria
          </h2>
          <a className="mute" href={MARIA_X} rel="noopener noreferrer" style={{ fontSize: 13.5, textDecoration: 'none' }} target="_blank">
            @maria_aigarth on X
          </a>
        </div>
      </div>

      <p className="mute" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, maxWidth: '68ch' }}>
        One way to use the calls. Her results depend on the venue, its fees and her stake; the network&apos;s accuracy is the record above.
      </p>
      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, maxWidth: '68ch' }}>
        Maria trades every live BPP-9000 call on paper, under real conditions: fees, slippage, the payout a real venue gives. She starts with $100, puts 5% of what she has on each call and sits out the hours the network is not sure. <span className="mute">No real money yet. A bot on live calls comes later, after the record has run for months. Not before.</span>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
        {curves.map(({ v, c }) => (
          <VenueCard curve={c} key={v.id} live={live} v={v} />
        ))}
      </div>

      <div className="panel" style={{ padding: 'clamp(16px, 3vw, 24px)', display: 'grid', gap: 16 }}>
        <div className="label">What if the network is right…</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <b className="nx lit" style={{ fontSize: 'clamp(40px, 6vw, 56px)', fontWeight: 300, lineHeight: 1, minWidth: '3.6ch' }}>
            {rate.toFixed(1)}%
          </b>
          <input
            aria-label="Share of hours the network calls right"
            max={60}
            min={45}
            onChange={e => {
              setRate(Number(e.target.value))
              think()
            }}
            step={0.5}
            style={{ flex: 1, minWidth: 180, accentColor: 'var(--fil)', padding: 0, border: 0, background: 'transparent' }}
            type="range"
            value={rate}
          />
          <div role="group" aria-label="Over how long" style={{ display: 'flex', gap: 6 }}>
            {SPANS.map(sp => (
              <button aria-pressed={sp === span} className={`btn${sp === span ? ' btn-main' : ''}`} key={sp.bets} onClick={() => {
                  setSpan(sp)
                  think()
                }} style={{ minHeight: 36, padding: '6px 12px', fontSize: 13 }} type="button">
                {sp.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {VENUES.map(v => {
            const end = whatIf(rate, span.bets, v)
            const up = end >= TRADER.start
            return (
              <div key={v.id}>
                <span className="mute" style={{ fontSize: 13 }}>
                  {v.name}, {span.label} of calls
                </span>
                <b className="nx" style={{ display: 'block', fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, color: up ? 'var(--fil)' : 'var(--r)', marginTop: 4 }}>
                  $100 → {money(end)}
                </b>
              </div>
            )
          })}
        </div>
        <p className="mute" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>
          {rate <= 50
            ? 'A coin is right half the time. At 50% Maria still loses at both venues: the fees and the payout take their cut every hour.'
            : rate < breakEven(VENUES[0]!)
              ? `Better than a coin, and still not enough: under her rules she grows above ${breakEven(VENUES[0]!).toFixed(1)}% at a prediction market, above ${breakEven(VENUES[1]!).toFixed(1)}% at a binary broker.`
              : rate < breakEven(VENUES[1]!)
                ? `Above the market's ${breakEven(VENUES[0]!).toFixed(1)}%, so she grows there. The broker's ${breakEven(VENUES[1]!).toFixed(1)}% is still out of reach.`
                : 'Above both break-even lines: she grows at both venues. The record shows whether the network holds a rate like this live.'}{' '}
          The typical outcome, not the luckiest one. One bet alone pays off a little lower, from {betBreakEven(VENUES[0]!).toFixed(1)}% and {betBreakEven(VENUES[1]!).toFixed(1)}%: a run of bets needs more, because a loss of 5% is not undone by a gain of 5%.
        </p>
      </div>

      <p className="mute" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7 }}>
        {VENUES.map(v => `${v.name}: ${v.note}`).join(' ')} Paper trading for now, an experiment, not financial advice.
      </p>
    </section>
  )
}

function VenueCard({ v, curve, live }: { v: Venue; curve: number[]; live: boolean }) {
  const now = curve.at(-1) ?? TRADER.start
  const up = now >= TRADER.start
  return (
    <div className="panel" style={{ padding: 'clamp(16px, 3vw, 22px)', display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span className="label">{v.name}</span>
        <span className="mute" style={{ fontSize: 12.5 }}>
          grows above {breakEven(v).toFixed(1)}% right
        </span>
      </div>
      <b className="nx" style={{ fontSize: 'clamp(34px, 5vw, 46px)', fontWeight: 400, lineHeight: 1, color: !live ? 'var(--ink)' : up ? 'var(--fil)' : 'var(--r)' }}>
        {money(now)}
      </b>
      <span className="mute" style={{ fontSize: 13 }}>
        {live ? `after ${curve.length - 1} live ${curve.length === 2 ? 'call' : 'calls'}, from $100` : 'waiting for the first live call, 18 November'}
      </span>
      <Spark curve={curve} />
    </div>
  )
}

function Spark({ curve }: { curve: number[] }) {
  const W = 300
  const H = 64
  if (curve.length < 2)
    return (
      <svg aria-hidden style={{ width: '100%', height: 'auto' }} viewBox={`0 0 ${W} ${H}`}>
        <line stroke="rgba(255,200,140,.3)" strokeDasharray="4 4" x1="0" x2={W} y1={H / 2} y2={H / 2} />
      </svg>
    )
  const lo = Math.min(TRADER.start, ...curve)
  const hi = Math.max(TRADER.start, ...curve)
  const y = (v: number) => (hi === lo ? H / 2 : H - 4 - ((v - lo) / (hi - lo)) * (H - 8))
  const x = (i: number) => (i / (curve.length - 1)) * W
  const d = curve.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const up = curve.at(-1)! >= TRADER.start
  return (
    <svg aria-label="Her bankroll over time" role="img" style={{ width: '100%', height: 'auto' }} viewBox={`0 0 ${W} ${H}`}>
      <line stroke="rgba(255,200,140,.3)" strokeDasharray="4 4" x1="0" x2={W} y1={y(TRADER.start)} y2={y(TRADER.start)} />
      <path d={d} fill="none" stroke={up ? 'var(--fil)' : 'var(--r)'} strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}
