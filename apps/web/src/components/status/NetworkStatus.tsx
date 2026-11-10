'use client'

import { useEffect, useRef, useState } from 'react'
import type { NetStatus } from '@/lib/network/status'

const POLL_MS = 10_000

const fmtInt = (n: number) => n.toLocaleString('en-US')
function dur(ms: number) {
  const m = Math.round(ms / 60_000)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h} h ${m % 60} min`
  return `${Math.floor(h / 24)} days ${h % 24} h`
}
function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  return s < 90 ? `${s} s ago` : `${Math.round(s / 60)} min ago`
}

/** One lamp and one sentence: is the Qubic network moving right now? */
export function NetworkStatus() {
  const [st, setSt] = useState<NetStatus | null>(null)
  const [err, setErr] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  // our own rate from two polls, until the server has one
  const first = useRef<{ tick: number; at: number } | null>(null)
  const [localRate, setLocalRate] = useState<number | null>(null)

  useEffect(() => {
    let on = true
    const load = () =>
      fetch('/api/network/status?fresh=1', { cache: 'no-store' })
        .then(r => r.json())
        .then((j: NetStatus | { ok: false }) => {
          if (!on) return
          if (j.ok) {
            setSt(j)
            if (!first.current) first.current = { tick: j.tick, at: Date.now() }
            else if (j.tick > first.current.tick) setLocalRate((j.tick - first.current.tick) / ((Date.now() - first.current.at) / 1000))
            setErr(false)
          } else setErr(true)
        })
        .catch(() => on && setErr(true))
    load()
    const a = setInterval(load, POLL_MS)
    const b = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      on = false
      clearInterval(a)
      clearInterval(b)
    }
  }, [])

  const v = err && !st ? 'unknown' : (st?.verdict ?? null)
  const color =
    v === 'running' ? '#7CE0A3' : v === 'stalled' ? '#FF7A6B' : '#b9aecf'
  const head =
    v === 'running'
      ? 'Qubic is running.'
      : v === 'stalled'
        ? 'Qubic is stalled.'
        : v === 'unknown'
          ? 'We can’t tell right now.'
          : 'Looking…'
  const sub =
    v === 'running'
      ? `The tick moved ${st?.changedAt ? ago(now - st.changedAt) : 'just now'}.`
      : v === 'stalled'
        ? `The tick has not moved for ${dur(st?.stuckFor ?? 0)}. Transfers and smart contracts wait until it moves again.`
        : v === 'unknown'
          ? 'The Qubic RPC did not answer us. That alone does not mean the network is down.'
          : ''
  const epochTicks = st ? st.tick - st.initialTick : null

  return (
    <div style={{ display: 'grid', gap: 'clamp(28px, 4vw, 44px)' }}>
      <section
        aria-live="polite"
        className="panel"
        style={{ padding: 'clamp(22px, 4vw, 40px)', display: 'grid', gap: 18 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 10px ${color}, 0 0 34px ${color}88`,
              animation:
                v === 'running' ? 'qs-beat 2s ease-in-out infinite' : undefined,
              flex: 'none',
            }}
          />
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--bpp-nx), sans-serif',
              fontWeight: 300,
              fontSize: 'clamp(46px, 8vw, 88px)',
              lineHeight: 0.95,
            }}
          >
            <span className="nx lit">{head}</span>
          </h1>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(17px, 2.2vw, 21px)',
            color: '#f3e4ce',
            maxWidth: '60ch',
          }}
        >
          {sub}
        </p>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 18,
            margin: '10px 0 0',
          }}
        >
          <Fact k="Current tick" v={st ? fmtInt(st.tick) : '…'} />
          <Fact k="Epoch" v={st ? String(st.epoch) : '…'} />
          <Fact
            k="Ticks this epoch"
            v={epochTicks != null ? fmtInt(epochTicks) : '…'}
          />
          <Fact
            k="Ticks per second"
            v={st?.rate != null ? st.rate.toFixed(1) : localRate != null ? localRate.toFixed(1) : '…'}
          />
        </dl>
      </section>



      <footer
        className="mute"
        style={{ fontSize: 12.5, lineHeight: 1.7, maxWidth: '80ch' }}
      >
        How we watch: every 30 minutes, and every 30 seconds while anyone has
        this page open, the site reads the current tick from the public Qubic
        RPC (rpc.qubic.org). A tick that has not moved for 10 minutes counts as
        a stall; the stall ends at the first look that finds it moving. Because
        we only see the network when we look, start and end times are &ldquo;no
        later than&rdquo;. A slow or silent RPC is not the same as a stopped
        network; when we cannot reach it we say so instead of guessing. For live
        ticks, supply and the epoch clock see the{' '}
        <a
          className="mute"
          href="/monitoring"
          style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          Network Monitor
        </a>
        .
      </footer>
      <style>{`@keyframes qs-beat { 0%, 100% { opacity: 1 } 50% { opacity: .55 } } @media (prefers-reduced-motion: reduce) { [style*="qs-beat"] { animation: none !important } }`}</style>
    </div>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="mute" style={{ fontSize: 13 }}>
        {k}
      </dt>
      <dd
        className="nx"
        style={{
          margin: '4px 0 0',
          fontSize: 'clamp(26px, 3.4vw, 36px)',
          fontWeight: 300,
          color: '#FFC46B',
        }}
      >
        {v}
      </dd>
    </div>
  )
}
