'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type EpochGarden, homework, isIdentity } from '@/lib/garden/garden-view'
import { BRAINS_PER_CELL, type FieldView, type Territory, cellAt, colourOf, marks, toNextCell } from '@/lib/garden/field-view'

/**
 * The Field: the epoch as land. Every computor's brains claim cells along one curve, in the order the computors
 * first appeared this epoch, so each one holds a single territory that only grows. Wednesday 12:00 UTC seals the
 * field; a sealed field is kept as the map of that epoch.
 */
type FieldResp = (FieldView & { ok: true; epochs: number[] }) | { ok: false; reason: string; epochs?: number[] }

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const short = (s: string, a = 6, b = 4) => `${s.slice(0, a)}…${s.slice(-b)}`
const int = (n: number) => n.toLocaleString('en-US')
const pct = (n: number | null | undefined) => (n == null ? '—' : `${n.toFixed(1)}%`)
const when = (t: number | null) => {
  if (!t) return '—'
  const d = new Date(t)
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`
}
const ago = (t: number | null, now: number) => {
  if (t == null) return '—'
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

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: 'no-store' })
    return (await r.json()) as T
  } catch {
    return null
  }
}

export function Field({ g, now }: { g: EpochGarden | null; now: number }) {
  const [epoch, setEpoch] = useState<number | null>(null)
  const [f, setF] = useState<FieldResp | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [hover, setHover] = useState<{ t: Territory; x: number; y: number } | null>(null)
  const [typed, setTyped] = useState('')
  const base = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(720)

  useEffect(() => {
    let on = true
    const load = () => getJson<FieldResp>(`/api/garden/field${epoch ? `?epoch=${epoch}` : ''}`).then(r => on && r && setF(r))
    load()
    const t = setInterval(load, 120_000)
    return () => {
      on = false
      clearInterval(t)
    }
  }, [epoch])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize(el.clientWidth))
    ro.observe(el)
    setSize(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    try {
      const k = localStorage.getItem('garden:id')
      if (k && isIdentity(k)) {
        setTyped(k)
        setSel(k)
      }
    } catch {}
  }, [])

  const view = f && f.ok ? f : null
  const grid = useMemo(() => (view ? { w: view.grid.w, h: view.grid.h, block: view.grid.h } : null), [view])
  const ts = view?.territories ?? []
  const byId = useMemo(() => new Map(ts.map(t => [t.id, t])), [ts])
  const selected = sel ? (byId.get(sel) ?? null) : null
  const pool = useMemo(() => new Set(view?.pool ?? []), [view])
  const poolCells = ts.filter(t => pool.has(t.id)).reduce((a, t) => a + t.cells, 0)
  const newest = useMemo(() => [...ts].sort((a, b) => (b.last ?? 0) - (a.last ?? 0)).slice(0, 5), [ts])

  // the land itself: one pixel per cell on an offscreen canvas, scaled up crisp
  useEffect(() => {
    const c = base.current
    if (!c || !view || !grid) return
    c.width = grid.w
    c.height = grid.h
    const x = c.getContext('2d')!
    x.fillStyle = 'rgba(255,255,255,.03)'
    x.fillRect(0, 0, grid.w, grid.h)
    for (const t of ts) {
      x.fillStyle = t.id === sel ? '#d9ccff' : pool.has(t.id) ? '#7c48ff' : colourOf(t.id)
      for (let d = t.at; d < t.at + t.cells; d++) {
        const [cx, cy] = cellAt(grid, d)
        x.fillRect(cx, cy, 1, 1)
      }
    }
    // the frontier: the newest cell of the territories growing right now, and of the chosen one
    for (const t of [...newest, ...(selected ? [selected] : [])]) {
      if (!t.cells) continue
      const [cx, cy] = cellAt(grid, t.at + t.cells - 1)
      x.fillStyle = t.id === sel ? '#ffffff' : '#FFE3B0'
      x.fillRect(cx, cy, 1, 1)
    }
  }, [view, grid, ts, sel, pool, newest, selected])

  // inverse of the curve for one block: cell (x, y) → curve offset
  const inv = useMemo(() => {
    if (!grid) return null
    const n = grid.block
    const out = new Int32Array(n * n)
    for (let i = 0; i < n * n; i++) {
      const [hx, hy] = cellAt({ w: n, h: n, block: n }, i)
      out[hy * n + hx] = i
    }
    return out
  }, [grid?.block]) // eslint-disable-line react-hooks/exhaustive-deps

  const findAt = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    const c = ev.currentTarget
    if (!grid) return null
    const r = c.getBoundingClientRect()
    const cx = Math.floor(((ev.clientX - r.left) / r.width) * grid.w)
    const cy = Math.floor(((ev.clientY - r.top) / r.height) * grid.h)
    if (cx < 0 || cy < 0 || cx >= grid.w || cy >= grid.h) return null
    // cells in curve order: the territory whose span holds the curve offset of this cell
    if (!inv) return null
    const per = grid.block * grid.block
    const b = Math.floor(cx / grid.block)
    const d = inv[cy * grid.block + (cx - b * grid.block)]! + b * per
    let lo = 0
    let hi = ts.length - 1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const t = ts[mid]!
      if (d < t.at) hi = mid - 1
      else if (d >= t.at + t.cells) lo = mid + 1
      else return { t, x: ev.clientX - r.left, y: ev.clientY - r.top }
    }
    return null
  }

  const pick = (e?: React.FormEvent) => {
    e?.preventDefault()
    const v = typed.trim().toUpperCase()
    if (!isIdentity(v)) return
    setSel(v)
    try {
      localStorage.setItem('garden:id', v)
    } catch {}
  }

  const dayOf = view ? Math.min(7, Math.max(1, Math.floor((now - view.start) / 86_400_000) + 1)) : null
  const inHundred = selected != null && (g?.gardeners ?? []).some(x => x.id === selected.id)
  const bestOf = selected != null && g?.best?.gardener === selected.id
  const mk = marks(selected, inHundred, bestOf)

  return (
    <section className="gd-field">
      <div className="gd-field-head">
        <div>
          <div className="label">The field: the epoch as land, claimed brain by brain</div>
          <div className="mute gd-small">
            One cell per {BRAINS_PER_CELL} verified brains. Every computor’s brains make one territory that only grows; nobody can take a cell away.
            {view ? (view.sealed ? ` Epoch ${view.epoch} is sealed: this is its map.` : ` Epoch ${view.epoch}, day ${dayOf} of 7, seals in ${left(view.end - now)}.`) : ''}
          </div>
        </div>
        {f && 'epochs' in f && f.epochs?.length ? (
          <div className="gd-maps" role="tablist" aria-label="Epochs">
            {f.epochs.map(e => (
              <button key={e} type="button" role="tab" aria-selected={(epoch ?? f.epochs![0]) === e} className={`gd-map${(epoch ?? f.epochs![0]) === e ? ' on' : ''}`} onClick={() => setEpoch(e)}>
                {e}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="gd-field-grid">
        <div className="gd-land" ref={wrap} style={{ height: grid ? Math.round((size * grid.h) / grid.w) : 400 }}>
          {view ? (
            <canvas
              ref={base}
              className="gd-land-c"
              style={{ width: size, height: grid ? Math.round((size * grid.h) / grid.w) : 400 }}
              onMouseMove={ev => setHover(findAt(ev))}
              onMouseLeave={() => setHover(null)}
              onClick={ev => {
                const h = findAt(ev)
                if (h) {
                  setSel(h.t.id)
                  setTyped(h.t.id)
                }
              }}
              aria-label="The field: territories of the computors this epoch"
            />
          ) : (
            <div className="mute gd-small" style={{ padding: 18 }}>
              {f && !f.ok ? f.reason : 'Reading the field…'}
            </div>
          )}
          {hover ? (
            <div className="gd-tip" style={{ left: Math.min(hover.x + 14, size - 230), top: Math.max(0, hover.y - 56) }}>
              <b>{short(hover.t.id, 8, 6)}</b>
              <br />
              <span className="mute">
                {int(hover.t.cells)} cells · {int(hover.t.brains)} brains · since {when(hover.t.first)}
              </span>
            </div>
          ) : null}
        </div>
        <aside className="gd-side">
          <div>
            <div className="mute gd-small">{view ? `epoch ${view.epoch}${view.sealed ? ', sealed' : `, day ${dayOf} of 7`}` : 'epoch …'}</div>
            <div className="nx lit gd-side-n">{view ? int(view.grown) : '…'}</div>
            <div className="mute gd-small">
              brains · {view ? int(view.cells) : '…'} cells claimed by {view ? int(ts.length) : '…'} computors
            </div>
            {poolCells ? (
              <div className="gd-small" style={{ marginTop: 6 }}>
                <i className="gd-swatch" style={{ background: '#7c48ff' }} /> Aigarth Pool: {int(poolCells)} cells
              </div>
            ) : null}
            {view && !view.sealed ? (
              <div className="gd-bar">
                <i style={{ width: `${Math.min(100, ((now - view.start) / (view.end - view.start)) * 100).toFixed(1)}%` }} />
              </div>
            ) : null}
          </div>

          <form onSubmit={pick} className="gd-find">
            <input value={typed} onChange={e => setTyped(e.target.value)} placeholder="find a territory: computor identity, 60 letters" spellCheck={false} autoComplete="off" aria-label="Computor identity" />
            <button type="submit" className="btn">
              Find
            </button>
          </form>

          {selected ? (
            <div className="gd-sel">
              <div className="gd-sel-id" title={selected.id}>
                <i className="gd-swatch" style={{ background: '#b9a6ff' }} /> {short(selected.id, 10, 8)}
              </div>
              <div className="gd-sel-nums">
                <div>
                  <div className="nx lit gd-sel-n">{int(selected.cells)}</div>
                  <div className="mute gd-small">cells</div>
                </div>
                <div>
                  <div className="nx lit gd-sel-n">{int(selected.brains)}</div>
                  <div className="mute gd-small">brains this epoch</div>
                </div>
              </div>
              <div className="mute gd-small">next cell in {toNextCell(selected.brains)} brains</div>
              <div className="gd-bar you">
                <i style={{ width: `${((selected.brains % BRAINS_PER_CELL) / BRAINS_PER_CELL) * 100}%` }} />
              </div>
              <div className="mute gd-small">
                first brain {when(selected.first)} · last {when(selected.last)}
              </div>
            </div>
          ) : sel ? (
            <div className="mute gd-small">
              {short(sel, 8, 6)} holds no cell this epoch{byId.size ? '' : ' yet'}. {BRAINS_PER_CELL} verified brains claim the first one.
            </div>
          ) : (
            <div className="mute gd-small">Click a territory, or type a computor identity, to see its land and its marks.</div>
          )}

          <div>
            <div className="mute gd-small">marks{selected ? ` of ${short(selected.id)}` : ''}</div>
            <div className="gd-marks">
              {mk.map(m => (
                <span key={m.key} className={m.got ? 'on' : ''} title={m.note}>
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="mute gd-small">just now</div>
            <div className="gd-feed">
              {(g?.births ?? []).slice(0, 6).map(b => (
                <div key={b.hash} className={b.gardener === sel ? 'you' : ''}>
                  <span className="mute">{ago(b.ts, now)}</span> +1 <i className="gd-swatch" style={{ background: colourOf(b.gardener) }} /> {short(b.gardener)}
                  {b.depth != null ? <span className="mute"> · gen {b.depth}</span> : null} <span className="glow-g">{pct(homework(b.score))}</span>
                  {b.gardener === sel ? ' ✦' : ''}
                </div>
              ))}
              {!g ? <div className="mute">…</div> : null}
            </div>
          </div>

          {newest.length ? (
            <div className="mute gd-small">
              Growing right now: {newest.map(t => short(t.id)).join(', ')}.{' '}
              {view ? `Field read ${ago(new Date(view.updatedAt).getTime(), now)}.` : ''}
            </div>
          ) : null}
        </aside>
      </div>
      <p className="mute gd-small gd-field-foot">
        A computor is the identity the network credits a solution to; a pool or a miner may use several, and many appear for a few hours only.
        Territories lie along one curve in the order the identities first appeared this epoch, so a territory can shift a little while the field
        grows, and never after the seal. A pool worker’s own share is kept in the pool’s record.
      </p>
    </section>
  )
}

export function FieldStyles() {
  return (
    <style>{`
.gd .gd-field { display: grid; gap: 14px; }
.gd .gd-field-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
.gd .gd-maps { display: flex; gap: 6px; flex-wrap: wrap; }
.gd .gd-map { font: inherit; font-size: 13px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line); background: transparent; color: var(--dim); cursor: pointer; }
.gd .gd-map.on { color: var(--hot); border-color: rgba(255,200,140,.5); background: rgba(255,196,107,.08); }
.gd .gd-field-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 22px; align-items: start; }
.gd .gd-land { position: relative; border: 1px solid var(--line); border-radius: 18px; overflow: hidden; background: rgba(255,205,110,.02); }
.gd .gd-land-c { display: block; image-rendering: pixelated; image-rendering: crisp-edges; cursor: crosshair; }
.gd .gd-tip { position: absolute; pointer-events: none; background: rgba(11,10,14,.94); border: 1px solid rgba(255,200,140,.25); border-radius: 10px; padding: 8px 10px; font-size: 12px; line-height: 1.5; width: 220px; }
.gd .gd-side { border: 1px solid var(--line); border-radius: 18px; padding: 18px; display: grid; gap: 16px; align-content: start; font-size: 14px; }
.gd .gd-side-n { font-size: 44px; line-height: 1; }
.gd .gd-bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,.06); overflow: hidden; margin-top: 8px; }
.gd .gd-bar i { display: block; height: 100%; background: linear-gradient(90deg, #E8912E, #FFE3B0); box-shadow: 0 0 12px rgba(232,145,46,.6); }
.gd .gd-bar.you i { background: linear-gradient(90deg, #7c48ff, #b9a6ff); box-shadow: 0 0 12px rgba(124,72,255,.7); }
.gd .gd-find { display: flex; gap: 8px; }
.gd .gd-find input { font-size: 12px; letter-spacing: .03em; text-transform: uppercase; }
.gd .gd-find .btn { min-height: 38px; padding: 6px 14px; }
.gd .gd-sel { display: grid; gap: 8px; border: 1px solid rgba(124,72,255,.35); background: rgba(124,72,255,.07); border-radius: 14px; padding: 12px 14px; }
.gd .gd-sel-id { font-size: 13px; display: flex; align-items: center; gap: 6px; }
.gd .gd-sel-nums { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.gd .gd-sel-n { font-size: 34px; line-height: 1; }
.gd .gd-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; vertical-align: -1px; }
.gd .gd-marks { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.gd .gd-marks span { border: 1px solid rgba(255,200,140,.22); border-radius: 999px; padding: 4px 10px; font-size: 12px; color: var(--dim); }
.gd .gd-marks span.on { background: rgba(255,196,107,.14); color: var(--hot); border-color: rgba(255,200,140,.5); }
.gd .gd-feed { display: grid; gap: 4px; font-size: 13px; margin-top: 4px; }
.gd .gd-feed .you { color: #d9ccff; }
.gd .gd-field-foot { margin: 0; max-width: 90ch; }
@media (max-width: 900px) { .gd .gd-field-grid { grid-template-columns: 1fr; } }
`}</style>
  )
}
