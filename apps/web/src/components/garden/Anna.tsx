'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ANNA, type AnnaView, CELLS, cellColour, eta, fromB64, needOf, rowCol } from '@/lib/garden/anna-view'
import { bandOf } from '@/lib/garden/field-view'
import { isIdentity } from '@/lib/garden/garden-view'

/**
 * Grow Anna: the one goal. The Anna Matrix as a dark ground; every brain of the network lights a little of one
 * cell, chosen by its hash; a whole cell shows her value at full strength and keeps the name of the identity that
 * finished it. When the last cell is whole, Anna is whole, and the brain that closed her is kept.
 */
type Resp = (AnnaView & { ok: true }) | { ok: false; reason: string }
type Found = { id: string; brains: number; cells: number[]; rank: number | null; gardeners: number }
type FindResp = { ok: true; found: Found | null } | { ok: false; reason: string }

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const int = (n: number) => Math.round(n).toLocaleString('en-US')
const day = (t: number) => {
  const d = new Date(t)
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
const when = (t: number) => {
  const d = new Date(t)
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`
}
const ago = (t: number, now: number) => {
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 60) return `${s} s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  return h < 48 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`
}
const left = (ms: number) => {
  const m = Math.max(0, Math.floor(ms / 60_000))
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  return d ? `${d} d ${h} h` : h ? `${h} h ${m % 60} min` : `${m} min`
}
const pctOf = (a: number, b: number) => {
  const p = b ? (a / b) * 100 : 0
  return p === 0 ? '0' : p < 0.01 ? '<0.01' : p < 10 ? p.toFixed(2) : p.toFixed(1)
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: 'no-store' })
    return (await r.json()) as T
  } catch {
    return null
  }
}

export function Anna({ now }: { now: number }) {
  const [a, setA] = useState<Resp | null>(null)
  const [matrix, setMatrix] = useState<number[][] | null>(null)
  const [hover, setHover] = useState<{ c: number; x: number; y: number } | null>(null)
  const [pick, setPick] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [found, setFound] = useState<Found | null | 'none'>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(640)

  useEffect(() => {
    let on = true
    const load = () => getJson<Resp>('/api/garden/anna').then(r => on && r && setA(r))
    load()
    const t = setInterval(load, 60_000)
    getJson<{ matrix: number[][] }>('/data/anna-matrix-min.json').then(m => on && m?.matrix?.length === ANNA && setMatrix(m.matrix))
    try {
      const k = localStorage.getItem('garden:id')
      if (k && isIdentity(k)) setTyped(k)
    } catch {}
    return () => {
      on = false
      clearInterval(t)
    }
  }, [])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize(Math.min(el.clientWidth, 760)))
    ro.observe(el)
    setSize(Math.min(el.clientWidth, 760))
    return () => ro.disconnect()
  }, [])

  const v = a && a.ok ? a : null
  const brains = useMemo(() => (v ? fromB64(v.brains, Uint32Array) : null), [v])
  const finisher = useMemo(() => (v ? fromB64(v.finisher, Int32Array) : null), [v])
  const mine = useMemo(() => new Set(found && found !== 'none' ? found.cells : []), [found])

  // the picture: one pixel per cell of Anna, scaled up crisp
  useEffect(() => {
    const c = canvas.current
    if (!c || !matrix) return
    c.width = ANNA
    c.height = ANNA
    const x = c.getContext('2d')!
    const img = x.createImageData(ANNA, ANNA)
    const px = img.data
    for (let k = 0; k < CELLS; k++) {
      const [r, col] = rowCol(k)
      const val = matrix[r]![col]!
      const need = needOf(val, v?.unit)
      const n = brains ? brains[k]! : 0
      const whole = n >= need
      let [R, G, B] = cellColour(val, n / need, whole)
      const chosen = pick != null && finisher && finisher[k] === pick
      if (chosen || mine.has(k)) [R, G, B] = [Math.round(R * 0.25 + 217 * 0.75), Math.round(G * 0.25 + 204 * 0.75), 255]
      const o = k * 4
      px[o] = R
      px[o + 1] = G
      px[o + 2] = B
      px[o + 3] = 255
    }
    x.putImageData(img, 0, 0)
  }, [matrix, brains, finisher, pick, mine, v?.unit])

  const at = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    const r = ev.currentTarget.getBoundingClientRect()
    const col = Math.floor(((ev.clientX - r.left) / r.width) * ANNA)
    const row = Math.floor(((ev.clientY - r.top) / r.height) * ANNA)
    if (col < 0 || row < 0 || col >= ANNA || row >= ANNA) return null
    return { c: row * ANNA + col, x: ev.clientX - r.left, y: ev.clientY - r.top }
  }

  const look = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const id = typed.trim().toUpperCase()
    if (!isIdentity(id)) {
      setFound('none')
      return
    }
    try {
      localStorage.setItem('garden:id', id)
    } catch {}
    const r = await getJson<FindResp>(`/api/garden/anna?find=${id}`)
    setFound(r && r.ok && r.found ? r.found : 'none')
    setPick(null)
  }

  const started = now >= (v?.start ?? Number.MAX_SAFE_INTEGER)
  const share = v ? pctOf(v.total, v.need) : '0'
  const whenWhole = v ? eta(v.need, v.total, v.pace, now) : null
  const hv = hover && matrix ? hover.c : null

  return (
    <section className="an">
      <div className="an-head">
        <div className="mute an-eyebrow">The Garden · one goal · hidden preview</div>
        <h1 className="an-h1">
          <span className="nx lit an-pct">{share}%</span>
          <span className="an-h1-t">of Anna grown</span>
        </h1>
        <p className="an-lead">
          Aigarth is <em>AI</em> and <em>garth</em>, an old word for a garden. Anna is one brain baked from its recipe, Come-from-Beyond’s personal one,
          {' '}{ANNA} by {ANNA}. From epoch {v?.from ?? 239} on, every brain the Qubic network grows is planted into one of her cells, chosen by its own hash.
          When all {int(CELLS)} cells are whole, Anna is whole. Every finished cell keeps the name of the identity that finished it.
        </p>
      </div>

      {!started ? (
        <div className="an-start">
          <span className="nx lit an-start-n">{left((v?.start ?? Date.UTC(2026, 10, 11, 12)) - now)}</span>
          <span>
            until the first brain is planted: epoch {v?.from ?? 239}, Wednesday 11 November 2026, 12:00 UTC. Every brain of the network from that moment
            on counts; nothing before it does.
          </span>
        </div>
      ) : null}

      <div className="an-grid">
        <div className="an-pic" ref={wrap}>
          <canvas
            ref={canvas}
            className="an-canvas"
            style={{ width: size, height: size }}
            onMouseMove={ev => setHover(at(ev))}
            onMouseLeave={() => setHover(null)}
            onClick={ev => {
              const h = at(ev)
              if (h && finisher && finisher[h.c]! >= 0) setPick(p => (p === finisher[h.c] ? null : finisher[h.c]!))
            }}
            aria-label="The Anna Matrix, lit as the network grows her"
          />
          {hv != null && matrix ? (
            <div className="an-tip" style={{ left: Math.min(hover!.x + 14, size - 240), top: Math.max(0, hover!.y - 70) }}>
              {(() => {
                const [r, col] = rowCol(hv)
                const val = matrix[r]![col]!
                const need = needOf(val, v?.unit)
                const n = brains ? brains[hv]! : 0
                const f = finisher ? finisher[hv]! : -1
                return (
                  <>
                    <b>
                      [{r}, {col}] = {val}
                    </b>{' '}
                    <span className="mute">· {bandOf(r).name}</span>
                    <br />
                    {f >= 0 ? (
                      <span>
                        whole, finished by <b>{v!.handles[f]}</b>
                      </span>
                    ) : (
                      <span className="mute">
                        {int(n)} of {int(need)} brains
                      </span>
                    )}
                  </>
                )
              })()}
            </div>
          ) : null}
        </div>

        <aside className="an-side">
          <div>
            <div className="nx lit an-n">{v ? int(v.finished) : '…'}</div>
            <div className="mute an-s">of {int(CELLS)} cells whole</div>
          </div>
          <div>
            <div className="nx lit an-n">{v ? int(v.total) : '…'}</div>
            <div className="mute an-s">of {v ? int(v.need) : '…'} brains planted</div>
            <div className="an-bar">
              <i style={{ width: `${v ? Math.min(100, (v.total / v.need) * 100) : 0}%` }} />
            </div>
          </div>
          <div className="mute an-s">
            {v?.whole
              ? `Anna was made whole on ${when(v.whole.ts)}.`
              : whenWhole
                ? `At this pace Anna is whole around ${day(whenWhole)}. The pace is the network’s, not a promise.`
                : 'The pace shows once two days of brains are planted. At last epoch’s rate she takes about 21 epochs: spring 2027.'}
          </div>

          {v?.whole ? (
            <div className="an-whole">
              <div className="mute an-s">the brain that made Anna whole</div>
              <div className="an-whole-h">{v.whole.hash}</div>
              <div className="an-s">
                grown by {v.whole.who}, tick {int(v.whole.tick)}
              </div>
            </div>
          ) : null}

          <form onSubmit={look} className="an-find">
            <input value={typed} onChange={e => setTyped(e.target.value)} placeholder="your identity, 60 letters" spellCheck={false} autoComplete="off" aria-label="Identity" />
            <button type="submit" className="btn">
              Find my part
            </button>
          </form>
          {found === 'none' ? (
            <div className="mute an-s">No brain of this identity is planted in Anna yet. Identities rotate; try the one your miner shows now.</div>
          ) : found ? (
            <div className="an-me">
              <div className="an-me-nums">
                <div>
                  <div className="nx lit an-me-n">{int(found.brains)}</div>
                  <div className="mute an-s">brains in Anna</div>
                </div>
                <div>
                  <div className="nx lit an-me-n">{int(found.cells.length)}</div>
                  <div className="mute an-s">cells finished</div>
                </div>
              </div>
              {found.rank ? (
                <div className="mute an-s">
                  #{int(found.rank)} of {int(found.gardeners)} gardeners by brains
                </div>
              ) : null}
              {found.cells.length ? (
                <div className="an-s">
                  Your cells, lit on the picture:{' '}
                  {found.cells
                    .slice(0, 8)
                    .map(c => `[${rowCol(c).join(', ')}]`)
                    .join(' ')}
                  {found.cells.length > 8 ? ` and ${found.cells.length - 8} more` : ''}
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            <div className="mute an-s">just made whole</div>
            <div className="an-feed">
              {(v?.recent ?? []).slice(0, 8).map(f => (
                <div key={`${f.c}-${f.h}`}>
                  <span className="mute">{ago(f.ts, now)}</span> [{rowCol(f.c).join(', ')}] by {f.who}
                </div>
              ))}
              {v && !v.recent.length ? <div className="mute">No cell is whole yet. The first one takes {int(needOf(0, v.unit))} brains at the least.</div> : null}
            </div>
          </div>
        </aside>
      </div>

      <p className="mute an-foot">
        How a brain finds its cell: its 60-letter hash, read as a number, modulo {int(CELLS)}. Nobody chooses, anybody can check it against the explorer.
        A cell needs {v?.unit ?? 128} brains for each step of her value, so a cell of value −90 needs {int(needOf(-90, v?.unit))} and a cell of value 0 needs{' '}
        {int(needOf(0, v?.unit))}; a brain whose cell is already whole goes to the next cell that is not. Click a whole cell to light everything its finisher
        finished. Every one of these brains is a real BPP-9000 network, grown on the real task and verified by the network; the best of them are on the
        shelf of Brain Watch. The picture is a way to see that work, not a separate one. It is an idea of ours, not CfB’s, and it promises nothing.
      </p>
      <AnnaStyles />
    </section>
  )
}

function AnnaStyles() {
  return (
    <style>{`
.gd .an { display: grid; gap: 18px; }
.gd .an-eyebrow { font-size: 13px; }
.gd .an-h1 { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 18px; font-weight: 400; }
.gd .an-pct { font-size: clamp(64px, 10vw, 128px); line-height: .95; }
.gd .an-h1-t { font-size: clamp(20px, 2.4vw, 28px); font-family: var(--bpp-sans), system-ui, sans-serif; color: var(--ink); }
.gd .an-lead { margin: 0; font-size: 16px; line-height: 1.6; max-width: 76ch; }
.gd .an-lead em { font-style: normal; color: var(--fil); }
.gd .an-start { display: flex; gap: 16px; align-items: center; padding: 12px 16px; border: 1px solid rgba(255,200,140,.3); border-radius: 14px; background: rgba(255,196,107,.06); font-size: 14px; max-width: 900px; }
.gd .an-start-n { font-size: 34px; line-height: 1; white-space: nowrap; }
.gd .an-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 22px; align-items: start; }
.gd .an-pic { position: relative; }
.gd .an-canvas { display: block; image-rendering: pixelated; image-rendering: crisp-edges; border-radius: 10px; box-shadow: 0 0 0 1px var(--line), 0 0 60px rgba(46,86,255,.12); cursor: crosshair; }
.gd .an-tip { position: absolute; pointer-events: none; background: rgba(11,10,14,.95); border: 1px solid rgba(255,200,140,.25); border-radius: 10px; padding: 8px 10px; font-size: 12px; line-height: 1.5; width: 230px; }
.gd .an-side { border: 1px solid var(--line); border-radius: 18px; padding: 18px; display: grid; gap: 16px; align-content: start; font-size: 14px; }
.gd .an-n { font-size: 40px; line-height: 1; }
.gd .an-s { font-size: 13px; line-height: 1.5; }
.gd .an-bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,.06); overflow: hidden; margin-top: 8px; }
.gd .an-bar i { display: block; height: 100%; min-width: 2px; background: linear-gradient(90deg, #E8912E, #FFE3B0); box-shadow: 0 0 12px rgba(232,145,46,.6); }
.gd .an-whole { border: 1px solid rgba(255,200,140,.5); border-radius: 14px; padding: 12px 14px; background: rgba(255,196,107,.1); }
.gd .an-whole-h { font-size: 12px; word-break: break-all; color: var(--hot); margin: 4px 0; }
.gd .an-find { display: flex; gap: 8px; }
.gd .an-find input { font-size: 12px; letter-spacing: .03em; text-transform: uppercase; }
.gd .an-find .btn { min-height: 38px; padding: 6px 14px; white-space: nowrap; }
.gd .an-me { display: grid; gap: 8px; border: 1px solid rgba(124,72,255,.35); background: rgba(124,72,255,.07); border-radius: 14px; padding: 12px 14px; }
.gd .an-me-nums { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.gd .an-me-n { font-size: 32px; line-height: 1; }
.gd .an-feed { display: grid; gap: 4px; font-size: 13px; margin-top: 4px; }
.gd .an-foot { font-size: 13px; line-height: 1.6; max-width: 92ch; margin: 0; }
@media (max-width: 900px) { .gd .an-grid { grid-template-columns: 1fr; } }
`}</style>
  )
}
