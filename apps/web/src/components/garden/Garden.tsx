'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type EpochGarden, type Gen, type Lineage, type Plot, homework, isIdentity, sittings } from '@/lib/garden/garden-view'

/**
 * The Garden: the epoch as a season of growth. Brains grown so far, the births as they come, the best brain's
 * lineage traced back to its root, the gardeners behind the best hundred, and one gardener's own plot.
 * Hidden prototype for the Aigarth Pool game; every number is the explorer's, re-read every minute.
 */
type EpochResp = (EpochGarden & { ok: true }) | { ok: false; reason: string }
type LinResp = (Lineage & { ok: true }) | { ok: false; reason: string }
type PlotResp = (Plot & { ok: true }) | { ok: false; reason: string }

const SUNRISE = Date.UTC(2026, 10, 18, 12)
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const short = (s: string, a = 6, b = 4) => `${s.slice(0, a)}…${s.slice(-b)}`
const pct = (n: number | null | undefined, d = 1) => (n == null ? '—' : `${n.toFixed(d)}%`)
const int = (n: number) => n.toLocaleString('en-US')
const hm = (t: number) => {
  const d = new Date(t)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
const dayOf = (t: number) => {
  const d = new Date(t)
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`
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
  return d ? `${d} d ${h} h` : `${h} h ${m % 60} min`
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: 'no-store' })
    return (await r.json()) as T
  } catch {
    return null
  }
}

export function Garden() {
  const [ep, setEp] = useState<EpochResp | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let on = true
    const load = () => getJson<EpochResp>('/api/garden/epoch').then(r => on && r && setEp(r))
    load()
    const t = setInterval(load, 60_000)
    const c = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      on = false
      clearInterval(t)
      clearInterval(c)
    }
  }, [])

  const g = ep && ep.ok ? ep : null
  const best = g?.best ?? null

  return (
    <div className="gd">
      <GardenStyles />
      <header className="gd-head">
        <div className="gd-eyebrow mute">
          The Garden <span className="gd-sep">·</span> epoch {g ? g.epoch : '…'} <span className="gd-sep">·</span> hidden preview
        </div>
        <h1 className="gd-h1">
          <span className="nx lit gd-count">{g ? int(g.grown) : ep && !ep.ok ? '—' : '…'}</span>
          <span className="gd-h1-text">brains grown this epoch</span>
        </h1>
        <p className="gd-lead">
          Aigarth is <em>AI</em> and <em>garth</em>, an old word for a garden. Every solution a Qubic miner submits is a small neural network
          grown from a parent network, checked by the whole network and kept with the name of the identity that grew it. In Bitcoin a
          finished hash has no future. Here a finished brain has children. This page shows the garden as it grows.
        </p>
        <div className="gd-facts">
          <Fact label="born per minute, lately" value={g?.perMinute != null ? g.perMinute.toFixed(1) : '—'} />
          <Fact label="best brain's homework" value={best ? pct(homework(best.score)) : '—'} note={best ? `grown by ${short(best.gardener)}` : undefined} />
          <Fact label="sunrise: first live prices" value={left(SUNRISE - now)} note="18 Nov, 12:00 UTC" />
        </div>
      </header>

      <Vine top={best?.hash ?? null} bestScore={best?.score ?? null} />

      <div className="gd-two">
        <Births g={g} now={now} />
        <Gardeners g={g} />
      </div>

      <MyPlot epoch={g?.epoch ?? null} />

      <p className="gd-honest mute">
        The garden grows in the dark: until 18 November the brains see no live prices, and on the hours they never saw the best of them
        score like a coin. Nothing here is a promise of income. Numbers come from the Jetski ANN Explorer’s public records, re-read every minute.
        {ep && !ep.ok ? ` The explorer did not answer just now (${ep.reason}).` : ''}
      </p>
    </div>
  )
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="gd-fact">
      <div className="nx lit gd-fact-v">{value}</div>
      <div className="gd-fact-l">{label}</div>
      {note ? <div className="gd-fact-n mute">{note}</div> : null}
    </div>
  )
}

/* ---------------- the vine: a brain's lineage ---------------- */

function Vine({ top, bestScore }: { top: string | null; bestScore: number | null }) {
  const [lin, setLin] = useState<Lineage | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [hover, setHover] = useState<Gen | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(1040)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!top) return
    let on = true
    setLin(null)
    setErr(null)
    const walk = async () => {
      for (let i = 0; i < 40 && on; i++) {
        const r = await getJson<LinResp>(`/api/garden/lineage/${top}`)
        if (!on) return
        if (!r || !r.ok) {
          setErr(r && !r.ok ? r.reason : 'no answer')
          return
        }
        setLin(r)
        if (r.done) return
      }
    }
    walk()
    return () => {
      on = false
    }
  }, [top])

  const gens = useMemo(() => (lin ? [...lin.gens].sort((a, b) => a.depth - b.depth) : []), [lin])
  const tipDepth = gens.length ? gens[gens.length - 1]!.depth : null
  const sits = useMemo(() => sittings(gens, 45 * 60_000), [gens])

  const narrow = w < 600
  const H = narrow ? 280 : 360
  const padL = 56
  const padR = 28
  const padT = 28
  const padB = 44
  const maxDepth = Math.max(tipDepth ?? 1, 10)
  const ys = gens.map(g => homework(g.score))
  const yMin = Math.min(49, ...(ys.length ? ys : [50])) - 1
  const yMax = Math.max(60, ...(ys.length ? ys : [60])) + 2
  const X = (d: number) => padL + ((d - 1) / Math.max(1, maxDepth - 1)) * (w - padL - padR)
  const Y = (p: number) => padT + (1 - (p - yMin) / (yMax - yMin)) * (H - padT - padB)
  const path = gens.map((g, i) => `${i ? 'L' : 'M'}${X(g.depth).toFixed(1)},${Y(homework(g.score)).toFixed(1)}`).join(' ')
  const tip = gens[gens.length - 1]
  const root = gens[0]
  const ticks: number[] = []
  for (let p = Math.ceil(yMin / 5) * 5; p <= yMax; p += 5) ticks.push(p)
  const tracing = lin && !lin.done

  return (
    <section className="panel gd-vine" ref={box}>
      <div className="gd-vine-head">
        <div>
          <div className="label">The vine: where the epoch’s best brain came from</div>
          <div className="mute gd-small">
            {!top ? 'Waiting for the explorer.' : null}
            {top && !lin && !err ? 'Tracing its roots…' : null}
            {err ? `The explorer did not answer (${err}).` : null}
            {lin && tracing ? `Tracing its roots: ${gens.length} generations so far, ${gens[0]?.depth ?? '…'} to go.` : null}
            {lin && lin.done && tip && root
              ? `${tip.depth} generations. ${sits.length === 1 ? 'One sitting' : `${sits.length} sittings`} on ${dayOf(root.ts ?? 0)}, ${hm(root.ts ?? 0)} to ${hm(tip.ts ?? 0)} UTC, one gardener: ${short(tip.gardener, 8, 6)}.`
              : null}
          </div>
        </div>
        {tip ? (
          <div className="gd-vine-tip">
            <span className="nx lit gd-tip-v">{pct(homework(tip.score))}</span>
            <span className="mute gd-small"> homework at the tip, from {root ? pct(homework(root.score)) : '—'} at the root</span>
          </div>
        ) : null}
      </div>
      <svg className="gd-svg" width={w} height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Homework accuracy of each generation in the best brain's lineage">
        <defs>
          <linearGradient id="gd-stem" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8a6a3a" />
            <stop offset="1" stopColor="#FFE3B0" />
          </linearGradient>
          <filter id="gd-glow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {ticks.map(p => (
          <g key={p}>
            <line x1={padL} x2={w - padR} y1={Y(p)} y2={Y(p)} stroke={p === 50 ? 'rgba(255,200,140,.35)' : 'rgba(255,200,140,.08)'} strokeDasharray={p === 50 ? '4 6' : undefined} />
            <text x={padL - 10} y={Y(p) + 4} textAnchor="end" fill={p === 50 ? '#c9b89d' : '#7d7168'} fontSize="11">
              {p}%
            </text>
          </g>
        ))}
        <text x={w - padR} y={Y(50) - 6} textAnchor="end" fill="#c9b89d" fontSize="11">
          a coin
        </text>
        {(() => {
          let lastLabel = -Infinity
          return sits.map((s, i) => {
            const a = gens.find(g => g.ts === s.from)
            const b = [...gens].reverse().find(g => g.ts === s.to)
            if (!a || !b) return null
            const x1 = X(a.depth)
            const x2 = X(b.depth)
            const mid = (x1 + x2) / 2
            const label = mid - lastLabel > (narrow ? 72 : 110)
            if (label) lastLabel = mid
            return (
              <g key={i}>
                <rect x={x1 - 3} y={H - padB + 14} width={Math.max(2, x2 - x1 + 6)} height={3} rx={1.5} fill="rgba(232,145,46,.45)" />
                {label ? (
                  <text x={mid} y={H - padB + 32} textAnchor="middle" fill="#93857a" fontSize="11">
                    {hm(s.from)}{narrow ? '' : ' UTC'}{s.gens > 1 && !narrow ? `, ${s.gens} gens` : ''}
                  </text>
                ) : null}
              </g>
            )
          })
        })()}
        <text x={padL} y={H - 4} fill="#7d7168" fontSize="11">
          generation 1
        </text>
        <text x={w - padR} y={H - 4} textAnchor="end" fill="#7d7168" fontSize="11">
          generation {maxDepth}
        </text>
        {path ? <path d={path} fill="none" stroke="url(#gd-stem)" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" filter="url(#gd-glow)" /> : null}
        {gens.map(g => (
          <circle
            key={g.hash}
            cx={X(g.depth)}
            cy={Y(homework(g.score))}
            r={hover?.hash === g.hash ? 6 : 3}
            fill={hover?.hash === g.hash ? '#FFE3B0' : 'rgba(255,196,107,.85)'}
            onMouseEnter={() => setHover(g)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {tip ? <circle cx={X(tip.depth)} cy={Y(homework(tip.score))} r={7} fill="#FFE3B0" filter="url(#gd-glow)" /> : null}
        {hover ? (
          <g transform={`translate(${Math.min(X(hover.depth) + 12, w - 230)}, ${Math.max(padT, Y(homework(hover.score)) - 58)})`}>
            <rect width={218} height={50} rx={8} fill="rgba(11,10,14,.92)" stroke="rgba(255,200,140,.25)" />
            <text x={10} y={19} fill="#ecdfcb" fontSize="12" fontWeight={600}>
              generation {hover.depth}: {pct(homework(hover.score))} homework
            </text>
            <text x={10} y={38} fill="#93857a" fontSize="11">
              {hover.ts ? `${dayOf(hover.ts)}, ${hm(hover.ts)} UTC` : 'time unknown'} · {hover.score} of 8760 wrong
            </text>
          </g>
        ) : null}
      </svg>
      <p className="mute gd-small gd-vine-foot">
        Each dot is one brain that beat its parent; the explorer keeps the parent of every solution, so the chain can be walked back to the
        first one. Homework is the share of the 8,760 past hours the brain calls right. {bestScore != null ? '' : ''}
      </p>
    </section>
  )
}

/* ---------------- births and gardeners ---------------- */

function Births({ g, now }: { g: EpochGarden | null; now: number }) {
  return (
    <section className="panel gd-box">
      <div className="label">Just born</div>
      <div className="mute gd-small">The newest verified brains, as the network accepts them.</div>
      <table className="gd-table">
        <thead>
          <tr>
            <th>when</th>
            <th>gen</th>
            <th>homework</th>
            <th>gardener</th>
            <th className="bpp-hide-sm">brain</th>
          </tr>
        </thead>
        <tbody>
          {(g?.births ?? []).map(b => (
            <tr key={b.hash}>
              <td className="mute">{ago(b.ts, now)}</td>
              <td className="nx gd-num">{b.depth ?? '—'}</td>
              <td className="glow-g">{pct(homework(b.score))}</td>
              <td title={b.gardener}>{short(b.gardener)}</td>
              <td className="mute bpp-hide-sm" title={b.hash}>
                {short(b.hash)}
              </td>
            </tr>
          ))}
          {!g ? (
            <tr>
              <td colSpan={5} className="mute">
                …
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  )
}

function Gardeners({ g }: { g: EpochGarden | null }) {
  return (
    <section className="panel gd-box">
      <div className="label">Gardeners of the epoch</div>
      <div className="mute gd-small">
        The identities behind this epoch’s hundred best brains, by how many brains each has grown so far. A brain keeps its gardener’s name for as
        long as the network keeps the epoch.
      </div>
      <table className="gd-table">
        <thead>
          <tr>
            <th>#</th>
            <th>identity</th>
            <th>grown</th>
            <th>best</th>
            <th className="bpp-hide-sm">last brain</th>
          </tr>
        </thead>
        <tbody>
          {(g?.gardeners ?? []).slice(0, 12).map((r, i) => (
            <tr key={r.id}>
              <td className="mute">{i + 1}</td>
              <td title={r.id}>{short(r.id, 8, 6)}</td>
              <td className="nx gd-num">{r.grown ? int(r.grown) : '—'}</td>
              <td className="glow-g">{pct(r.best != null ? homework(r.best) : null)}</td>
              <td className="mute bpp-hide-sm">{r.lastAt ? `${dayOf(r.lastAt)}, ${hm(r.lastAt)}` : '—'}</td>
            </tr>
          ))}
          {!g ? (
            <tr>
              <td colSpan={5} className="mute">
                …
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {g ? (
        <p className="mute gd-small">
          Ranked among {g.rankedFrom} identities. The explorer publishes no full per-epoch ranking; the best hundred brains are the door in.
        </p>
      ) : null}
    </section>
  )
}

/* ---------------- my plot ---------------- */

const COACH = {
  empty: 'Your plot is empty. The first brain is the hardest one: it means your rig is set up, verified and counted.',
  growing: (n: number) => `${int(n)} brains this epoch. Each one is a generation somebody else can build on.`,
  best: (rank: number) => `One of your brains is number ${rank} of the hundred best this epoch. The network remembers it by its hash, with your name on it.`,
}

function MyPlot({ epoch }: { epoch: number | null }) {
  const [id, setId] = useState('')
  const [p, setP] = useState<PlotResp | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    try {
      const k = localStorage.getItem('garden:id')
      if (k && isIdentity(k)) setId(k)
    } catch {}
  }, [])

  const look = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const v = id.trim().toUpperCase()
    if (!isIdentity(v)) {
      setP({ ok: false, reason: 'A Qubic identity is 60 capital letters. Never your seed.' })
      return
    }
    setBusy(true)
    const r = await getJson<PlotResp>(`/api/garden/plot/${v}`)
    setP(r ?? { ok: false, reason: 'no answer' })
    setBusy(false)
    try {
      localStorage.setItem('garden:id', v)
    } catch {}
  }

  const plot = p && p.ok ? p : null
  const cur = plot?.epochs.find(x => x.epoch === plot.epoch)
  const maxGrown = plot ? Math.max(1, ...plot.epochs.map(x => x.grown)) : 1

  return (
    <section className="panel gd-box gd-plot">
      <div className="label">My plot</div>
      <div className="mute gd-small">Your Qubic identity, the public one of 60 letters. Never type a seed anywhere on this site.</div>
      <form onSubmit={look} className="gd-form">
        <input value={id} onChange={e => setId(e.target.value)} placeholder="ABCD…  (60 capital letters)" spellCheck={false} autoComplete="off" aria-label="Qubic identity" />
        <button type="submit" className="btn btn-main" disabled={busy}>
          {busy ? 'Looking…' : 'Show my plot'}
        </button>
      </form>
      {p && !p.ok ? <p className="glow-r gd-small">{p.reason}</p> : null}
      {plot ? (
        <div className="gd-plot-body">
          <div className="gd-plot-top">
            <div>
              <div className="nx lit gd-plot-n">{int(plot.grown)}</div>
              <div className="gd-fact-l">brains grown, all time</div>
            </div>
            <div>
              <div className="nx lit gd-plot-n">{cur ? int(cur.grown) : '0'}</div>
              <div className="gd-fact-l">this epoch</div>
            </div>
            <div>
              <div className="nx lit gd-plot-n">{plot.best ? pct(homework(plot.best.score)) : '—'}</div>
              <div className="gd-fact-l">{plot.best ? `best brain, #${plot.best.rank} of the hundred` : 'none in the hundred best yet'}</div>
            </div>
          </div>
          <div className="gd-bars" aria-label="Brains grown per epoch">
            {plot.epochs.map(x => (
              <div key={x.epoch} className="gd-bar" title={`epoch ${x.epoch}: ${int(x.grown)} brains`}>
                <i style={{ height: `${Math.max(3, (x.grown / maxGrown) * 100)}%` }} />
                <span>{x.epoch}</span>
              </div>
            ))}
          </div>
          <div className="gd-coach">
            <div className="gd-coach-who">
              Maria, coach of the pool <span className="mute">· draft lines, not yet approved</span>
            </div>
            <p>{plot.best ? COACH.best(plot.best.rank) : cur && cur.grown > 0 ? COACH.growing(cur.grown) : COACH.empty}</p>
          </div>
          <p className="mute gd-small">
            Mining in the Aigarth Pool? Your brains are counted under the pool’s identity until the backend tags each worker; your own share is in
            your pool record. Epoch {epoch ?? '…'} is the one running now.
          </p>
        </div>
      ) : null}
    </section>
  )
}

function GardenStyles() {
  return (
    <style>{`
.gd { display: grid; gap: 22px; }
.gd .gd-head { display: grid; gap: 14px; max-width: 920px; }
.gd .gd-eyebrow { font-size: 13px; }
.gd .gd-sep { opacity: .5; margin: 0 6px; }
.gd .gd-h1 { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 18px; font-weight: 400; }
.gd .gd-count { font-size: clamp(56px, 9vw, 112px); line-height: .95; letter-spacing: .01em; }
.gd .gd-h1-text { font-size: clamp(18px, 2.2vw, 26px); color: var(--ink); font-family: var(--bpp-sans), system-ui, sans-serif; }
.gd .gd-lead { margin: 0; font-size: 16px; line-height: 1.6; color: var(--ink); max-width: 72ch; }
.gd .gd-lead em { font-style: normal; color: var(--fil); }
.gd .gd-facts { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; margin-top: 6px; }
.gd .gd-fact { border-left: 1px solid var(--line); padding-left: 14px; }
.gd .gd-fact-v { font-size: clamp(28px, 3.4vw, 42px); line-height: 1; }
.gd .gd-fact-l { font-size: 13px; margin-top: 6px; }
.gd .gd-fact-n { font-size: 12px; margin-top: 2px; }
.gd .gd-small { font-size: 13px; line-height: 1.5; }
.gd .gd-vine { padding: 18px 18px 10px; overflow: hidden; }
.gd .gd-vine-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 8px; }
.gd .gd-tip-v { font-size: 40px; line-height: 1; }
.gd .gd-svg { display: block; max-width: 100%; }
.gd .gd-svg circle { cursor: crosshair; }
.gd .gd-vine-foot { margin: 6px 0 0; }
.gd .gd-two { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
.gd .gd-box { padding: 18px; display: grid; gap: 10px; align-content: start; }
.gd .gd-table td, .gd .gd-table th { padding-left: 6px; padding-right: 6px; }
.gd .gd-num { font-size: 16px; }
.gd .gd-form { display: flex; gap: 10px; flex-wrap: wrap; }
.gd .gd-form input { flex: 1 1 280px; font-family: var(--bpp-sans), monospace; letter-spacing: .04em; text-transform: uppercase; }
.gd .gd-plot-body { display: grid; gap: 16px; }
.gd .gd-plot-top { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
.gd .gd-plot-n { font-size: clamp(30px, 4vw, 48px); line-height: 1; }
.gd .gd-bars { display: flex; gap: 6px; align-items: flex-end; height: 110px; padding-top: 8px; border-bottom: 1px solid var(--line); overflow-x: auto; }
.gd .gd-bar { display: grid; grid-template-rows: 1fr auto; height: 100%; min-width: 34px; flex: 1 0 34px; align-items: end; justify-items: center; gap: 4px; }
.gd .gd-bar i { display: block; width: 100%; max-width: 40px; border-radius: 6px 6px 2px 2px; background: linear-gradient(180deg, rgba(255,227,176,.95), rgba(232,145,46,.55)); box-shadow: 0 0 10px rgba(232,145,46,.35); }
.gd .gd-bar span { font-size: 11px; color: var(--dim); }
.gd .gd-coach { border: 1px solid rgba(124,72,255,.35); background: rgba(124,72,255,.07); border-radius: 14px; padding: 12px 14px; }
.gd .gd-coach-who { font-size: 12px; color: #b9a6ff; margin-bottom: 4px; }
.gd .gd-coach p { margin: 0; font-size: 15px; line-height: 1.5; }
.gd .gd-honest { font-size: 13px; line-height: 1.55; max-width: 90ch; }
@media (max-width: 760px) {
  .gd .gd-two, .gd .gd-facts, .gd .gd-plot-top { grid-template-columns: 1fr; }
  .gd .gd-fact { border-left: 0; padding-left: 0; border-top: 1px solid var(--line); padding-top: 10px; }
}
`}</style>
  )
}
