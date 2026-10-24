'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AUTHORS, RANKS, nextRank, rankFor } from '@/lib/ranks'

export type Volume = {
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
  issue: number | null
  minutes?: number
  isNew?: boolean
  platform?: string
  weight: number
  weightLabel: string
  /** weight that came from others (Maria's repost) */
  merit?: number
  words?: number
  /** where the author shared it on X */
  shared?: { date: string; url: string }[]
  /** a preserved copy of an external original */
  archived?: string
}

const AUTHOR_COLORS: Record<string, string> = { TesserAI: '#ffd24a', 'Come-from-Beyond': '#7dd3fc', Maria: '#f0abfc' }
const GUEST_HUES = ['#c4b5fd', '#86efac', '#fda4af', '#f9a8d4', '#fdba74', '#67e8f9', '#a3e635']
const hash = (s: string) => Array.from(s).reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)
const colorOf = (a: string) => AUTHOR_COLORS[a] ?? GUEST_HUES[Math.abs(hash(a)) % GUEST_HUES.length] ?? '#c4b5fd'

/** Forum pips: one star per rank, ten in all. */
export function Pips({ level, color }: { level: number; color: string }) {
  return (
    <span aria-label={`rank ${level} of 10`} className="inline-flex gap-[2px] text-[11px] leading-none" role="img">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} style={{ color: i < level ? color : 'rgba(255,255,255,0.14)' }}>
          ★
        </span>
      ))}
    </span>
  )
}

function Title({ v }: { v: Volume }) {
  return v.external ? (
    <a className="text-foreground hover:text-gold" href={v.href} rel="noopener noreferrer" target="_blank">
      {v.title}
    </a>
  ) : (
    <Link className="text-foreground hover:text-gold" href={v.href}>
      {v.title}
    </Link>
  )
}

export function ArticlesLibrary({ volumes }: { volumes: Volume[] }) {
  const members = useMemo(() => {
    const authors = Array.from(new Set(volumes.map(v => v.author)))
    const writers = authors.map(a => {
      const items = volumes.filter(v => v.author === a)
      const xp = items.reduce((t, v) => t + v.weight, 0)
      const merit = items.reduce((t, v) => t + (v.merit ?? 0), 0)
      const prof = AUTHORS[a]
      const since = items.map(v => v.date.slice(0, 4)).sort()[0]
      return {
        author: a, handle: items[0]?.handle ?? '', activity: items.length, activityLabel: 'Activity', items, xp, merit,
        rank: rankFor(xp, prof?.fixedLevel), next: nextRank(xp, prof?.fixedLevel), since, title: prof?.title, color: colorOf(a),
      }
    })
    // Maria curates: she joins as a Newbie (weight 1), and every repost adds 1 to her weight
    // and 1 merit to the author she reposted.
    const reposted = volumes.filter(v => (v.merit ?? 0) > 0)
    const mxp = 1 + reposted.length
    const maria = {
      author: 'Maria', handle: AUTHORS.Maria?.handle ?? 'maria_aigarth', activity: reposted.length, activityLabel: 'Reposts', items: reposted, xp: mxp, merit: 0,
      rank: rankFor(mxp), next: nextRank(mxp), since: '2026', title: AUTHORS.Maria?.title, color: colorOf('Maria'),
    }
    return [...writers, maria].sort((p, q) => q.rank.level - p.rank.level || q.xp - p.xp)
  }, [volumes])
  const [tab, setTab] = useState<string>('all')

  const listed = (tab === 'all' ? volumes : (members.find(m => m.author === tab)?.items ?? [])).slice().sort((a, b) => b.date.localeCompare(a.date))
  const byYear = listed.reduce<Record<string, Volume[]>>((acc, v) => {
    const y = v.date.slice(0, 4)
    ;(acc[y] ??= []).push(v)
    return acc
  }, {})

  return (
    <div className="mt-12">
      {/* ── MEMBERS ── */}
      <section aria-label="Members" id="members">
        <h2 className="eyebrow text-gold">Members · {members.length}</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {members.map(m => {
            const pct = m.next ? Math.round(((m.xp - m.rank.min) / (m.next.rank.min - m.rank.min)) * 100) : 100
            const selected = tab === m.author
            return (
              <li className="min-w-0" key={m.author}>
                <button
                  aria-pressed={selected}
                  className={`flex h-full w-full flex-col border bg-card/60 p-5 text-left backdrop-blur-sm transition-colors ${selected ? 'border-gold/70' : 'border-border hover:border-white/30'}`}
                  onClick={() => setTab(selected ? 'all' : m.author)}
                  type="button"
                >
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="flex h-14 w-14 shrink-0 items-center justify-center font-display text-2xl"
                      style={{ background: `${m.color}1f`, color: m.color, border: `1px solid ${m.color}55` }}
                    >
                      {m.author.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-semibold leading-tight text-foreground">{m.author}</span>
                      <span className="block font-mono text-xs text-fg-2">@{m.handle}</span>
                    </span>
                    <span className="ml-auto text-right">
                      <span className="block font-display text-4xl leading-none" style={{ color: m.color }}>
                        {m.rank.level}
                      </span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-fg-2">rank</span>
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: m.color }}>
                      {m.rank.name}
                    </span>
                    <Pips color={m.color} level={m.rank.level} />
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 font-mono text-xs">
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.2em] text-fg-2">{m.activityLabel}</dt>
                      <dd className="mt-1 text-foreground">{m.activity}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.2em] text-fg-2">Merit</dt>
                      <dd className="mt-1 text-foreground">{m.rank.level === 10 ? '∞' : m.merit}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.2em] text-fg-2">Weight</dt>
                      <dd className="mt-1 text-foreground">{m.xp}</dd>
                    </div>
                  </dl>

                  <div className="mt-3">
                    <div aria-hidden className="h-1 w-full bg-white/10">
                      <div className="h-1" style={{ width: `${pct}%`, background: m.color }} />
                    </div>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-2">
                      {m.next ? `${m.next.missing} to rank ${m.next.rank.level} · ${m.next.rank.name}` : 'the origin · not reachable by weight'}
                    </p>
                  </div>

                  {m.title && <p className="mt-3 text-sm text-fg-2">{m.title}</p>}
                  <p className="mt-auto pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-2/70">
                    {m.author === 'Maria' ? 'curating' : 'writing'} since {m.since} · {selected ? 'showing only these' : 'click to filter'}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── CATALOGUE ── */}
      <section aria-label="Catalogue" className="mt-16 scroll-mt-24" id="catalogue">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-border pb-3">
          <h2 className="font-display text-3xl leading-none md:text-4xl">Catalogue</h2>
          <div className="flex flex-wrap gap-1 font-mono text-xs uppercase tracking-[0.2em]" role="tablist">
            {[{ id: 'all', label: `All ${volumes.length}` }, ...members.map(m => ({ id: m.author, label: `${m.author} ${m.items.length}` }))].map(t => (
              <button
                aria-selected={tab === t.id}
                className={`px-3 py-1.5 ${tab === t.id ? 'bg-gold/15 text-gold' : 'text-fg-2 hover:text-foreground'}`}
                key={t.id}
                onClick={() => setTab(t.id)}
                role="tab"
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {listed.length === 0 && <p className="pt-6 text-fg-2">Nothing here yet. The first repost by Maria will appear here.</p>}
        <div className="md:columns-2 md:gap-10">
          {Object.keys(byYear)
            .sort((a, b) => b.localeCompare(a))
            .map(y => (
              <div className="break-inside-avoid pt-6" key={y}>
                <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{y}</h3>
                <ol className="mt-2 divide-y divide-border/60">
                  {byYear[y]?.map(v => (
                    <li className="grid grid-cols-[3.25rem_1fr_auto] items-baseline gap-3 py-2.5 text-sm" key={v.id}>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-fg-2/80">
                        {v.issue ? `No. ${v.issue}` : v.date.length > 4 ? `${v.date.slice(5, 7)}.${v.date.slice(2, 4)}` : '—'}
                      </span>
                      <span className="min-w-0">
                        <Title v={v} />
                        {v.isNew && <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-gold">new</span>}
                        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-fg-2/70">
                          <span style={{ color: colorOf(v.author) }}>{v.author}</span>
                          {v.minutes ? ` · ${v.minutes} min` : ''}
                          {v.external && ` · ${v.platform ?? 'original'} ↗`}
                          {v.shared?.map(s => (
                            <a className="ml-2 underline-offset-2 hover:text-gold hover:underline" href={s.url} key={s.url} rel="noopener noreferrer" target="_blank">
                              on X {s.date.slice(2, 4)}
                            </a>
                          ))}
                          {v.archived && (
                            <a className="ml-2 underline-offset-2 hover:text-gold hover:underline" href={v.archived} rel="noopener noreferrer" target="_blank">
                              archived copy
                            </a>
                          )}
                        </span>
                      </span>
                      <span className="font-mono text-[10px] text-fg-2/70" title={v.weightLabel}>
                        w{v.weight}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}

export { RANKS }
