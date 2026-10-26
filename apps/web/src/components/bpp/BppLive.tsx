'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { replay, type NetData } from '@/lib/bpp/sim'
import { nx, sans } from './fonts'

const NX = nx.style.fontFamily
const SANS = sans.style.fontFamily

/**
 * The top of /bpp9000. Left: the call (before the live feed: the countdown to the first live call).
 * Right: the miners' network itself, run in the browser tick by tick with the scorer's own rule,
 * replaying the year it was grown on so that the replay ends as the current hour's candle closes.
 */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmtDay = (unix: number) => {
  const d = new Date(unix * 1000)
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, '0')}:00`
}
const two = (n: number) => String(n).padStart(2, '0')

function useNow(ms = 1000) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export function BppLive({ liveAt }: { liveAt: string }) {
  const [d, setD] = useState<NetData | null>(null)
  const [replayView, setReplayView] = useState<View | null>(null)
  useEffect(() => {
    fetch('/api/bpp/net')
      .then(r => r.json())
      .then(setD)
      .catch(() => {})
  }, [])
  const now = useNow()
  const live = now != null && now >= Date.parse(liveAt)
  const left = now == null ? null : Math.max(0, Date.parse(liveAt) - now)
  const days = left == null ? 0 : Math.floor(left / 86400000)
  const hms = left == null ? '--:--:--' : `${two(Math.floor((left % 86400000) / 3600000))}:${two(Math.floor((left % 3600000) / 60000))}:${two(Math.floor((left % 60000) / 1000))}`
  const inSample = replayView ? replayView.total : null

  return (
    <section style={{ display: 'grid', gap: 'clamp(24px, 4vw, 40px)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', alignItems: 'start' }}>
      <div>
        {!live ? (
          <>
            <p className="mute" style={{ fontSize: 17, margin: 0 }}>
              Bitcoin, hour by hour, <b style={{ color: 'var(--ink)', fontWeight: 600 }}>UP or DOWN</b>. The first live call in
            </p>
            <div className="nx lit" style={{ fontWeight: 300, fontSize: 'clamp(110px, 20vw, 230px)', lineHeight: 0.85, marginTop: 18, letterSpacing: '.01em' }}>
              {left == null ? '··' : days}
              <span style={{ fontSize: '.36em', marginLeft: '.18em', letterSpacing: '.02em' }}>{days === 1 ? 'day' : 'days'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 16, flexWrap: 'wrap' }}>
              <b className="nx" style={{ fontWeight: 300, fontSize: 'clamp(40px, 6vw, 60px)', lineHeight: 1 }}>
                {hms}
              </b>
              <span className="mute" style={{ fontSize: 15 }}>
                until 18 November, 12:00 UTC. From then on this space shows ▲ UP or ▼ DOWN for every hour, and keeps score.
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="mute" style={{ fontSize: 17, margin: 0 }}>Bitcoin, the next hour</p>
            <div className="nx lit" style={{ fontWeight: 300, fontSize: 'clamp(90px, 16vw, 200px)', lineHeight: 0.9, marginTop: 18 }}>
              Waiting for the feed
            </div>
            <p className="mute" style={{ fontSize: 15 }}>The live feed is due now. The first call appears here as soon as the network publishes it.</p>
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginTop: 30 }}>
          <Stat big={d?.depth ? String(d.depth) : '—'} small="generations of mutation behind this network" />
          <Stat big={inSample == null ? '—' : `${inSample.toFixed(1)}%`} small="of last year's hours it matched, the year it was grown on" />
          <Stat big={d?.epochSolutions ? compact(d.epochSolutions) : '—'} small={`networks miners grew this epoch${d ? ` (${d.epoch})` : ''}`} />
        </div>

        <div style={{ marginTop: 28 }}>
          <div className="label" style={{ marginBottom: 10 }}>
            Its last 24 calls in the replay
          </div>
          <div className="lamps">
            {Array.from({ length: 24 }, (_, i) => {
              const c = replayView?.calls[i]
              return (
                <i key={i} className={c ? (c.ok ? 'hit' : 'miss') : 'off'}>
                  {c ? (c.up ? '▲' : '▼') : ''}
                </i>
              )
            })}
          </div>
          <div className="mute" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 8, gap: 8 }}>
            <span>24 hours earlier</span>
            <span>lit: it matched bitcoin · dark: it missed</span>
            <span>latest</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
          <a className="btn btn-main" href="#join">
            Join the experiment
          </a>
          <a className="btn" href="#how">
            How it works
          </a>
        </div>
      </div>

      <div>
        <Machine d={d} onReplay={setReplayView} />
      </div>
    </section>
  )
}

function compact(n: number) {
  return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n)
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div>
      <b className="nx" style={{ display: 'block', fontWeight: 400, fontSize: 'clamp(30px, 4vw, 42px)', lineHeight: 1, color: 'var(--fil)' }}>
        {big}
      </b>
      <span className="mute" style={{ fontSize: 13, lineHeight: 1.4, display: 'block', marginTop: 6 }}>
        {small}
      </span>
    </div>
  )
}

type View = { h: number; total: number; calls: ({ up: boolean; ok: boolean } | null)[] }

function Machine({ d, onReplay }: { d: NetData | null; onReplay: (v: View) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const sim = useMemo(() => (d ? replay(d) : null), [d])
  const [cap, setCap] = useState('')
  const reduce = useRef(false)

  useEffect(() => {
    if (!sim || !d || !canvas.current || !host.current) return
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cv = canvas.current
    const g = cv.getContext('2d')!
    const N = d.n
    const CT = d.ctrl
    const OUT = d.out
    const TT = sim.ticks
    const tickMs = 3600000 / TT
    let S = 0
    let P: [number, number][] = []
    let links: (number[] | null)[] = []
    let cx = 0
    let cy = 0
    let R = 0
    let HUB = 0
    const layout = () => {
      const w = host.current!.clientWidth
      S = Math.min(w, 640)
      const pr = Math.min(2, window.devicePixelRatio || 1)
      cv.width = S * pr
      cv.height = S * pr
      cv.style.width = `${S}px`
      cv.style.height = `${S}px`
      g.setTransform(pr, 0, 0, pr, 0, 0)
      cx = S / 2
      cy = S / 2
      R = S * 0.36
      HUB = R * 0.5
      const others = [...Array(N).keys()].filter(n => n !== CT && n !== OUT)
      P = []
      others.forEach((n, i) => {
        const a = (i / others.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / others.length
        P[n] = [cx + R * Math.cos(a), cy + R * Math.sin(a)]
      })
      P[CT] = [cx - HUB - S * 0.01, cy]
      P[OUT] = [cx + HUB + S * 0.01, cy]
      links = []
      for (let k = 0; k < N * d.k; k++) {
        const tgt = Math.floor(k / d.k)
        const src = sim.w.nb[k]!
        if (src === tgt || src < 0) {
          links.push(null)
          continue
        }
        const [x1, y1] = P[src]!
        const [x2, y2] = P[tgt]!
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2
        links.push([x1, y1, mx + (cx - mx) * 0.3, my + (cy - my) * 0.3, x2, y2])
      }
    }
    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(host.current)

    const qp = (c: number[], t: number) => {
      const u = 1 - t
      return [u * u * c[0]! + 2 * u * t * c[2]! + t * t * c[4]!, u * u * c[1]! + 2 * u * t * c[3]! + t * t * c[5]!] as const
    }
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
    const pop = new Float32Array(N)
    let pulses: { c: number[]; t0: number; lit: boolean }[] = []
    let ansFade = 1
    const emitsUpTo = (T: number) => {
      let lo = 0
      let hi = sim.emitTick.length
      while (lo < hi) {
        const m = (lo + hi) >> 1
        if (sim.emitTick[m]! <= T) lo = m + 1
        else hi = m
      }
      return Math.min(lo, d.windows)
    }
    const yearSpan = d.windows
    const MONTHS: { label: string; frac: number }[] = []
    {
      const start = new Date(d.t0 * 1000)
      for (let i = 0; i < 12; i++) {
        const m = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))
        const frac = (m.getTime() / 1000 - d.t0) / 3600 / yearSpan
        MONTHS.push({ label: MON[m.getUTCMonth()]!, frac: Math.max(0, frac) })
      }
    }
    const tickOf = (ms: number) => Math.min(TT, Math.floor(((ms / 1000) % 3600) / 3600 * TT))
    let lastT = -1
    let lastH = -1
    let raf = 0

    const tickTo = (T: number, now: number) => {
      const s = sim.states[T]!
      const p = sim.states[Math.max(0, T - 1)]!
      for (let n = 0; n < N; n++)
        if (s[n] !== p[n]) {
          pop[n] = 1
          for (let k = 0; k < d.k; k++) {
            const c = links[n * d.k + k]
            if (c) pulses.push({ c, t0: now, lit: p[sim.w.nb[n * d.k + k]!] !== 2 })
          }
        }
      if (pulses.length > 400) pulses = pulses.slice(-400)
      const h = emitsUpTo(T)
      if (h !== lastH) {
        ansFade = 0
        lastH = h
        const calls: View['calls'] = []
        for (let i = h - 24; i < h; i++) calls.push(i < 0 ? null : { up: sim.emitVal[i] === 1, ok: sim.emitVal[i] === sim.exp[i] })
        onReplay({ h, total: (sim.hits[yearSpan]! / yearSpan) * 100, calls })
        setCap(`${h.toLocaleString('en-US')} of ${yearSpan.toLocaleString('en-US')} hours replayed · finishes as the candle closes`)
      }
    }

    const draw = (T: number, now: number) => {
      const s = sim.states[T]!
      const h = emitsUpTo(T)
      g.clearRect(0, 0, S, S)
      // the year ring
      const RR = R + S * 0.065
      g.lineWidth = 3
      g.strokeStyle = 'rgba(255,205,110,.10)'
      g.beginPath()
      g.arc(cx, cy, RR, 0, Math.PI * 2)
      g.stroke()
      const a0 = -Math.PI / 2
      const a1 = a0 + (h / yearSpan) * Math.PI * 2
      g.strokeStyle = 'rgba(255,205,110,.9)'
      g.beginPath()
      g.arc(cx, cy, RR, a0, a1)
      g.stroke()
      g.fillStyle = '#FFE3B0'
      g.beginPath()
      g.arc(cx + RR * Math.cos(a1), cy + RR * Math.sin(a1), 4.5, 0, 7)
      g.fill()
      g.font = `500 ${Math.max(9, S * 0.017)}px ${SANS}`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      for (const m of MONTHS) {
        const a = a0 + m.frac * Math.PI * 2
        g.strokeStyle = 'rgba(255,205,110,.25)'
        g.lineWidth = 1
        g.beginPath()
        g.moveTo(cx + (RR - 5) * Math.cos(a), cy + (RR - 5) * Math.sin(a))
        g.lineTo(cx + (RR + 5) * Math.cos(a), cy + (RR + 5) * Math.sin(a))
        g.stroke()
        const am = a + Math.PI / 12
        g.fillStyle = m.frac <= h / yearSpan ? 'rgba(236,223,203,.75)' : 'rgba(236,223,203,.3)'
        g.fillText(m.label, cx + (RR + S * 0.028) * Math.cos(am), cy + (RR + S * 0.028) * Math.sin(am))
      }
      // wires
      g.lineWidth = 0.8
      g.strokeStyle = 'rgba(255,205,110,.09)'
      for (const c of links) {
        if (!c) continue
        g.beginPath()
        g.moveTo(c[0]!, c[1]!)
        g.quadraticCurveTo(c[2]!, c[3]!, c[4]!, c[5]!)
        g.stroke()
      }
      // pulses into neurons that just changed
      pulses = pulses.filter(q => now - q.t0 < tickMs * 0.95)
      g.lineCap = 'round'
      for (const q of pulses) {
        const t = ease((now - q.t0) / (tickMs * 0.95))
        const tail = Math.max(0, t - 0.16)
        g.strokeStyle = 'rgba(255,205,110,.16)'
        g.lineWidth = 1
        g.beginPath()
        g.moveTo(q.c[0]!, q.c[1]!)
        g.quadraticCurveTo(q.c[2]!, q.c[3]!, q.c[4]!, q.c[5]!)
        g.stroke()
        g.strokeStyle = q.lit ? 'rgba(255,227,176,.95)' : 'rgba(255,205,110,.45)'
        g.lineWidth = q.lit ? 2 : 1.4
        g.beginPath()
        for (let i = 0; i <= 8; i++) {
          const [px, py] = qp(q.c, tail + ((t - tail) * i) / 8)
          if (i) g.lineTo(px, py)
          else g.moveTo(px, py)
        }
        g.stroke()
        const [x, y] = qp(q.c, t)
        g.fillStyle = '#fff3dc'
        g.beginPath()
        g.arc(x, y, q.lit ? 2.6 : 1.8, 0, 7)
        g.fill()
      }
      // hub
      g.strokeStyle = 'rgba(255,205,110,.18)'
      g.lineWidth = 1
      g.beginPath()
      g.arc(cx, cy, HUB - S * 0.022, 0, 7)
      g.stroke()
      g.fillStyle = '#0d0b10'
      g.beginPath()
      g.arc(cx, cy, HUB - S * 0.023, 0, 7)
      g.fill()
      const ans = h ? sim.emitVal[h - 1]! : 2
      const ok = h > 0 && sim.emitVal[h - 1] === sim.exp[h - 1]
      ansFade = Math.min(1, ansFade + 0.08)
      g.textAlign = 'center'
      g.fillStyle = 'rgba(236,223,203,.55)'
      g.font = `600 ${Math.max(8, S * 0.015)}px ${SANS}`
      g.fillText('THE NETWORK SAYS FOR', cx, cy - HUB * 0.56)
      g.fillStyle = '#ecdfcb'
      g.font = `600 ${Math.max(10, S * 0.02)}px ${SANS}`
      g.fillText(h ? fmtDay(d.t0 + (h - 1) * 3600) : '…', cx, cy - HUB * 0.36)
      if (h) {
        g.globalAlpha = 0.4 + 0.6 * ansFade
        const col = ans === 1 ? '#FFE3B0' : '#e09a4a'
        g.font = `300 ${Math.round(HUB * 0.44)}px ${NX}`
        const word = ans === 1 ? 'UP' : 'DOWN'
        const tw = g.measureText(word).width
        const ts = HUB * 0.2
        const gap = 10
        const x0 = cx - (ts + gap + tw) / 2
        const yy = cy + HUB * 0.03
        g.shadowColor = 'rgba(255,170,60,.8)'
        g.shadowBlur = 14 * ansFade + 6
        g.strokeStyle = col
        g.lineWidth = 2.4
        g.lineJoin = 'round'
        g.beginPath()
        if (ans === 1) {
          g.moveTo(x0 + ts / 2, yy - ts * 0.55)
          g.lineTo(x0 + ts, yy + ts * 0.45)
          g.lineTo(x0, yy + ts * 0.45)
        } else {
          g.moveTo(x0 + ts / 2, yy + ts * 0.55)
          g.lineTo(x0 + ts, yy - ts * 0.45)
          g.lineTo(x0, yy - ts * 0.45)
        }
        g.closePath()
        g.stroke()
        g.fillStyle = col
        g.textAlign = 'left'
        g.fillText(word, x0 + ts + gap, yy + 2)
        g.textAlign = 'center'
        g.shadowBlur = 0
        g.globalAlpha = 1
        g.font = `600 ${Math.max(9, S * 0.017)}px ${SANS}`
        g.fillStyle = ok ? '#FFC46B' : 'rgba(236,223,203,.45)'
        g.fillText(ok ? '✓ bitcoin did that' : '✗ bitcoin went the other way', cx, cy + HUB * 0.32)
      }
      g.fillStyle = 'rgba(236,223,203,.55)'
      g.font = `500 ${Math.max(9, S * 0.0165)}px ${SANS}`
      g.fillText(`${((sim.hits[h]! / Math.max(1, h)) * 100).toFixed(1)}% matched · tick ${T.toLocaleString('en-US')}`, cx, cy + HUB * 0.52)
      // neurons
      for (let n = 0; n < N; n++) {
        const [x, y] = P[n]!
        const big = n === CT || n === OUT
        pop[n]! *= 0.9
        const r = (big ? S * 0.027 : S * 0.0195) * (1 + 0.18 * pop[n]!)
        const v = s[n]
        if (v === 1) {
          g.shadowColor = 'rgba(255,190,80,.9)'
          g.shadowBlur = 14 + 10 * pop[n]!
        }
        g.beginPath()
        g.arc(x, y, r, 0, 7)
        g.fillStyle = v === 1 ? '#FFD68A' : v === 0 ? '#2a1d10' : '#121014'
        g.fill()
        g.shadowBlur = 0
        g.lineWidth = 1.3
        g.strokeStyle = v === 1 ? '#fff0cf' : v === 0 ? 'rgba(255,205,110,.75)' : 'rgba(255,255,255,.16)'
        g.stroke()
        if (pop[n]! > 0.3) {
          g.strokeStyle = `rgba(255,227,176,${pop[n]! * 0.7})`
          g.lineWidth = 1
          g.beginPath()
          g.arc(x, y, r + 4 + (1 - pop[n]!) * 8, 0, 7)
          g.stroke()
        }
        g.fillStyle = v === 1 ? '#3a2206' : v === 0 ? '#FFC46B' : 'rgba(236,223,203,.4)'
        g.font = `700 ${big ? S * 0.024 : S * 0.019}px ${SANS}`
        g.textBaseline = 'middle'
        g.fillText(v === 1 ? '+' : v === 0 ? '−' : '?', x, y + 0.5)
      }
      g.font = `600 ${Math.max(8, S * 0.015)}px ${SANS}`
      g.fillStyle = 'rgba(236,223,203,.7)'
      g.fillText('CLOCK', P[CT]![0], P[CT]![1] + S * 0.048)
      g.fillText('ANSWER', P[OUT]![0], P[OUT]![1] + S * 0.048)
    }

    const frame = () => {
      const now = performance.now()
      const T = tickOf(Date.now())
      if (T !== lastT) {
        if (lastT >= 0 && !reduce.current) tickTo(T, now)
        else tickTo(T, now - tickMs)
        lastT = T
      }
      draw(T, now)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const vis = () => {
      if (document.hidden) cancelAnimationFrame(raf)
      else raf = requestAnimationFrame(frame)
    }
    document.addEventListener('visibilitychange', vis)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', vis)
    }
  }, [sim, d, onReplay])

  return (
    <div>
      <div ref={host} style={{ width: '100%', display: 'grid', placeItems: 'center', minHeight: 320 }}>
        {d ? (
          <canvas ref={canvas} aria-label="The BPP-9000 network running live: 32 neurons, their states and the hour the network calls" role="img" />
        ) : (
          <div className="mute" style={{ fontSize: 13 }}>
            Loading the network from the miners…
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginTop: 10, fontSize: 13.5, lineHeight: 1.5 }}>
        <p className="mute" style={{ margin: 0, maxWidth: 440 }}>
          <b style={{ color: 'var(--ink)' }}>The machine behind the call.</b> {d?.n ?? 32} neurons grown by Qubic miners, running live in your browser. Each tick a neuron reads its {d?.k ?? 3} wires and turns{' '}
          <b style={{ color: 'var(--ink)' }}>+</b>, <b style={{ color: 'var(--ink)' }}>−</b> or <b style={{ color: 'var(--ink)' }}>?</b>. When CLOCK fires, ANSWER names an hour. The ring is the year it replays.
        </p>
        <p className="mute" style={{ margin: 0, textAlign: 'right' }}>
          {cap}
          <br />
          {d && (
            <a
              href="https://annexplorer.jetskipool.ai/"
              title={d.hash}
              rel="noopener noreferrer"
              style={{ color: 'var(--dim)', textDecoration: 'underline', textUnderlineOffset: 3 }}
              target="_blank"
            >
              miner {d.computor.slice(0, 4)}…{d.computor.slice(-3)} · epoch {d.epoch} · {d.score.toLocaleString('en-US')} misses
            </a>
          )}
        </p>
      </div>
    </div>
  )
}
