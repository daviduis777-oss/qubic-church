'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BrainRow, LiveHour } from '@/lib/bpp/brains-view'
import type { CheckedGenome, LiveResult, TopList } from '@/lib/bpp/brains'
import { initial, step, wiring } from '@/lib/bpp/sim'
import { luckChance } from '@/lib/bpp/stats'

/**
 * Brain Watch: the best brain the network grew this epoch, re-run here with the core's own rule, watched
 * ticking through the hours it never saw, and graded on them. Any brain of the top list can be put under
 * the glass; any brain can be downloaded and run by anyone.
 */
type Top = TopList & { ok: boolean; epochs: number[] }

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const day = (unix: number) => {
  const d = new Date(unix * 1000)
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`
}
const dayYear = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
const hh = (unix: number) => `${day(unix)}, ${String(new Date(unix * 1000).getUTCHours()).padStart(2, '0')}:00`
const pct = (n: number | null, d = 1) => (n == null ? '—' : `${n.toFixed(d)}%`)
const short = (s: string, a = 8, b = 4) => `${s.slice(0, a)}…${s.slice(-b)}`
const accuracy = (r: Pick<BrainRow, 'score'>, frame = 8760) => (1 - r.score / frame) * 100

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: 'no-store' })
    return r.ok ? ((await r.json()) as T) : null
  } catch {
    return null
  }
}

export function BrainWatch({ preview }: { preview: boolean }) {
  const [top, setTop] = useState<Top | null>(null)
  const [epoch, setEpoch] = useState<number | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const [g, setG] = useState<CheckedGenome | null>(null)
  const [live, setLive] = useState<LiveResult | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getJson<Top>(`/api/bpp/brains${epoch ? `?epoch=${epoch}` : ''}`).then(t => {
      setTop(t)
      if (t?.rows?.[0] && !hash) setHash(t.rows[0].hash)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epoch])

  useEffect(() => {
    if (!hash) return
    let on = true
    setBusy(true)
    setG(null)
    setLive(null)
    Promise.all([getJson<CheckedGenome>(`/api/bpp/brains/${hash}`), getJson<LiveResult & { ok: boolean }>(`/api/bpp/brains/${hash}/live`)]).then(([gg, ll]) => {
      if (!on) return
      setG(gg)
      setLive(ll?.ok ? ll : null)
      setBusy(false)
    })
    return () => {
      on = false
    }
  }, [hash])

  const rank = top?.rows.findIndex(r => r.hash === hash) ?? -1

  return (
    <div style={{ display: 'grid', gap: 'clamp(28px, 4vw, 44px)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="eng" style={{ fontSize: 'clamp(18px, 2.4vw, 22px)', fontWeight: 400, margin: 0, color: '#f3e4ce', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span aria-hidden className="pilot" />
          Brain Watch
        </h1>
        <nav style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {preview && (
            <span className="mute" style={{ fontSize: 12.5, border: '1px solid var(--line)', borderRadius: 999, padding: '4px 10px' }}>
              private preview
            </span>
          )}
          <a className="mute" href="/bpp9000" style={{ fontSize: 14, textDecoration: 'none' }}>
            ← BPP-9000
          </a>
        </nav>
      </header>

      <div style={{ maxWidth: '70ch' }}>
        <p style={{ margin: 0, fontSize: 'clamp(20px, 2.6vw, 26px)', lineHeight: 1.35, color: '#f3e4ce' }}>
          {rank === 0 ? 'The best brain the network grew this epoch' : rank > 0 ? `Brain number ${rank + 1} of this epoch` : 'The brains the network grows'}
          <span className="mute">, re-run here with the core&apos;s own rule and graded on the hours it never saw.</span>
        </p>
        <p className="mute" style={{ margin: '12px 0 0', fontSize: 14.5, lineHeight: 1.6 }}>
          Every week thousands of machines mutate small networks that call the next hour of bitcoin. The network keeps the ones that fit a year of past hours best. We take the best of them, run it ourselves and let it keep calling, hour after hour, into the months the year never held. The year it was trained on is its homework. What follows is the exam.
        </p>
      </div>

      <section className="panel" style={{ padding: 'clamp(18px, 3vw, 28px)', display: 'grid', gap: 'clamp(20px, 3vw, 32px)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', alignItems: 'start' }}>
        <Ring g={g} live={live} />
        <Sheet g={g} live={live} busy={busy} row={top?.rows.find(r => r.hash === hash) ?? null} rank={rank} />
      </section>

      <TopTable top={top} hash={hash} onPick={setHash} epoch={epoch} onEpoch={e => {
          setEpoch(e)
          setHash(null)
        }} />

      <footer className="mute" style={{ fontSize: 12.5, lineHeight: 1.7, maxWidth: '80ch' }}>
        Genomes and verified scores come from the public Jetski ANN Explorer, which replays the exact core release for every solution. We re-run each brain with the scorer&apos;s rule from qubic/core and show it only when our error count equals the verified score. &ldquo;Hours it never saw&rdquo; are the hours after the task sequence ends; &ldquo;since it was found&rdquo; are the hours after the solution was published, which nobody could have fitted. The core has not published its live-call rule yet; what the network itself will call live from 18 November is a separate matter, kept in <a className="mute" href="/bpp9000#record" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>the record</a>. An experiment, not financial advice.
      </footer>
    </div>
  )
}

/* ---------------- the ring: 32 neurons ticking through the unseen hours ---------------- */

function Ring({ g, live }: { g: CheckedGenome | null; live: LiveResult | null }) {
  const [state, setState] = useState<Uint8Array | null>(null)
  const [idx, setIdx] = useState(0)
  const [call, setCall] = useState<0 | 1 | 2 | null>(null)
  const w = useMemo(() => (g ? wiring(g) : null), [g])
  const hourByIdx = useMemo(() => {
    const m = new Map<number, LiveHour>()
    if (g && live) for (const h of live.hours) m.set((h.hour - g.task.start) / 3600, h)
    return m
  }, [g, live])
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (!g || !w) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // the homework runs in one go; then one exam hour per beat: tick until the clock lets the call neuron speak
    let s: Uint8Array = initial(g)
    let i = 0
    let c: 0 | 1 | 2 | null = null
    const start = g.task.hours
    const last = live?.hours.at(-1) ? (live.hours.at(-1)!.hour - g.task.start) / 3600 : start + 168
    const nextHour = () => {
      for (let guard = 0; guard < 2000; guard++) {
        s = step(g, w, s)
        if (s[g.ctrl] !== 2) {
          i++
          c = s[g.out] as 0 | 1 | 2
          return true
        }
      }
      return false
    }
    const jump = () => {
      s = initial(g)
      i = 0
      c = null
      while (i < start && nextHour()) {}
    }
    const show = () => {
      setState(s)
      setIdx(i)
      setCall(c)
    }
    jump()
    show()
    clearInterval(timer.current)
    timer.current = setInterval(
      () => {
        if (!nextHour() || i > last) jump()
        show()
      },
      reduce ? 3000 : 1400,
    )
    return () => clearInterval(timer.current)
  }, [g, w, live])

  const N = 32
  const R = 150
  const cx = 190
  const cy = 190
  const pos = (n: number) => {
    const a = (n / N) * Math.PI * 2 - Math.PI / 2
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }
  }
  const here = g ? hourByIdx.get(idx - 1) : undefined
  const hourNow = g ? g.task.start + (idx - 1) * 3600 : null
  return (
    <figure style={{ margin: 0, display: 'grid', gap: 10, justifyItems: 'center' }}>
      <svg aria-label="The brain: 32 neurons, their wiring and their states, ticking hour by hour" role="img" style={{ width: '100%', maxWidth: 420, height: 'auto' }} viewBox="0 0 380 380">
        <defs>
          <radialGradient id="bw-blue"><stop offset=".35" stopColor="rgba(110,80,255,.5)" /><stop offset="1" stopColor="rgba(110,80,255,0)" /></radialGradient>
        </defs>
        <circle cx={cx} cy={cy} fill="none" r={R + 22} stroke="rgba(255,200,140,.08)" />
        {g &&
          g.links.map(([t, slot, src], k) => {
            const a = pos(src)
            const b = pos(t)
            const lit = state && state[src] === 1
            return <path d={`M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`} fill="none" key={k} stroke={lit ? 'rgba(255,196,107,.28)' : 'rgba(255,200,140,.07)'} strokeWidth={slot === 0 ? 1 : 0.7} style={{ transition: 'stroke .9s ease' }} />
          })}
        {Array.from({ length: N }, (_, n) => {
          const p = pos(n)
          const t = state ? state[n] : 2
          const isOut = g?.out === n
          const isCtrl = g?.ctrl === n
          const r = isOut ? 11 : isCtrl ? 8 : 6
          return (
            <g key={n}>
              <circle cx={p.x} cy={p.y} fill="url(#bw-blue)" r={r + 16} style={{ opacity: t === 1 ? 1 : 0, transition: 'opacity .9s ease' }} />
              <circle cx={p.x} cy={p.y} fill="rgba(232,145,46,.28)" r={r + 7} style={{ opacity: t === 1 ? 1 : 0, transition: 'opacity .9s ease' }} />
              <circle
                cx={p.x}
                cy={p.y}
                fill={t === 1 ? 'var(--hot)' : t === 0 ? '#2a2630' : 'transparent'}
                r={r}
                stroke={t === 1 ? 'var(--fil)' : t === 0 ? 'rgba(255,200,140,.35)' : 'rgba(255,200,140,.18)'}
                strokeDasharray={t === 2 ? '2 2' : undefined}
                strokeWidth={isOut || isCtrl ? 1.6 : 1}
                style={{ transition: 'fill .9s ease, stroke .9s ease' }}
              />
              {(isOut || isCtrl) && (
                <text fill="var(--dim)" fontSize="9" textAnchor="middle" x={p.x} y={p.y + r + 12}>
                  {isOut ? 'call' : 'clock'}
                </text>
              )}
            </g>
          )
        })}
        <circle cx={cx} cy={cy} fill="rgba(11,10,14,.82)" r={86} />
        <text className="nx" key={idx} fill={call == null ? 'var(--dim)' : call === 1 ? 'var(--hot)' : call === 0 ? 'var(--r)' : 'var(--dim)'} fontSize={call === 2 ? 28 : 42} fontWeight="300" textAnchor="middle" x={cx} y={cy + 8} style={{ fontFamily: 'var(--bpp-nx)', animation: 'bw-in .6s ease both' }}>
          {!g ? '' : call === 1 ? '▲ UP' : call === 0 ? '▼ DOWN' : call === 2 ? 'NOT SURE' : ''}
        </text>
        <text fill="var(--dim)" fontSize="11" textAnchor="middle" x={cx} y={cy + 32}>
          {hourNow && idx > 0 ? `${hh(hourNow)} UTC` : g ? 'running the training year…' : 'loading the brain…'}
        </text>
        {here && here.hit != null && (
          <text fill={here.hit ? 'var(--fil)' : 'var(--r)'} fontSize="11" key={`h${idx}`} style={{ animation: 'bw-in .6s ease .25s both' }} textAnchor="middle" x={cx} y={cy + 50}>
            bitcoin went {here.went ? 'up' : 'down'}: {here.hit ? 'right' : 'wrong'}
          </text>
        )}
      </svg>
      <figcaption className="mute" style={{ fontSize: 12.5, textAlign: 'center', maxWidth: '44ch', lineHeight: 1.5 }}>
        Lit: 1. Dark: 0. Dotted: not sure. Every tick each neuron reads its three sources and answers from its 27-entry table. The clock neuron decides when the call neuron speaks.
      </figcaption>
    </figure>
  )
}

/* ---------------- the sheet: who, when, how good, download ---------------- */

function Sheet({ g, live, busy, row, rank }: { g: CheckedGenome | null; live: LiveResult | null; busy: boolean; row: BrainRow | null; rank: number }) {
  const r = g ?? row
  const frame = g?.task.frame ?? 8760
  const since = live?.sinceFound
  const all = live?.all
  const lamps = live ? live.hours.filter(h => h.hit != null).slice(-48) : []
  const luck = all && all.checked >= 10 ? luckChance(all.hits, all.checked) : null
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div>
        <div className="label" style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          {r ? `Brain ${short(r.hash, 10, 6)}` : 'Brain'}
          {rank >= 0 && (
            <span className="mute" style={{ fontWeight: 500 }}>
              number {rank + 1} of epoch {r?.epoch}
            </span>
          )}
        </div>
        <div className="mute" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
          {r ? (
            <>
              Found by <code style={{ color: 'var(--ink)' }}>{short(r.computor, 6, 6)}</code> on {dayYear(r.foundAt)}
              {g?.depth != null && <>, {g.depth} generations of strict improvement behind it</>}.
            </>
          ) : (
            'Loading…'
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
        <Big big={r ? pct(accuracy(r, frame)) : '—'} label="Homework" small={r ? `of the training year, ${r.score.toLocaleString('en-US')} wrong hours of ${frame.toLocaleString('en-US')}${r.shift ? `, frame ${r.shift} hours in` : ''}` : ''} lit />
        <Big
          big={all ? pct(all.rate) : busy ? '…' : '—'}
          label="Exam"
          small={all ? `on ${all.checked.toLocaleString('en-US')} hours it never saw, since ${live ? day(live.dataEnd) : ''}${all.unsure ? `, ${all.unsure} not sure` : ''}` : 'hours after the task ends'}
        />
        <Big
          big={since && since.checked ? pct(since.rate) : busy ? '…' : '—'}
          label="Since it was found"
          small={since && since.checked ? `${since.checked} hours nobody could have fitted` : 'needs closed hours after the find'}
        />
      </div>

      {all && all.checked >= 10 && (
        <p className="mute" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>
          A coin lands on 50%. The chance a coin does at least this well over {all.checked.toLocaleString('en-US')} hours: <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{luck == null ? '—' : luck < 0.001 ? 'under 0.1%' : pct(luck * 100)}</b>.
        </p>
      )}

      {lamps.length > 0 && (
        <div>
          <div className="label" style={{ marginBottom: 8 }}>
            Its last {lamps.length} graded hours
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            {[0, 24].map(off => (
              <div className="lamps" key={off}>
                {Array.from({ length: 24 }, (_, i) => {
                  const h = lamps[off + i - (48 - lamps.length)] ?? null
                  return (
                    <i className={!h ? 'off' : h.hit ? 'hit' : 'miss'} key={i} title={h ? `${hh(h.hour)} UTC: called ${h.call === 1 ? 'UP' : 'DOWN'}, went ${h.went ? 'UP' : 'DOWN'}` : undefined}>
                      {h ? (h.call === 1 ? '▲' : '▼') : ''}
                    </i>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="mute" style={{ fontSize: 12.5, marginTop: 6 }}>lit: right · dark: wrong · newest at the right</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <a className="btn btn-main" href={r ? `/api/bpp/brains/${r.hash}?download=1` : '#'} aria-disabled={!r} download>
          Download the brain
        </a>
        {g && (
          <a className="btn" href={g.source.explorer} rel="noopener noreferrer" target="_blank">
            Source record
          </a>
        )}
        {g && (
          <span className="mute" style={{ fontSize: 12.5 }}>
            {g.check.matches ? `our run: ${g.check.errors?.toLocaleString('en-US')} errors, equals the verified score` : g.check.errors == null ? 'our run could not be checked against the task' : `our run: ${g.check.errors} errors, the verified score says ${g.score}`}
          </span>
        )}
      </div>
      <p className="mute" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6 }}>
        A small JSON file: 32 neurons, each with its three sources, its 27-entry table and its start state, plus the rule to run it. Anyone can replay the homework and the exam.
      </p>
    </div>
  )
}

function Big({ big, small, lit, label }: { big: string; small: string; lit?: boolean; label: string }) {
  return (
    <div>
      <span className="label" style={{ display: 'block', marginBottom: 6 }}>
        {label}
      </span>
      <b className={`nx${lit ? ' lit' : ''}`} style={{ display: 'block', fontWeight: lit ? 300 : 400, fontSize: lit ? 'clamp(44px, 6vw, 60px)' : 'clamp(30px, 4vw, 42px)', lineHeight: 1, color: lit ? undefined : 'var(--fil)' }}>
        {big}
      </b>
      <span className="mute" style={{ fontSize: 12.5, lineHeight: 1.45, display: 'block', marginTop: 6 }}>
        {small}
      </span>
    </div>
  )
}

/* ---------------- the shelf: this epoch's best, and the epochs we keep ---------------- */

function TopTable({ top, hash, onPick, epoch, onEpoch }: { top: Top | null; hash: string | null; onPick: (h: string) => void; epoch: number | null; onEpoch: (e: number | null) => void }) {
  const epochs = top?.epochs ?? []
  const shown = top?.epoch ?? null
  return (
    <section aria-labelledby="shelf-h" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h2 className="eng" id="shelf-h" style={{ fontSize: 'clamp(16px, 2vw, 19px)', fontWeight: 400, margin: 0, color: '#f3e4ce' }}>
          {shown ? `Epoch ${shown}: the best brains` : 'The best brains'}
        </h2>
        <span className="mute" style={{ fontSize: 13 }}>
          {top ? `${top.solutions.toLocaleString('en-US')} networks grown this epoch${top.live ? '' : ', from our shelf'}. Click a row to put it under the glass.` : 'Loading…'}
        </span>
      </div>
      {epochs.length > 0 && (
        <div role="group" aria-label="Epochs on the shelf" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button aria-pressed={epoch == null} className={`btn${epoch == null ? ' btn-main' : ''}`} onClick={() => onEpoch(null)} style={{ minHeight: 34, padding: '4px 12px', fontSize: 13 }} type="button">
            now
          </button>
          {epochs.map(e => (
            <button aria-pressed={epoch === e} className={`btn${epoch === e ? ' btn-main' : ''}`} key={e} onClick={() => onEpoch(e)} style={{ minHeight: 34, padding: '4px 12px', fontSize: 13 }} type="button">
              {e}
            </button>
          ))}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Brain</th>
              <th scope="col">Found by</th>
              <th scope="col">Homework</th>
              <th scope="col">Wrong hours</th>
              <th scope="col">Frame</th>
              <th scope="col">Found</th>
            </tr>
          </thead>
          <tbody>
            {(top?.rows ?? []).map((r, i) => {
              const on = r.hash === hash
              return (
                <tr key={r.hash} onClick={() => onPick(r.hash)} style={{ cursor: 'pointer', background: on ? 'rgba(255,196,107,.07)' : undefined }}>
                  <td>{i + 1}</td>
                  <td>
                    <button className="mute" onClick={() => onPick(r.hash)} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: on ? 'var(--hot)' : 'var(--ink)', cursor: 'pointer', textDecoration: on ? 'none' : 'underline', textUnderlineOffset: 3 }} type="button">
                      {short(r.hash, 10, 4)}
                    </button>
                  </td>
                  <td>
                    <code>{short(r.computor, 6, 4)}</code>
                  </td>
                  <td style={{ color: 'var(--fil)' }}>{pct(accuracy(r))}</td>
                  <td>{r.score.toLocaleString('en-US')}</td>
                  <td>{r.shift ? `+${r.shift}h` : '0'}</td>
                  <td className="mute">{r.foundAt ? hh(Math.floor(Date.parse(r.foundAt) / 1000)) : '—'}</td>
                </tr>
              )
            })}
            {top && top.rows.length === 0 && (
              <tr>
                <td className="mute" colSpan={7}>
                  Nothing on this shelf yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mute" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6 }}>
        Ranked as the core ranks them: frame progress first, then fewer wrong hours. Homework is the share of the training year the brain fits; it says nothing about the exam. Each epoch&apos;s list is kept here when it closes: a museum of brains, one shelf per week.
      </p>
    </section>
  )
}
