'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { bandOf } from '@/lib/garden/field-view'

/**
 * The Aigarth Pool's main screen: the brain in the middle, the miners as stars round it, a list of the pool's
 * participants with what each gives, and any of the brain's 16,384 nodes (one per cell of the Anna Matrix)
 * open to a click. The participants are preview data until the pool's backend reports per worker.
 */
type Api = { connect: (on: boolean) => void; select: (k: number | null) => void; dispose: () => void }

type Worker = { tag: string; brains: number; share: number; since: string; you?: boolean }

/** Preview rows, clearly labelled on the page, until CODED reports per worker. */
const PREVIEW: Worker[] = (() => {
  const names = ['QC.W4W.0007', 'QC.W4W.0013', 'QC.W4W.0002', 'QC.W4W.0021', 'QC.W4W.0005', 'QC.W4W.0034', 'QC.W4W.0011', 'QC.W4W.0019', 'QC.W4W.0003', 'QC.W4W.0027']
  const raw = [41820, 30210, 22640, 18300, 12950, 9810, 6620, 4410, 2080, 940]
  const tot = raw.reduce((a, b) => a + b, 0)
  return names.map((tag, k) => ({ tag, brains: raw[k]!, share: raw[k]! / tot, since: `epoch ${239 + (k % 3)}` }))
})()

const int = (n: number) => n.toLocaleString('en-US')

export function Brain({ variant = 'lab' }: { variant?: 'lab' | 'hero' }) {
  const el = useRef<HTMLDivElement>(null)
  const api = useRef<Api | null>(null)
  const [matrix, setMatrix] = useState<number[][] | null>(null)
  const [on, setOn] = useState(false)
  const [failed, setFailed] = useState(false)
  const [hover, setHover] = useState<{ k: number; x: number; y: number } | null>(null)
  const [cell, setCell] = useState<number | null>(null)
  const [list, setList] = useState(true)

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
          onPick: (k: number | null) => setCell(k),
          onHover: (k: number | null, x: number, y: number) => setHover(k == null ? null : { k, x, y }),
        })
      } catch {
        setFailed(true)
      }
    })()
    return () => {
      dead = true
      api.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(max-width: 760px)').matches) setList(false)
  }, [])

  const workers = useMemo(() => {
    const rows = [...PREVIEW]
    if (on) rows.push({ tag: 'you', brains: 0, share: 0, since: 'now', you: true })
    return rows
  }, [on])

  const at = (k: number) => {
    const r = Math.floor(k / 128)
    const c = k % 128
    return { r, c, v: matrix ? matrix[r]![c]! : 0 }
  }

  return (
    <div className={`br ${variant}`}>
      <div ref={el} className="br-stage" />
      {failed ? <div className="br-fail">This page needs WebGL.</div> : null}

      <header className="br-head">
        <div className="br-eyebrow">Aigarth Pool</div>
        <h1 className="br-h1">
          We are growing <em>a mind.</em>
        </h1>
        <p className="br-lead">
          Every solution a miner sends is a small neural network, checked by the whole Qubic network. Here they add up to one brain, written into the 16,384
          cells of the Anna Matrix. Each star is a miner. Every light inside is a cell someone is growing. Yours can be one of them.
        </p>
      </header>

      <aside className={`br-list${list ? ' open' : ''}`} aria-label="Participants">
        <button type="button" className="br-list-t" onClick={() => setList(x => !x)} aria-expanded={list}>
          Participants <span className="br-mute">{workers.length}</span>
        </button>
        {list ? (
          <>
            <div className="br-note">Preview data. Real numbers per worker appear when the pool goes live.</div>
            <ol className="br-rows">
              {workers.map((w, k) => (
                <li key={w.tag} className={w.you ? 'you' : ''}>
                  <span className="br-rank">{w.you ? '·' : k + 1}</span>
                  <span className="br-tag">{w.tag}</span>
                  <span className="br-n">{w.you ? 'connecting' : int(w.brains)}</span>
                  <i className="br-bar" style={{ width: `${Math.max(2, w.share * 100 * 2.2)}%` }} />
                </li>
              ))}
            </ol>
            <div className="br-mute br-small">brains given to the pool this epoch, by worker</div>
          </>
        ) : null}
      </aside>

      {hover && cell !== hover.k ? (
        <div className="br-tip" style={{ left: hover.x + 14, top: hover.y - 10 }}>
          [{at(hover.k).r}, {at(hover.k).c}] = {at(hover.k).v}
        </div>
      ) : null}

      {cell != null ? (
        <div className="br-card" role="dialog" aria-label="Anna cell">
          <button type="button" className="br-x" onClick={() => { setCell(null); api.current?.select(null) }} aria-label="Close">
            ×
          </button>
          <div className="br-eyebrow">Cell of the Anna Matrix</div>
          <div className="br-cell">
            [{at(cell).r}, {at(cell).c}] <span className={at(cell).v < 0 ? 'neg' : 'pos'}>{at(cell).v}</span>
          </div>
          <div className="br-small">
            Row {at(cell).r}: {bandOf(at(cell).r).name}, as Jordan reads the rows. Her value here is {at(cell).v}; it decides this point’s colour, cold below zero and
            warm above.
          </div>
          <div className="br-grid">
            <div>
              <div className="br-k">{int(Math.max(1, Math.abs(at(cell).v)) * 128)}</div>
              <div className="br-mute br-small">brains to grow it whole</div>
            </div>
            <div>
              <div className="br-k">—</div>
              <div className="br-mute br-small">grown so far; growth starts 11 Nov</div>
            </div>
          </div>
          <div className="br-mute br-small">Finished by: nobody yet. The worker whose brain completes it keeps its name here.</div>
        </div>
      ) : null}

      <div className="br-foot">
        <a className="br-btn ghost" href={variant === 'hero' ? '#maria' : '/maria-aigarth'}>
          Ask Maria
        </a>
        <button
          type="button"
          className={`br-btn main${on ? ' on' : ''}`}
          onClick={() => {
            const next = !on
            setOn(next)
            api.current?.connect(next)
            if (next && variant === 'hero') setTimeout(() => document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' }), 2600)
          }}
        >
          {on ? 'Your light is joining the brain' : 'Add your light'}
        </button>
      </div>

      <style>{`
.br { position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; background: #02040a; z-index: 20; color: #e6eefc; font-family: var(--font-geist-sans), system-ui, sans-serif; overflow: hidden; }
.br.hero .br-head, .br.hero .br-list { top: 40px; }
.br.hero { position: relative; z-index: 1; height: calc(100svh - 60px); min-height: 560px; }
.br-stage::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, rgba(2,4,10,.78) 0%, rgba(2,4,10,.35) 28%, rgba(2,4,10,0) 45%); }
@media (max-width: 760px) { .br-stage::after { background: linear-gradient(180deg, rgba(2,4,10,.7) 0%, rgba(2,4,10,0) 30%); } }
.br-stage { position: absolute; inset: 0; }
.br-fail { position: absolute; inset: 0; display: grid; place-items: center; color: #8ea0c4; }
.br-head { position: absolute; z-index: 1; top: 96px; left: clamp(16px, 4vw, 48px); max-width: 430px; pointer-events: none; }
.br-eyebrow { font-size: 13px; color: #8ea0c4; letter-spacing: .02em; }
.br-h1 { margin: 6px 0 10px; font-size: clamp(34px, 4.6vw, 60px); font-weight: 500; line-height: 1.02; letter-spacing: -.02em; color: #f2f6ff; }
.br-h1 em { font-family: var(--font-instrument-serif), Georgia, serif; font-style: italic; font-weight: 400; color: #bfe3ff; text-shadow: 0 0 28px rgba(80,170,255,.55); }
.br-lead { margin: 0; font-size: 14px; line-height: 1.55; color: #b9c6e2; }
.br-list { position: absolute; top: 96px; right: clamp(16px, 3vw, 40px); width: 300px; background: rgba(6,10,22,.72); border: 1px solid rgba(120,170,255,.18); border-radius: 16px; padding: 12px 14px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.br-list-t { all: unset; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; gap: 8px; align-items: center; }
.br-note { font-size: 11px; color: #e8b97a; margin: 8px 0 6px; }
.br-rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.br-rows li { position: relative; display: grid; grid-template-columns: 22px 1fr auto; gap: 8px; align-items: center; font-size: 13px; padding: 5px 6px; border-radius: 8px; overflow: hidden; }
.br-rows li.you { color: #d9ccff; }
.br-rank { color: #8ea0c4; font-variant-numeric: tabular-nums; }
.br-tag { font-family: ui-monospace, monospace; font-size: 12px; }
.br-n { font-variant-numeric: tabular-nums; }
.br-bar { position: absolute; left: 0; bottom: 0; height: 2px; background: linear-gradient(90deg, #4fb4ff, #9fdcff); box-shadow: 0 0 8px rgba(79,180,255,.7); }
.br-rows li.you .br-bar { background: #b9a6ff; }
.br-mute { color: #8ea0c4; }
.br-small { font-size: 12px; line-height: 1.5; }
.br-tip { position: absolute; pointer-events: none; font-size: 12px; background: rgba(6,10,22,.9); border: 1px solid rgba(120,170,255,.25); padding: 4px 8px; border-radius: 8px; font-variant-numeric: tabular-nums; }
.br-card { position: absolute; left: clamp(16px, 4vw, 48px); bottom: 104px; width: min(360px, calc(100vw - 32px)); background: rgba(6,10,22,.82); border: 1px solid rgba(120,170,255,.28); border-radius: 16px; padding: 14px 16px; display: grid; gap: 8px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.br-x { all: unset; position: absolute; right: 12px; top: 8px; cursor: pointer; font-size: 20px; color: #8ea0c4; }
.br-cell { font-size: 26px; font-weight: 600; font-variant-numeric: tabular-nums; }
.br-cell .neg { color: #6fc4ff; text-shadow: 0 0 14px rgba(80,170,255,.7); }
.br-cell .pos { color: #ffb86a; text-shadow: 0 0 14px rgba(255,160,80,.7); }
.br-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.br-k { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
.br-foot { position: absolute; left: 0; right: 0; bottom: max(24px, env(safe-area-inset-bottom)); display: flex; justify-content: center; gap: 10px; pointer-events: none; }
.br-btn { pointer-events: auto; font: inherit; font-size: 15px; font-weight: 600; padding: 13px 26px; border-radius: 999px; border: 1px solid rgba(185,166,255,.55); background: rgba(6,10,22,.75); color: #eef2ff; cursor: pointer; text-decoration: none; }
.br-btn.main { background: #eef2ff; color: #0a0d18; border-color: #eef2ff; box-shadow: 0 0 34px rgba(160,200,255,.35); }
.br-btn.main.on { background: rgba(124,72,255,.45); color: #f3efff; border-color: rgba(185,166,255,.8); box-shadow: 0 0 34px rgba(124,72,255,.7); }
.br-btn.ghost { border-color: rgba(120,170,255,.3); }
.br-btn:focus-visible, .br-list-t:focus-visible { outline: 2px solid #9fdcff; outline-offset: 3px; }
@media (max-width: 760px) {
  .br-head { top: 72px; max-width: none; right: 16px; }
  .br-lead { display: none; }
  .br-list { top: auto; bottom: 88px; right: 16px; left: 16px; width: auto; }
  .br.hero .br-list { top: auto; }
  .br.hero .br-head { top: 20px; }
  .br-list.open .br-rows { max-height: 36vh; overflow: auto; }
  .br-card { bottom: 88px; }
}
`}</style>
    </div>
  )
}
