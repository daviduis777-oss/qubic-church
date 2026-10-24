'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AUTHORS, RANKS, nextRank, rankFor, rankProgress } from '@/lib/ranks'

export type NeuronNode = {
  id: string
  title: string
  kicker?: string | null
  /** YYYY-MM-DD, YYYY-MM or YYYY */
  date: string
  dateLabel: string
  author: string
  handle: string
  href: string
  external: boolean
  summary: string
  tags: string[]
  /** Issue number for site articles, null for archive links */
  issue: number | null
  minutes?: number
  isNew?: boolean
  platform?: string
  /** what this piece adds to its author */
  weight: number
  weightLabel: string
}

type Edge = { a: number; b: number; kind: 'hub' | 'syn' }
type P = { x: number; y: number }

const W = 1000
const H = 720
const AUTHOR_COLORS: Record<string, string> = { TesserAI: '#ffd24a', 'Come-from-Beyond': '#7dd3fc' }
const GUEST_HUES = ['#c4b5fd', '#86efac', '#fda4af', '#f9a8d4', '#fdba74', '#67e8f9', '#a3e635']

/** Small deterministic PRNG so the map is the same on every visit. */
function mulberry(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
const at = <T,>(arr: T[], i: number, fb: T): T => arr[i] ?? fb
const ORIGIN: P = { x: W / 2, y: H / 2 }
const hash = (s: string) => Array.from(s).reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)

function layout(nodes: NeuronNode[]) {
  const weightOf = (a: string) => nodes.filter(n => n.author === a).reduce((t, n) => t + n.weight, 0)
  const authors = Array.from(new Set(nodes.map(n => n.author))).sort((a, b) => weightOf(b) - weightOf(a))
  const hubs: P[] = authors.map((_, i) => {
    if (authors.length === 1) return { x: W / 2, y: H / 2 }
    const t = (i / authors.length) * Math.PI * 2 - Math.PI / 2
    return { x: W / 2 + Math.cos(t) * W * 0.22, y: H / 2 + Math.sin(t) * H * 0.24 }
  })
  const rnd = mulberry(1337)
  const pos: P[] = nodes.map((n, i) => {
    const ai = authors.indexOf(n.author)
    const count = nodes.filter(m => m.author === n.author).length
    const k = nodes.slice(0, i).filter(m => m.author === n.author).length
    const ang = k * 2.39996 + hash(n.id) % 7 * 0.1
    const spread = Math.min(170, 60 + Math.sqrt(count) * 32)
    const r = 55 + Math.sqrt((k + 0.5) / count) * spread + rnd() * 18
    const hb = at(hubs, ai, ORIGIN)
    return { x: hb.x + Math.cos(ang) * r * 0.85, y: hb.y + Math.sin(ang) * r * 0.85 }
  })
  // a few rounds of repulsion so dots never sit on top of each other
  for (let it = 0; it < 80; it++) {
    for (let i = 0; i < pos.length; i++) {
      const pi = at(pos, i, ORIGIN)
      for (let j = i + 1; j < pos.length; j++) {
        const pj = at(pos, j, ORIGIN)
        const dx = pj.x - pi.x
        const dy = pj.y - pi.y
        const d = Math.hypot(dx, dy) || 0.01
        const min = 34
        if (d < min) {
          const push = ((min - d) / d) * 0.5
          pi.x -= dx * push
          pi.y -= dy * push
          pj.x += dx * push
          pj.y += dy * push
        }
      }
      const hb = at(hubs, authors.indexOf(at(nodes, i, nodes[0]!).author), ORIGIN)
      pi.x += (hb.x - pi.x) * 0.004
      pi.y += (hb.y - pi.y) * 0.004
      pi.x = Math.max(28, Math.min(W - 28, pi.x))
      pi.y = Math.max(28, Math.min(H - 28, pi.y))
    }
  }
  const edges: Edge[] = []
  nodes.forEach((n, i) => edges.push({ a: i, b: -1 - authors.indexOf(n.author), kind: 'hub' }))
  // synapses: nearest two neighbours with a shared tag, plus a few bridges between authors
  nodes.forEach((n, i) => {
    const cands = nodes
      .map((m, j) => ({ j, m, d: Math.hypot(at(pos, i, ORIGIN).x - at(pos, j, ORIGIN).x, at(pos, i, ORIGIN).y - at(pos, j, ORIGIN).y) }))
      .filter(({ j, m }) => j !== i && m.tags.some(t => n.tags.includes(t)))
      .sort((x, y) => x.d - y.d)
    const same = cands.filter(c => c.m.author === n.author).slice(0, 2)
    const other = cands.filter(c => c.m.author !== n.author && (i + c.j) % 5 === 0).slice(0, 1)
    for (const c of [...same, ...other]) {
      if (c.j > i && !edges.some(e => (e.a === i && e.b === c.j) || (e.a === c.j && e.b === i))) edges.push({ a: i, b: c.j, kind: 'syn' })
    }
  })
  return { authors, hubs, pos, edges }
}

export function ArticlesNeurons({ nodes }: { nodes: NeuronNode[] }) {
  const { authors, hubs, pos, edges } = useMemo(() => layout(nodes), [nodes])
  const [sel, setSel] = useState<number>(0)
  const [hover, setHover] = useState<number | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const active = hover ?? sel
  const node = nodes[sel]
  const color = (a: string) => AUTHOR_COLORS[a] ?? GUEST_HUES[Math.abs(hash(a)) % GUEST_HUES.length] ?? '#c4b5fd'

  useEffect(() => {
    const h = decodeURIComponent(window.location.hash.replace('#', ''))
    const i = nodes.findIndex(n => n.id === h)
    if (i >= 0) setSel(i)
  }, [nodes])

  const choose = (i: number) => {
    setSel(i)
    if (window.innerWidth < 1024) mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const groups = authors.map(a => {
    const items = nodes.map((n, i) => ({ n, i })).filter(({ n }) => n.author === a)
    const xp = items.reduce((t, { n }) => t + n.weight, 0)
    const prof = AUTHORS[a]
    return { author: a, handle: nodes.find(n => n.author === a)?.handle ?? '', items, xp, rank: rankFor(xp, prof?.fixedLevel), next: nextRank(xp, prof?.fixedLevel), progress: rankProgress(xp, prof?.fixedLevel), title: prof?.title }
  })
  const levelOf = (a: string) => groups.find(g => g.author === a)?.rank.level ?? 1
  const hubR = (a: string) => 6 + levelOf(a) * 1.5
  const dotR = (w: number) => 3.5 + 3 * Math.sqrt(w)

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-10">
      {/* ── LEFT: index ── */}
      <nav aria-label="All articles" className="order-2 lg:order-1 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
        {groups.map(g => (
          <section className="mb-8" key={g.author}>
            <h2 className="flex items-baseline gap-2 font-mono text-xs uppercase tracking-[0.25em]">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: color(g.author) }} />
              <span className="text-foreground">{g.author}</span>
              <a className="text-fg-2 hover:text-gold" href={`https://x.com/${g.handle}`} rel="noopener noreferrer" target="_blank">
                @{g.handle}
              </a>
              <span className="ml-auto text-fg-2">{g.items.length}</span>
            </h2>
            <div className="mt-2 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.2em]">
              <span style={{ color: color(g.author) }}>
                LVL {g.rank.level} · {g.rank.name}
              </span>
              <span className="text-fg-2">{g.next ? `${g.xp} / ${g.next.rank.min}` : `${g.xp} · ∞`}</span>
            </div>
            <div aria-hidden className="mt-1 h-px w-full bg-border">
              <div className="h-px" style={{ width: `${Math.round(g.progress * 100)}%`, background: color(g.author) }} />
            </div>
            {g.title && <p className="mt-2 text-[11px] leading-snug text-fg-2">{g.title}</p>}
            <ol className="mt-2">
              {g.items.map(({ n, i }) => (
                <li key={n.id}>
                  <a
                    aria-current={i === sel ? 'true' : undefined}
                    className={`group grid grid-cols-[52px_1fr] gap-2 border-l-2 py-2 pl-3 text-sm leading-snug transition-colors ${i === sel ? 'border-gold bg-gold/10 text-foreground' : 'border-transparent text-fg-2 hover:border-border hover:text-foreground'}`}
                    href={n.href}
                    onClick={e => {
                      if (i !== sel) {
                        e.preventDefault()
                        choose(i)
                      }
                    }}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    rel={n.external ? 'noopener noreferrer' : undefined}
                    target={n.external ? '_blank' : undefined}
                  >
                    <span className="font-mono text-[11px] uppercase tracking-wider text-fg-2/80">{n.issue ? `No. ${n.issue}` : n.date.slice(0, 4)}</span>
                    <span>
                      {n.title}
                      {n.isNew && <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-gold">new</span>}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </nav>

      {/* ── RIGHT: neurons + the selected article ── */}
      <div className="order-1 min-w-0 lg:order-2" ref={mapRef}>
        <div className="relative border border-border bg-black/40">
          <svg aria-label="Map of all articles: one dot per article, wired to its author" className="block h-[560px] w-full lg:h-auto" preserveAspectRatio="xMidYMid slice" role="img" viewBox={`0 0 ${W} ${H}`}>
            <defs>
              {authors.map(a => (
                <radialGradient id={`hub-${hash(a)}`} key={a}>
                  <stop offset="0" stopColor={color(a)} stopOpacity="0.35" />
                  <stop offset="1" stopColor={color(a)} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>
            {hubs.map((h, i) => (
              <circle className="qc-breathe" cx={h.x} cy={h.y} fill={`url(#hub-${hash(at(authors, i, ''))})`} key={at(authors, i, '')} r={110 + levelOf(at(authors, i, '')) * 9} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            ))}
            {edges.map((e, k) => {
              const p = at(pos, e.a, ORIGIN)
              const q = e.b < 0 ? at(hubs, -1 - e.b, ORIGIN) : at(pos, e.b, ORIGIN)
              const lit = e.a === active || e.b === active
              const c = color(at(nodes, e.a, node ?? nodes[0]!).author)
              return (
                <line
                  className={lit ? 'qc-synapse' : undefined}
                  key={k}
                  stroke={c}
                  strokeOpacity={lit ? 0.9 : e.kind === 'hub' ? 0.14 : 0.08}
                  strokeWidth={lit ? 1.6 : 0.8}
                  x1={p.x}
                  x2={q.x}
                  y1={p.y}
                  y2={q.y}
                />
              )
            })}
            {hubs.map((h, i) => {
              const a = at(authors, i, '')
              return (
                <g key={a}>
                  <circle cx={h.x} cy={h.y} fill={color(a)} r={hubR(a)} />
                  <circle cx={h.x} cy={h.y} fill="none" r={hubR(a) + 7} stroke={color(a)} strokeOpacity={0.5} strokeWidth={1} />
                  {levelOf(a) >= 10 && <circle className="qc-breathe" cx={h.x} cy={h.y} fill="none" r={hubR(a) + 16} stroke={color(a)} strokeOpacity={0.3} strokeWidth={1} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />}
                  <text fill={color(a)} fontFamily="ui-monospace, monospace" fontSize="12" letterSpacing="2" textAnchor="middle" x={h.x} y={h.y + hubR(a) + 26}>
                    {a.toUpperCase()}
                  </text>
                  <text fill={color(a)} fillOpacity={0.8} fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="2" textAnchor="middle" x={h.x} y={h.y + hubR(a) + 42}>
                    {`LVL ${levelOf(a)} · ${(groups.find(g => g.author === a)?.rank.name ?? '').toUpperCase()}`}
                  </text>
                </g>
              )
            })}
            {nodes.map((n, i) => {
              const p = at(pos, i, ORIGIN)
              const c = color(n.author)
              const on = i === active
              return (
                <g
                  className="cursor-pointer"
                  key={n.id}
                  onClick={() => choose(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') choose(i)
                  }}
                >
                  <title>{`${n.issue ? `No. ${n.issue} · ` : ''}${n.title} · ${n.dateLabel} · weight ${n.weight}`}</title>
                  <circle cx={p.x} cy={p.y} fill="transparent" r={16} />
                  {on && <circle className="qc-breathe" cx={p.x} cy={p.y} fill={c} fillOpacity={0.25} r={dotR(n.weight) + 11} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />}
                  <circle
                    className="qc-neuron"
                    cx={p.x}
                    cy={p.y}
                    fill={on ? c : '#0b0b0f'}
                    r={dotR(n.weight)}
                    stroke={c}
                    strokeWidth={on ? 2.5 : 1.5}
                    style={{ animationDelay: `${(hash(n.id) % 70) / 10}s`, transformBox: 'fill-box', transformOrigin: 'center' }}
                  />
                  {n.isNew && <circle cx={p.x + dotR(n.weight) + 2} cy={p.y - dotR(n.weight) - 2} fill="#ffd24a" r={2.5} />}
                </g>
              )
            })}
          </svg>
          <p className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.25em] text-fg-2">
            {nodes.length} articles · {authors.length} authors · one dot each · bigger dot, heavier article
          </p>
        </div>

        <ol aria-label="Rank ladder" className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-2/70">
          {RANKS.map(r => {
            const holders = groups.filter(g => g.rank.level === r.level)
            return (
              <li className={holders.length ? 'text-foreground' : undefined} key={r.level} title={Number.isFinite(r.min) ? `from weight ${r.min}` : 'the origin only'}>
                {r.level} {r.name}
                {holders.map(g => (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full align-middle" key={g.author} style={{ background: color(g.author) }} />
                ))}
              </li>
            )
          })}
        </ol>

        {node && (
          <article className="mt-6 border border-border bg-card/60 p-6 backdrop-blur-sm md:p-8" key={node.id}>
            <p className="eyebrow" style={{ color: color(node.author) }}>
              {node.issue ? `No. ${node.issue} · ` : `${node.platform ?? 'Archive'} · `}
              {node.dateLabel} · {node.author}
            </p>
            {node.kicker && <p className="mt-3 font-mono text-xs uppercase tracking-[0.3em] text-fg-2">{node.kicker}</p>}
            <h2 className="mt-3 font-display text-4xl leading-[0.95] md:text-5xl">{node.title}</h2>
            <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed text-foreground/85">{node.summary}</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-2/70">
              weight {node.weight} · {node.weightLabel}
              {node.tags.length > 0 && ` · ${node.tags.join(' · ')}`}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {node.external ? (
                <a className="inline-flex h-11 items-center border border-gold bg-gold/10 px-5 text-sm font-medium text-gold hover:bg-gold/20" href={node.href} rel="noopener noreferrer" target="_blank">
                  Read the original ↗
                </a>
              ) : (
                <Link className="inline-flex h-11 items-center border border-gold bg-gold/10 px-5 text-sm font-medium text-gold hover:bg-gold/20" href={node.href}>
                  Read the article →
                </Link>
              )}
              {node.minutes && <span className="text-sm text-fg-2">{node.minutes} min read</span>}
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
