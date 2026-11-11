'use client'

import { useEffect, useRef, useState } from 'react'
import { sound } from '@/lib/sound/engine'

/*
 * The race to 55%: this epoch's best network against the mark Come-from-Beyond set (3942 errors in 8760 hours).
 * The track runs from a coin flip (4380 errors, 50%) to the mark. A new record lights the track and chimes.
 * Data: the public Jetski Pool tracker, through /api/bpp/race (cached a minute at the CDN).
 */

type Point = { t: string; best: number }
type Race = {
  epoch: number
  start: string
  end: string
  best: number
  avg: number
  worst: number
  scored: number
  ids: number
  top: { id: string; errors: number; computor: boolean }[]
  history: Point[]
  lastEpoch: { epoch: number; best: number } | null
  at: string
}

const WINDOWS = 8760
const GOAL = 3942
const COIN = 4380
const SOURCE = 'https://qubic.jetskipool.ai/tracker'

const acc = (errors: number) => ((1 - errors / WINDOWS) * 100).toFixed(2)
const pos = (errors: number) => Math.max(0, Math.min(1, (COIN - errors) / (COIN - GOAL)))
const short = (id: string) => `${id.slice(0, 5)}…${id.slice(-4)}`

const css = `
.r55{display:grid;gap:22px;padding-top:28px;border-top:1px solid var(--line);scroll-margin-top:80px}
.r55-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap}
.r55-big{display:flex;align-items:baseline;gap:18px;flex-wrap:wrap}
.r55-best{font-family:var(--bpp-nx),var(--bpp-eng),sans-serif;font-size:clamp(56px,9vw,92px);line-height:.9;color:var(--fil);text-shadow:0 0 24px rgba(255,196,107,.35);transition:text-shadow .6s}
.r55.lit .r55-best{text-shadow:0 0 40px rgba(255,227,176,.95),0 0 80px rgba(255,196,107,.6)}
.r55-sub{display:grid;gap:4px}
.r55-sub b{font-size:clamp(20px,2.6vw,26px);color:var(--hot);font-weight:600}
.r55-track{position:relative;height:64px;margin:8px 0 4px}
.r55-rail{position:absolute;left:0;right:0;top:28px;height:8px;border-radius:8px;background:rgba(255,200,140,.08);overflow:hidden}
.r55-fill{position:absolute;left:0;top:0;bottom:0;border-radius:8px;background:linear-gradient(90deg,rgba(232,145,46,.35),var(--fil));box-shadow:0 0 18px rgba(255,196,107,.55);transition:width 1.2s cubic-bezier(.2,.8,.2,1)}
.r55.lit .r55-fill{animation:r55flash 1.4s ease-out}
@keyframes r55flash{0%{filter:brightness(2.2)}100%{filter:brightness(1)}}
.r55-mark{position:absolute;top:0;transform:translateX(-50%);display:grid;justify-items:center;gap:4px;font-size:12px;white-space:nowrap}
.r55-mark i{display:block;width:2px;height:20px;background:currentColor;margin-top:16px}
.r55-goal{right:0;transform:none;justify-items:end;color:var(--hot)}
.r55-goal i{width:3px;height:36px;margin-top:0;box-shadow:0 0 12px var(--fil)}
.r55-runner{position:absolute;top:22px;width:20px;height:20px;border-radius:50%;background:var(--hot);box-shadow:0 0 16px var(--fil),0 0 34px rgba(255,196,107,.6);transform:translateX(-50%);transition:left 1.2s cubic-bezier(.2,.8,.2,1)}
.r55-ends{display:flex;justify-content:space-between;gap:12px;font-size:12.5px;white-space:nowrap}
.r55-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:clamp(18px,3vw,32px)}
.r55-spark{width:100%;height:90px;display:block}
.r55-top{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:14px}
.r55-top li{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line)}
.r55-top code{font-family:var(--bpp-nx),monospace;color:var(--ink);font-size:13px}
.r55-tag{font-size:11.5px;color:var(--dim);margin-left:8px}
@media (prefers-reduced-motion:reduce){.r55-fill,.r55-runner{transition:none}.r55.lit .r55-fill{animation:none}}
`

function Spark({ history, start, end }: { history: Point[]; start: string; end: string }) {
  if (history.length < 2) return <p className="mute" style={{ margin: 0, fontSize: 13.5 }}>The line appears after the record falls a second time this epoch.</p>
  const W = 600
  const H = 90
  const t0 = start ? Date.parse(start) : Date.parse(history[0]!.t)
  const t1 = Math.max(Date.now(), Date.parse(history[history.length - 1]!.t))
  const tEnd = end ? Math.min(Date.parse(end), t1) : t1
  const lo = Math.min(GOAL, ...history.map(p => p.best)) - 10
  const hi = Math.max(...history.map(p => p.best)) + 10
  const x = (t: number) => ((t - t0) / Math.max(1, tEnd - t0)) * W
  const y = (v: number) => ((v - lo) / Math.max(1, hi - lo)) * H
  // a staircase: the record holds until the next one
  let d = ''
  history.forEach((p, i) => {
    const px = x(Date.parse(p.t))
    d += i === 0 ? `M${px},${H - y(p.best)}` : `H${px}V${H - y(p.best)}`
  })
  d += `H${W}`
  const goalY = H - y(GOAL)
  return (
    <svg aria-label="How this epoch's record fell" className="r55-spark" preserveAspectRatio="none" role="img" viewBox={`0 0 ${W} ${H}`}>
      <line stroke="rgba(255,227,176,.5)" strokeDasharray="4 5" x1="0" x2={W} y1={goalY} y2={goalY} />
      <path d={d} fill="none" stroke="var(--fil)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function RaceTo55() {
  const [r, setR] = useState<Race | null>(null)
  const [lit, setLit] = useState(false)
  const prev = useRef<number | null>(null)
  useEffect(() => {
    let live = true
    const load = () =>
      fetch('/api/bpp/race')
        .then(x => (x.ok ? (x.json() as Promise<Race>) : null))
        .then(j => {
          if (!live || !j) return
          if (prev.current != null && j.best < prev.current) {
            setLit(true)
            sound().call(true, true)
            window.setTimeout(() => live && setLit(false), 1600)
          }
          prev.current = j.best
          setR(j)
        })
        .catch(() => {})
    load()
    const t = setInterval(load, 60_000)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [])

  if (!r) return null
  const p = pos(r.best)
  const togo = Math.max(0, r.best - GOAL)
  const done = r.best <= GOAL
  return (
    <section aria-labelledby="r55-h" className={`r55${lit ? ' lit' : ''}`} id="race">
      <style>{css}</style>
      <div className="r55-head">
        <h2 className="eng" id="r55-h" style={{ fontSize: 'clamp(18px, 2.4vw, 22px)', fontWeight: 400, margin: 0, color: '#f3e4ce' }}>
          The race to 55%
        </h2>
        <span className="mute" style={{ fontSize: 13.5 }}>
          Epoch {r.epoch}. The best network miners have grown, checked on a year of hours: fewer errors is better.
        </span>
      </div>

      <div className="r55-big">
        <span aria-label={`${r.best} errors`} className="r55-best">{r.best}</span>
        <div className="r55-sub">
          <b>{acc(r.best)}% right</b>
          <span className="mute" style={{ fontSize: 14 }}>
            {done ? 'The 55% mark is reached.' : `${togo} errors to go to the 55% mark (${GOAL}).`}
          </span>
        </div>
      </div>

      <div>
        <div className="r55-track">
          <div className="r55-rail">
            <div className="r55-fill" style={{ width: `${p * 100}%` }} />
          </div>
          {r.avg > 0 && r.avg < COIN ? (
            <div className="r55-mark mute" style={{ left: `${pos(r.avg) * 100}%` }}>
              <span>average {Math.round(r.avg)}</span>
              <i />
            </div>
          ) : null}
          {r.lastEpoch && r.lastEpoch.best < COIN ? (
            <div className="r55-mark mute" style={{ left: `${pos(r.lastEpoch.best) * 100}%`, top: 34 }}>
              <i style={{ marginTop: 0, height: 12 }} />
              <span>last epoch {r.lastEpoch.best}</span>
            </div>
          ) : null}
          <div className="r55-mark r55-goal">
            <span>55% · {GOAL}</span>
            <i />
          </div>
          <div aria-hidden className="r55-runner" style={{ left: `${p * 100}%` }} />
        </div>
        <div className="r55-ends mute">
          <span>50% · coin flip</span>
          <span>Come-from-Beyond&apos;s mark</span>
        </div>
      </div>

      <div className="r55-grid">
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="mute" style={{ fontSize: 13 }}>How the record fell this epoch</span>
          <Spark end={r.end} history={r.history} start={r.start} />
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="mute" style={{ fontSize: 13 }}>
            Leaders, {r.scored} of {r.ids} IDs scored so far
          </span>
          <ol className="r55-top">
            {r.top.map(t => (
              <li key={t.id}>
                <span>
                  <code>{short(t.id)}</code>
                  <span className="r55-tag">{t.computor ? 'computor' : 'candidate'}</span>
                </span>
                <span>
                  {t.errors} <span className="mute">· {acc(t.errors)}%</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="mute" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7 }}>
        Data:{' '}
        <a className="mute" href={SOURCE} rel="noopener" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }} target="_blank">
          Jetski Pool tracker
        </a>
        , refreshed every minute. 55% is 0.45 × 8760 = {GOAL} errors, the qualification mark Come-from-Beyond named.
      </p>
    </section>
  )
}
