'use client'

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { bandOf } from '@/lib/garden/field-view'

/**
 * The Aigarth Pool's first screen: the brain the pool grows, the miners as stars round it, Maria beside it,
 * the participants with what each gives, any of the brain's 16,384 nodes (one per cell of the Anna Matrix)
 * open to a click, and hooks into the rest of the page. The participants are preview data until the pool's
 * backend reports per worker; the page says so.
 */
type Api = { connect: (on: boolean) => void; select: (k: number | null) => void; dispose: () => void }

type Worker = { tag: string; brains: number; share: number; you?: boolean }

/** Preview rows, clearly labelled on the page, until CODED reports per worker. */
const PREVIEW: Worker[] = (() => {
  const names = ['QC.W4W.0007', 'QC.W4W.0013', 'QC.W4W.0002', 'QC.W4W.0021', 'QC.W4W.0005', 'QC.W4W.0034', 'QC.W4W.0011', 'QC.W4W.0019', 'QC.W4W.0003', 'QC.W4W.0027']
  const raw = [41820, 30210, 22640, 18300, 12950, 9810, 6620, 4410, 2080, 940]
  const tot = raw.reduce((a, b) => a + b, 0)
  return names.map((tag, k) => ({ tag, brains: raw[k]!, share: raw[k]! / tot }))
})()

const int = (n: number) => n.toLocaleString('en-US')

export type Hook = { href: string; title: string; note: string }
export type Quote = { text: string; who: string; where: string; date: string }

export function Brain({ variant = 'lab', aside, quote, hooks = [] }: { variant?: 'lab' | 'hero'; aside?: ReactNode; quote?: Quote; hooks?: Hook[] }) {
  const el = useRef<HTMLDivElement>(null)
  const api = useRef<Api | null>(null)
  const [matrix, setMatrix] = useState<number[][] | null>(null)
  const [on, setOn] = useState(false)
  const [failed, setFailed] = useState(false)
  const [hover, setHover] = useState<{ k: number; x: number; y: number } | null>(null)
  const [cell, setCell] = useState<number | null>(null)
  const [all, setAll] = useState(false)

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
          // on the pool page the brain sits in the free space: left of Maria's phone, below the title
          offset:
            variant === 'hero'
              ? () => {
                  const root = el.current?.closest('.br') as HTMLElement | null
                  const side = root?.querySelector('.br-aside') as HTMLElement | null
                  const wide = window.matchMedia('(min-width: 1101px)').matches
                  const aw = wide && side ? side.offsetWidth + 40 : 0
                  return { x: Math.max(0, aw / 2 - 50), y: Math.min(70, window.innerHeight * 0.07) }
                }
              : undefined,
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

  const workers = useMemo(() => {
    const rows = [...PREVIEW]
    if (on) rows.unshift({ tag: 'you', brains: 0, share: 0, you: true })
    return rows
  }, [on])

  const at = (k: number) => {
    const r = Math.floor(k / 128)
    const c = k % 128
    return { r, c, v: matrix ? matrix[r]![c]! : 0 }
  }

  const list = (
    <aside className={`br-list ${variant}`} aria-label="Participants" id="participants">
      <div className="br-list-t">
        Participants <span className="br-mute">{workers.length}</span>
      </div>
      <div className="br-note">Preview. Real numbers per worker when the pool goes live.</div>
      <ol className="br-rows">
        {(all || variant === 'hero' ? workers : workers.slice(0, 5)).map((w, k) => (
          <li key={w.tag} className={w.you ? 'you' : ''}>
            <span className="br-rank">{w.you ? '·' : on ? k : k + 1}</span>
            <span className="br-tag">{w.tag}</span>
            <span className="br-n">{w.you ? 'joining' : int(w.brains)}</span>
            <i className="br-bar" style={{ width: `${Math.max(2, w.share * 100 * 2.2)}%` }} />
          </li>
        ))}
      </ol>
      {variant === 'lab' && workers.length > 5 ? (
        <button type="button" className="br-more" onClick={() => setAll(x => !x)}>
          {all ? 'Fewer' : `All ${workers.length}`}
        </button>
      ) : null}
      <div className="br-mute br-small">brains given this epoch, by worker</div>
    </aside>
  )

  return (
    <>
    <section className={`br ${variant}${aside ? ' has-aside' : ''}`} aria-label="Aigarth Pool">
      <BrainStyles />
      <div className="br-sky">
        <div ref={el} className="br-stage" />
        {failed ? <div className="br-fail">This page needs WebGL.</div> : null}

        <header className="br-head">
          <h1 className="br-word">Aigarth Pool</h1>
          <p className="br-line">
            We are growing <em>a mind.</em>
          </p>
          <p className="br-lead">
            Every solution a miner sends is a small neural network, checked by the whole Qubic network. Here they add up to one brain, written into the 16,384 cells
            of the Anna Matrix. Each star is a miner. Every light inside is a cell someone is growing. Yours can be one of them.
          </p>
        </header>

        {variant === 'lab' ? list : null}

        {quote ? (
          <figure className="br-quote">
            <blockquote>“{quote.text}”</blockquote>
            <figcaption>
              {quote.who}, {quote.where}, {quote.date}
            </figcaption>
          </figure>
        ) : null}

        {hover && cell !== hover.k ? (
          <div className="br-tip" style={{ left: hover.x + 14, top: hover.y - 10 }}>
            [{at(hover.k).r}, {at(hover.k).c}] = {at(hover.k).v}
          </div>
        ) : null}

        {cell != null ? (
          <div className="br-card" role="dialog" aria-label="Anna cell">
            <button
              type="button"
              className="br-x"
              onClick={() => {
                setCell(null)
                api.current?.select(null)
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div className="br-mute br-small">Cell of the Anna Matrix</div>
            <div className="br-cell">
              [{at(cell).r}, {at(cell).c}] <span className={at(cell).v < 0 ? 'neg' : 'pos'}>{at(cell).v}</span>
            </div>
            <div className="br-small">
              Row {at(cell).r}: {bandOf(at(cell).r).name}, as Jordan reads the rows. Her value here is {at(cell).v}; it sets this light’s colour, cold below zero and warm
              above.
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
          <div className="br-btns">
            <a className="br-btn ghost" href={variant === 'hero' ? '#maria-phone' : '/maria-aigarth'}>
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
          {hooks.length ? (
            <nav className="br-hooks" aria-label="On this page">
              {hooks.map(h => (
                <a key={h.href} href={h.href}>
                  <b>{h.title}</b>
                  <span>{h.note}</span>
                </a>
              ))}
            </nav>
          ) : null}
          {variant === 'hero' ? <span aria-hidden className="br-cue" /> : null}
        </div>
      </div>

      {aside ? <div className="br-aside">{aside}</div> : null}
    </section>
    {variant === 'hero' ? <div className="br-band">{list}</div> : null}
    </>
  )
}

function BrainStyles() {
  return (
    <>

      <style>{`
.br { --aside-w: 0px; position: fixed; inset: 0; z-index: 20; background: #02040a; color: #e6eefc; font-family: var(--font-geist-sans), system-ui, sans-serif; overflow: hidden; }
.br-sky { position: absolute; inset: 0; }
.br-stage { position: absolute; inset: 0; }
.br-fail { position: absolute; inset: 0; display: grid; place-items: center; color: #8ea0c4; }
.br.hero { position: relative; inset: auto; z-index: 1; height: calc(100svh - 60px); min-height: 640px; }
.br.hero.has-aside { --aside-w: min(400px, 30vw); }
/* the sky runs on under the phone and fades into the page below */
.br.hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(70% 80% at 40% 45%, #0a1530 0%, #02040a 70%); }
.br.hero::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 280px; pointer-events: none; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.55) 55%, #000 100%); z-index: 2; }
.br-aside { position: absolute; z-index: 3; top: 0; bottom: 0; right: clamp(16px, 2.5vw, 40px); width: var(--aside-w); display: flex; align-items: center; justify-content: center; --device-h: min(780px, calc(100svh - 140px)); }
.br-head { position: absolute; z-index: 3; top: 22px; left: 0; right: var(--aside-w); margin: 0 auto; max-width: 680px; padding: 0 16px; text-align: center; pointer-events: none; }
.br-word { margin: 0; font-family: var(--font-instrument-serif), Georgia, serif !important; font-style: italic; font-weight: 400; font-size: clamp(44px, 5.4vw, 80px); line-height: .95; letter-spacing: -.01em; color: #f4f7ff; text-shadow: 0 0 40px rgba(80,170,255,.35); }
.br-line { display: inline-block; margin: 10px 0 0; font-size: clamp(18px, 1.9vw, 24px); font-weight: 500; color: #f2f6ff; padding-bottom: 6px; background: linear-gradient(90deg, rgba(79,180,255,0), rgba(159,220,255,.95), rgba(79,180,255,0)) bottom / 100% 2px no-repeat; }
.br-line em { font-family: var(--font-instrument-serif), Georgia, serif; font-style: italic; font-weight: 400; font-size: 1.18em; color: #bfe3ff; text-shadow: 0 0 22px rgba(80,170,255,.7); }
.br-lead { margin: 10px auto 0; max-width: 62ch; font-size: 14px; line-height: 1.55; color: #b9c6e2; text-shadow: 0 1px 12px #02040a, 0 0 4px #02040a; }
.br-list.lab { position: absolute; z-index: 3; left: clamp(16px, 2.5vw, 40px); top: 320px; width: 260px; }
.br-list { background: rgba(6,10,22,.6); border: 1px solid rgba(120,170,255,.16); border-radius: 16px; padding: 12px 12px 10px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.br-list-t { font-size: 13px; font-weight: 600; display: flex; gap: 8px; align-items: center; }
.br-note { font-size: 11px; color: #e8b97a; margin: 6px 0 6px; }
.br-rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 1px; }
.br-rows li { position: relative; display: grid; grid-template-columns: 18px 1fr auto; gap: 6px; align-items: center; font-size: 12px; padding: 4px 4px; border-radius: 6px; overflow: hidden; }
.br-rows li.you { color: #d9ccff; }
.br-rank { color: #8ea0c4; font-variant-numeric: tabular-nums; }
.br-tag { font-family: var(--font-geist-mono), ui-monospace, monospace; font-size: 11px; }
.br-n { font-variant-numeric: tabular-nums; }
.br-bar { position: absolute; left: 0; bottom: 0; height: 2px; background: linear-gradient(90deg, #4fb4ff, #9fdcff); box-shadow: 0 0 8px rgba(79,180,255,.7); }
.br-rows li.you .br-bar { background: #b9a6ff; }
.br-more { all: unset; cursor: pointer; font-size: 12px; color: #9fdcff; margin: 4px 4px 2px; }
.br-mute { color: #8ea0c4; }
.br-small { font-size: 12px; line-height: 1.5; }
.br-quote { position: absolute; z-index: 3; left: clamp(16px, 2.5vw, 40px); top: 50%; transform: translateY(-20%); margin: 0; width: 250px; text-align: left; pointer-events: none; text-shadow: 0 1px 12px #02040a; }
.br-quote blockquote { margin: 0; font-family: var(--font-instrument-serif), Georgia, serif; font-style: italic; font-size: 21px; line-height: 1.25; color: #f1e6c8; text-shadow: 0 0 18px rgba(254,206,52,.25); }
.br-quote figcaption { margin-top: 4px; font-size: 12px; color: #a99a78; }
.br-tip { position: absolute; z-index: 4; pointer-events: none; font-size: 12px; background: rgba(6,10,22,.9); border: 1px solid rgba(120,170,255,.25); padding: 4px 8px; border-radius: 8px; font-variant-numeric: tabular-nums; }
.br-card { position: absolute; z-index: 4; left: clamp(16px, 2.5vw, 40px); bottom: 150px; width: min(330px, calc(100% - 32px)); background: rgba(6,10,22,.86); border: 1px solid rgba(120,170,255,.28); border-radius: 16px; padding: 14px 16px; display: grid; gap: 8px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.br-x { all: unset; position: absolute; right: 12px; top: 8px; cursor: pointer; font-size: 20px; color: #8ea0c4; }
.br-cell { font-size: 26px; font-weight: 600; font-variant-numeric: tabular-nums; }
.br-cell .neg { color: #6fc4ff; text-shadow: 0 0 14px rgba(80,170,255,.7); }
.br-cell .pos { color: #ffb86a; text-shadow: 0 0 14px rgba(255,160,80,.7); }
.br-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.br-k { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
.br-foot { position: absolute; z-index: 3; left: 0; right: var(--aside-w); bottom: max(18px, env(safe-area-inset-bottom)); display: grid; justify-items: center; gap: 14px; pointer-events: none; }
.br-btns { display: flex; gap: 10px; }
.br-btn { pointer-events: auto; font: inherit; font-size: 15px; font-weight: 600; padding: 13px 26px; border-radius: 999px; border: 1px solid rgba(120,170,255,.3); background: rgba(6,10,22,.75); color: #eef2ff; cursor: pointer; text-decoration: none; }
.br-btn.main { background: #eef2ff; color: #0a0d18; border-color: #eef2ff; box-shadow: 0 0 34px rgba(160,200,255,.35); }
.br-btn.main.on { background: rgba(124,72,255,.45); color: #f3efff; border-color: rgba(185,166,255,.8); box-shadow: 0 0 34px rgba(124,72,255,.7); }
.br-hooks { pointer-events: auto; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; padding: 0 16px; }
.br-hooks a { display: grid; gap: 2px; text-decoration: none; color: #e6eefc; padding: 8px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,.08); background: rgba(6,10,22,.55); min-width: 180px; text-align: left; transition: border-color .15s, background .15s; }
.br-hooks a:hover { border-color: rgba(254,206,52,.45); background: rgba(254,206,52,.06); }
.br-hooks b { font-size: 13px; font-weight: 600; }
.br-hooks span { font-size: 12px; color: #8ea0c4; }
.br-cue { width: 18px; height: 18px; border-right: 1.5px solid #9fb0d0; border-bottom: 1.5px solid #9fb0d0; transform: rotate(45deg); animation: br-cue 2.2s ease-in-out infinite; opacity: .8; }
@keyframes br-cue { 0%, 100% { transform: translateY(-3px) rotate(45deg); opacity: .4 } 50% { transform: translateY(4px) rotate(45deg); opacity: .9 } }
@media (prefers-reduced-motion: reduce) { .br-cue { animation: none } }
.br-btn:focus-visible, .br-more:focus-visible, .br-hooks a:focus-visible { outline: 2px solid #9fdcff; outline-offset: 3px; }
/* on the pool page the participants are a band right under the first screen */
.br-band { position: relative; z-index: 1; background: #000; padding: 8px clamp(16px, 4vw, 48px) 0; display: flex; justify-content: center; }
.br-band .br-list { width: min(760px, 100%); background: rgba(10,14,28,.7); padding: 16px 18px 14px; }
.br-band .br-rows { grid-template-columns: 1fr 1fr; column-gap: 18px; }
@media (max-width: 760px) { .br-band .br-rows { grid-template-columns: 1fr; } }
@media (max-width: 1100px) {
  .br.hero.has-aside { --aside-w: 0px; }
  .br.hero { height: auto; min-height: 0; }
  .br.hero .br-sky { position: relative; height: calc(100svh - 60px); min-height: 640px; }
  .br-aside { position: relative; inset: auto; width: auto; padding: 32px 16px 48px; --device-h: min(780px, calc(100svh - 80px)); }
  .br.hero::after { display: none; }
  .br.hero, .br.hero::before { background: #000; }
  .br.hero .br-sky::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 220px; pointer-events: none; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 100%); z-index: 2; }
  .br-list.lab { display: none; }
  .br-quote { left: 0; right: 0; top: auto; bottom: 186px; margin: 0 auto; width: min(560px, calc(100% - 32px)); text-align: center; }
}
@media (max-width: 760px) {
  .br-lead { display: none; }
  .br-quote { top: 168px; bottom: auto; }
  .br-quote blockquote { font-size: 16px; }
  .br-hooks a { min-width: 0; }
  .br-hooks span { display: none; }
  .br-card { bottom: 196px; }
}
`}</style>
    </>
  )
}
