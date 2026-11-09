'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { bandOf } from '@/lib/garden/field-view'

/**
 * The first screen of the Aigarth Pool, in the site's own style (the BPP-9000 page is the reference): the
 * name lit like a filament, Maria's phone in the middle as the product, the brain the pool grows glowing
 * behind it, the miners as stars round it, and the way down the page. Below it, the participants.
 * The participants are preview data until the pool's backend reports per worker; the page says so.
 */
type Api = { connect: (on: boolean) => void; select: (k: number | null) => void; dispose: () => void }
type Worker = { tag: string; brains: number; share: number }
export type Hook = { href: string; title: string; note: string }

const PREVIEW: Worker[] = (() => {
  const names = ['QC.W4W.0007', 'QC.W4W.0013', 'QC.W4W.0002', 'QC.W4W.0021', 'QC.W4W.0005', 'QC.W4W.0034', 'QC.W4W.0011', 'QC.W4W.0019', 'QC.W4W.0003', 'QC.W4W.0027']
  const raw = [41820, 30210, 22640, 18300, 12950, 9810, 6620, 4410, 2080, 940]
  const tot = raw.reduce((a, b) => a + b, 0)
  return names.map((tag, k) => ({ tag, brains: raw[k]!, share: raw[k]! / tot }))
})()

const int = (n: number) => n.toLocaleString('en-US')

export function PoolHero({ phone, hooks, preview }: { phone: ReactNode; hooks: Hook[]; preview: boolean }) {
  const el = useRef<HTMLDivElement>(null)
  const api = useRef<Api | null>(null)
  const [matrix, setMatrix] = useState<number[][] | null>(null)
  const [on, setOn] = useState(false)
  const [hover, setHover] = useState<{ k: number; x: number; y: number } | null>(null)
  const [cell, setCell] = useState<number | null>(null)

  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        const [{ mountBrain, parseBrain }, m, b] = await Promise.all([
          import('./scene'),
          fetch('/data/anna-matrix-min.json').then(r => r.json()),
          fetch('/data/brain.bin').then(r => r.arrayBuffer()),
        ])
        if (dead || !el.current) return
        setMatrix(m.matrix)
        api.current = mountBrain(el.current, {
          matrix: m.matrix,
          brain: parseBrain(b),
          wide: true,
          onPick: (k: number | null) => setCell(k),
          onHover: (k: number | null, x: number, y: number) => setHover(k == null ? null : { k, x, y }),
        })
      } catch {
        // without WebGL the page still works: the phone, the words and the links
      }
    })()
    return () => {
      dead = true
      api.current?.dispose()
    }
  }, [])

  const at = (k: number) => {
    const r = Math.floor(k / 128)
    const c = k % 128
    return { r, c, v: matrix ? matrix[r]![c]! : 0 }
  }

  return (
    <>
      <section className="ph" aria-labelledby="ph-title">
        <div ref={el} className="ph-stage" />

        <div className="ph-grid">
          <div className="ph-left">
            <div className="ph-eng">
              <span aria-hidden className="ph-pilot" />
              QUBIC CHURCH · MINING POOL
              {preview ? <span className="ph-pill">private preview</span> : null}
            </div>
            <h1 className="ph-title" id="ph-title">
              Aigarth
              <br />
              Pool
            </h1>
            <p className="ph-line">
              We are growing <span className="ph-lit">a mind.</span>
            </p>
            <p className="ph-lead">
              Every solution a miner sends is a small neural network, checked by the whole Qubic network. Here they add up to one brain, written into the 16,384
              cells of the Anna Matrix. Each star is a miner; every light inside is a cell someone is growing.
            </p>
            <div className="ph-btns">
              <button
                type="button"
                className={`ph-btn main${on ? ' on' : ''}`}
                onClick={() => {
                  const next = !on
                  setOn(next)
                  api.current?.connect(next)
                  if (next) setTimeout(() => document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' }), 2600)
                }}
              >
                {on ? 'Your light is joining' : 'Add your light'}
              </button>
              <a className="ph-btn" href="#join">
                How to join
              </a>
            </div>
          </div>

          <div className="ph-phone" id="maria-phone">
            {phone}
          </div>

          <nav className="ph-right" aria-label="On this page">
            <div className="ph-eng ph-small">FURTHER DOWN</div>
            {hooks.map(h => (
              <a key={h.href} href={h.href} className="ph-hook">
                <b>{h.title}</b>
                <span>{h.note}</span>
              </a>
            ))}
            {cell != null ? (
              <div className="ph-card" role="dialog" aria-label="Anna cell">
                <button
                  type="button"
                  className="ph-x"
                  onClick={() => {
                    setCell(null)
                    api.current?.select(null)
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
                <div className="ph-eng ph-small">CELL OF THE ANNA MATRIX</div>
                <div className="ph-cell">
                  [{at(cell).r}, {at(cell).c}] <span className={at(cell).v < 0 ? 'neg' : 'pos'}>{at(cell).v}</span>
                </div>
                <div className="ph-small">
                  Row {at(cell).r}: {bandOf(at(cell).r).name}, as Jordan reads the rows. {int(Math.max(1, Math.abs(at(cell).v)) * 128)} brains grow it whole; growth starts
                  11 November. The worker whose brain completes it keeps its name here.
                </div>
              </div>
            ) : (
              <div className="ph-small ph-dim">Click any light in the brain to open its cell.</div>
            )}
          </nav>
        </div>

        {hover && cell !== hover.k ? (
          <div className="ph-tip" style={{ left: hover.x + 14, top: hover.y - 10 }}>
            [{at(hover.k).r}, {at(hover.k).c}] = {at(hover.k).v}
          </div>
        ) : null}
        <a href="#participants" aria-label="Further down" className="ph-cue" />
      </section>

      <section className="ph-band" id="participants" aria-label="Participants">
        <div className="ph-panel">
          <div className="ph-band-head">
            <h2 className="ph-h2">Who is growing it</h2>
            <span className="ph-small ph-amber">Preview data. Real numbers per worker appear when the pool goes live.</span>
          </div>
          <ol className="ph-rows">
            {PREVIEW.map((w, k) => (
              <li key={w.tag}>
                <span className="ph-rank">{k + 1}</span>
                <span className="ph-tag">{w.tag}</span>
                <span className="ph-n">{int(w.brains)}</span>
                <i className="ph-bar" style={{ width: `${Math.max(2, w.share * 220)}%` }} />
              </li>
            ))}
          </ol>
          <div className="ph-small ph-dim">brains given to the pool this epoch, by worker</div>
        </div>
      </section>

      <style>{`
.ph { position: relative; min-height: calc(100svh - 60px); display: grid; align-items: center; padding: clamp(20px, 3vh, 40px) clamp(16px, 4vw, 48px) 72px; color: var(--ink, #ecdfcb); font-family: var(--bpp-sans), system-ui, sans-serif; --fil: #FFC46B; --hot: #FFE3B0; --ink: #ecdfcb; --dim: #93857a; --line: rgba(255,200,140,.14); }
.ph-stage { position: absolute; inset: 0; -webkit-mask-image: radial-gradient(60% 62% at 50% 50%, #000 55%, transparent 100%); mask-image: radial-gradient(60% 62% at 50% 50%, #000 55%, transparent 100%); }
.ph-grid { position: relative; z-index: 2; display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: clamp(24px, 3vw, 56px); align-items: center; max-width: 1440px; width: 100%; margin: 0 auto; pointer-events: none; }
.ph-grid a, .ph-grid button, .ph-phone, .ph-card { pointer-events: auto; }
.ph-left { max-width: 440px; }
.ph-eng { font-family: var(--bpp-eng), sans-serif; letter-spacing: .14em; font-size: 12px; color: #f3e4ce; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ph-pilot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--fil); box-shadow: 0 0 8px var(--fil), 0 0 18px #E8912E; animation: ph-dot 2.4s ease-in-out infinite; }
@keyframes ph-dot { 50% { opacity: .45 } }
.ph-pill { font-family: var(--bpp-sans), sans-serif; letter-spacing: 0; font-size: 11px; color: var(--fil); border: 1px solid rgba(255,196,107,.4); border-radius: 999px; padding: 2px 8px; }
.ph-title { margin: 18px 0 0; font-family: var(--bpp-nx), sans-serif !important; font-weight: 300; font-size: clamp(76px, 9vw, 150px); line-height: .84; letter-spacing: .01em; text-transform: uppercase; color: var(--hot); text-shadow: 0 0 4px #ffd08a, 0 0 14px var(--fil), 0 0 40px rgba(232,145,46,.7), 0 0 90px rgba(232,145,46,.35); }
.ph-line { display: inline-block; margin: 22px 0 0; font-size: clamp(20px, 1.9vw, 26px); font-weight: 600; color: var(--ink); padding-bottom: 8px; background: linear-gradient(90deg, var(--fil), rgba(255,196,107,0)) bottom / 100% 2px no-repeat; }
.ph-lit { font-family: var(--bpp-nx), sans-serif; font-weight: 400; font-size: 1.45em; line-height: 1; color: var(--hot); text-shadow: 0 0 4px #ffd08a, 0 0 14px var(--fil), 0 0 36px rgba(232,145,46,.6); }
.ph-lead { margin: 16px 0 0; font-size: 15px; line-height: 1.6; color: #cbbda8; text-shadow: 0 1px 10px #0b0a0e, 0 0 3px #0b0a0e; }
.ph-btns { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 24px; }
.ph-btn { display: inline-flex; align-items: center; min-height: 46px; padding: 10px 22px; border-radius: 999px; border: 1px solid rgba(255,200,140,.3); background: rgba(11,10,14,.5); color: var(--ink); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; transition: background .15s, border-color .15s; }
.ph-btn:hover { border-color: rgba(255,200,140,.55); background: rgba(255,200,140,.08); }
.ph-btn.main { background: var(--fil); color: #2a1404; border-color: var(--fil); box-shadow: 0 0 22px rgba(232,145,46,.5); }
.ph-btn.main:hover { background: var(--hot); }
.ph-btn.main.on { background: rgba(124,72,255,.45); color: #f3efff; border-color: rgba(185,166,255,.8); box-shadow: 0 0 30px rgba(124,72,255,.7); }
.ph-btn:focus-visible, .ph-hook:focus-visible { outline: 2px solid var(--hot); outline-offset: 3px; }
.ph-phone { --device-h: min(800px, calc(100svh - 140px)); filter: drop-shadow(0 0 60px rgba(46,86,255,.25)); }
.ph-right { justify-self: end; width: min(300px, 100%); display: grid; gap: 10px; }
.ph-hook { display: grid; gap: 3px; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--line); background: rgba(11,10,14,.55); color: var(--ink); text-decoration: none; transition: border-color .15s, background .15s; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.ph-hook:hover { border-color: rgba(255,200,140,.5); background: rgba(255,196,107,.06); }
.ph-hook b { font-size: 15px; font-weight: 600; }
.ph-hook span { font-size: 13px; color: var(--dim); }
.ph-small { font-size: 12.5px; line-height: 1.55; }
.ph-dim { color: var(--dim); }
.ph-amber { color: var(--fil); }
.ph-card { position: relative; display: grid; gap: 6px; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(255,200,140,.35); background: rgba(11,10,14,.75); }
.ph-x { all: unset; position: absolute; right: 10px; top: 6px; cursor: pointer; font-size: 18px; color: var(--dim); }
.ph-cell { font-family: var(--bpp-nx), sans-serif; font-size: 34px; line-height: 1; font-variant-numeric: tabular-nums; }
.ph-cell .neg { color: #9ec2ff; text-shadow: 0 0 14px rgba(80,140,255,.7); }
.ph-cell .pos { color: var(--hot); text-shadow: 0 0 14px var(--fil); }
.ph-tip { position: absolute; z-index: 3; pointer-events: none; font-size: 12px; background: rgba(11,10,14,.9); border: 1px solid var(--line); padding: 4px 8px; border-radius: 8px; font-variant-numeric: tabular-nums; }
.ph-cue { position: absolute; z-index: 2; left: 50%; bottom: 22px; width: 18px; height: 18px; margin-left: -9px; border-right: 1.5px solid var(--fil); border-bottom: 1.5px solid var(--fil); transform: rotate(45deg); animation: ph-cue 2.2s ease-in-out infinite; }
@keyframes ph-cue { 0%, 100% { transform: translateY(-3px) rotate(45deg); opacity: .4 } 50% { transform: translateY(4px) rotate(45deg); opacity: .95 } }
@media (prefers-reduced-motion: reduce) { .ph-cue, .ph-pilot { animation: none } }
.ph-band { --fil: #FFC46B; --hot: #FFE3B0; --ink: #ecdfcb; --dim: #93857a; --line: rgba(255,200,140,.14); position: relative; z-index: 1; padding: 0 clamp(16px, 4vw, 48px); display: flex; justify-content: center; scroll-margin-top: 80px; }
.ph-panel { width: min(1100px, 100%); border: 1px solid var(--line, rgba(255,200,140,.14)); border-radius: 18px; background: rgba(255,205,110,.03); padding: 20px 22px 16px; display: grid; gap: 12px; color: #ecdfcb; font-family: var(--bpp-sans), system-ui, sans-serif; }
.ph-band-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.ph-h2 { margin: 0; font-family: var(--bpp-nx), sans-serif !important; font-weight: 400; font-size: 34px; letter-spacing: .01em; color: #ecdfcb; }
.ph-rows { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; column-gap: 28px; row-gap: 2px; }
.ph-rows li { position: relative; display: grid; grid-template-columns: 22px 1fr auto; gap: 8px; align-items: center; font-size: 13.5px; padding: 6px 4px; overflow: hidden; }
.ph-rank { color: #93857a; font-variant-numeric: tabular-nums; }
.ph-tag { font-family: var(--font-geist-mono), ui-monospace, monospace; font-size: 12.5px; }
.ph-n { font-family: var(--bpp-nx), sans-serif; font-size: 18px; font-variant-numeric: tabular-nums; color: #FFE3B0; }
.ph-bar { position: absolute; left: 0; bottom: 0; height: 2px; background: linear-gradient(90deg, #E8912E, #FFE3B0); box-shadow: 0 0 8px rgba(232,145,46,.6); }
@media (max-width: 1180px) {
  .ph-grid { grid-template-columns: minmax(0, 1fr) auto; }
  .ph-right { grid-column: 1 / -1; justify-self: stretch; width: auto; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
  .ph-right .ph-eng { display: none; }
}
@media (max-width: 820px) {
  .ph { align-items: start; padding-top: 24px; }
  .ph-grid { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .ph-left { max-width: 560px; }
  .ph-eng { justify-content: center; }
  .ph-line { background-position: bottom center; background-image: linear-gradient(90deg, rgba(255,196,107,0), var(--fil), rgba(255,196,107,0)); }
  .ph-btns { justify-content: center; }
  .ph-stage { -webkit-mask-image: radial-gradient(80% 50% at 50% 60%, #000 50%, transparent 100%); mask-image: radial-gradient(80% 50% at 50% 60%, #000 50%, transparent 100%); }
  .ph-rows { grid-template-columns: 1fr; }
  .ph-lead { display: none; }
}
`}</style>
    </>
  )
}
