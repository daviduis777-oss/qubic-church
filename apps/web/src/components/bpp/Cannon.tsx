'use client'

import { useEffect, useState } from 'react'

type Net = {
  ok: boolean
  epoch: number | null
  threshold: number | null
  sample: number
  bestRecent: number | null
  medianRecent: number | null
  totalSolutions: number | null
  epochs: { epoch: number; solutions: number }[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const fmt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('en-US'))

function useNow(ms = 1000) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

/**
 * The cannon: the predictor's face. Until the live BTC feed (epoch 240) it shows the network training
 * and counts down to the feed; then the same frame shows the call for the hour and its record.
 */
export function Cannon({ net, liveAt, liveEpoch }: { net: Net; liveAt: string; liveEpoch: number }) {
  const now = useNow()
  const live = Date.parse(liveAt)
  const toHour = now ? 3600_000 - (now % 3600_000) : null
  const toLive = now ? Math.max(0, live - now) : null
  const hourLabel = now ? new Date(now + (toHour ?? 0)).toISOString().slice(11, 16) : '--:--'
  const days = toLive != null ? Math.floor(toLive / 86400_000) : null
  const hh = toLive != null ? Math.floor((toLive % 86400_000) / 3600_000) : null
  const mm = toLive != null ? Math.floor((toLive % 3600_000) / 60_000) : null
  const ss = toLive != null ? Math.floor((toLive % 60_000) / 1000) : null
  const maxSol = Math.max(1, ...net.epochs.map(e => e.solutions))
  const margin = net.threshold && net.bestRecent ? net.threshold - net.bestRecent : null

  return (
    <section className="panel cannon scan" style={{ padding: 'clamp(18px, 3vw, 32px)', borderColor: 'rgba(61,255,154,.35)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'baseline' }}>
        <div className="label">
          <span className="blink" style={{ color: 'var(--g)' }}>●</span> BPP-9000 · Bitcoin price predictor · Aigarth
        </div>
        <div className="label">epoch {net.epoch ?? '—'} · trained by Qubic miners</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginTop: 22, alignItems: 'center' }}>
        {/* The call */}
        <div style={{ textAlign: 'center' }}>
          <div className="label">call for {hourLabel} UTC</div>
          <div className="big glow-c" style={{ fontSize: 'clamp(44px, 8vw, 84px)', fontWeight: 700, lineHeight: 1, margin: '14px 0 8px', letterSpacing: '.04em' }}>
            STANDBY
          </div>
          <div style={{ color: 'var(--dim)', fontSize: 13 }}>
            Live UP / DOWN calls start with epoch {liveEpoch}
          </div>
          <div className="big" style={{ fontSize: 'clamp(22px, 4vw, 34px)', marginTop: 14, color: 'var(--gold)', textShadow: '0 0 16px rgba(255,210,74,.45)' }}>
            {days == null ? '—' : `${days}d ${pad(hh!)}:${pad(mm!)}:${pad(ss!)}`}
          </div>
          <div className="label" style={{ marginTop: 6 }}>
            to the live feed · {new Date(live).toUTCString().slice(5, 22)} UTC
          </div>
          <div className="big" style={{ marginTop: 16, fontSize: 13, color: 'var(--dim)' }}>
            candle closes in <span style={{ color: 'var(--ink)' }}>{toHour == null ? '--:--' : `${pad(Math.floor(toHour / 60_000))}:${pad(Math.floor((toHour % 60_000) / 1000))}`}</span>
          </div>
        </div>

        {/* Record: empty until live */}
        <div>
          <div className="label">last 24 hours</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 5, marginTop: 10 }}>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 4, background: 'rgba(138,151,173,.12)', border: '1px solid rgba(138,151,173,.18)' }} title="no live call yet" />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
            {['24h', '7 days', 'all time'].map(k => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div className="big" style={{ fontSize: 26, color: 'var(--dim)' }}>—</div>
                <div className="label" style={{ fontSize: 10 }}>accuracy {k}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--dim)', lineHeight: 1.5 }}>
            Each closed hour lights a cell green or red. Accuracy is shown against a coin flip (50%), with the chance it is luck.
          </div>
        </div>
      </div>

      {/* Training now */}
      <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
        <div className="label">training now · public data from the Jetski ANN explorer</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginTop: 12 }}>
          <Metric big={fmt(net.bestRecent)} label={`best score · last ${net.sample || '—'} solutions`} tone="g" />
          <Metric big={fmt(net.threshold)} label="threshold this epoch" />
          <Metric big={margin == null ? '—' : `−${fmt(margin)}`} label="best under threshold" tone="c" />
          <Metric big={fmt(net.medianRecent)} label="median score" />
          <Metric big={fmt(net.epochs.at(-1)?.solutions)} label={`solutions in epoch ${net.epoch ?? ''}`} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70, marginTop: 18 }} title="verified solutions per epoch">
          {net.epochs.map(e => (
            <div key={e.epoch} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: `${Math.max(3, (e.solutions / maxSol) * 52)}px`, background: e.epoch === net.epoch ? 'var(--g)' : 'rgba(94,231,255,.35)', borderRadius: 3, boxShadow: e.epoch === net.epoch ? '0 0 12px rgba(61,255,154,.6)' : 'none' }} />
              <div style={{ fontSize: 9, color: 'var(--dim)' }}>{e.epoch}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 8 }}>
          Score = mistakes on a year of hourly BTC candles. Lower is better; a solution counts when it is under the threshold. Bars: verified solutions per epoch.
        </div>
      </div>
    </section>
  )
}

function Metric({ big, label, tone }: { big: string; label: string; tone?: 'g' | 'c' }) {
  return (
    <div>
      <div className={`big ${tone === 'g' ? 'glow-g' : tone === 'c' ? 'glow-c' : ''}`} style={{ fontSize: 24, fontWeight: 600 }}>
        {big}
      </div>
      <div className="label" style={{ fontSize: 10, marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}
