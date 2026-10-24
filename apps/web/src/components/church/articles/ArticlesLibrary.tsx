'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AUTHORS, nextRank, rankFor, rankLabel } from '@/lib/ranks'

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
  words?: number
}

const AUTHOR_COLORS: Record<string, string> = { TesserAI: '#ffd24a', 'Come-from-Beyond': '#7dd3fc' }
const GUEST_HUES = ['#c4b5fd', '#86efac', '#fda4af', '#f9a8d4', '#fdba74', '#67e8f9', '#a3e635']
const hash = (s: string) => Array.from(s).reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)
const colorOf = (a: string) => AUTHOR_COLORS[a] ?? GUEST_HUES[Math.abs(hash(a)) % GUEST_HUES.length] ?? '#c4b5fd'

function Open({ v, className, children, onHover }: { v: Volume; className?: string; children: React.ReactNode; onHover?: (v: Volume | null) => void }) {
  const common = { className, onMouseEnter: () => onHover?.(v), onMouseLeave: () => onHover?.(null), onFocus: () => onHover?.(v), onBlur: () => onHover?.(null) }
  return v.external ? (
    <a {...common} href={v.href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  ) : (
    <Link {...common} href={v.href}>
      {children}
    </Link>
  )
}

export function ArticlesLibrary({ volumes }: { volumes: Volume[] }) {
  const shelves = useMemo(() => {
    const authors = Array.from(new Set(volumes.map(v => v.author)))
    return authors
      .map(a => {
        const items = volumes.filter(v => v.author === a)
        const xp = items.reduce((t, v) => t + v.weight, 0)
        const prof = AUTHORS[a]
        return { author: a, handle: items[0]?.handle ?? '', items, xp, rank: rankFor(xp, prof?.fixedLevel), next: nextRank(xp, prof?.fixedLevel), title: prof?.title, color: colorOf(a) }
      })
      .sort((p, q) => q.rank.level - p.rank.level || q.xp - p.xp)
  }, [volumes])
  const [tab, setTab] = useState<string>('all')
  const [hover, setHover] = useState<Volume | null>(null)

  const listed = (tab === 'all' ? volumes : volumes.filter(v => v.author === tab)).slice().sort((a, b) => b.date.localeCompare(a.date))
  const byYear = listed.reduce<Record<string, Volume[]>>((acc, v) => {
    const y = v.date.slice(0, 4)
    ;(acc[y] ??= []).push(v)
    return acc
  }, {})
  const maxWords = Math.max(...volumes.map(v => v.words ?? 600), 600)

  return (
    <div className="mt-12">
      {/* ── SHELVES ── */}
      <section aria-label="Shelves by author" className="space-y-12" id="shelves">
        {shelves.map(s => (
          <div key={s.author}>
            <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border pb-3">
              <h2 className="font-display text-3xl leading-none md:text-4xl">{s.author}</h2>
              <a className="font-mono text-xs uppercase tracking-[0.25em] text-fg-2 hover:text-gold" href={`https://x.com/${s.handle}`} rel="noopener noreferrer" target="_blank">
                @{s.handle}
              </a>
              <span className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: s.color }}>
                {rankLabel(s.rank)}
              </span>
              <span className="ml-auto font-mono text-xs uppercase tracking-[0.25em] text-fg-2">
                {s.items.length} {s.items.length === 1 ? 'volume' : 'volumes'} · weight {s.xp}
                {s.next && ` · ${s.next.missing} to rank ${s.next.rank.level}`}
              </span>
            </header>
            {s.title && <p className="mt-2 text-sm text-fg-2">{s.title}</p>}

            {/* the shelf */}
            <div className="relative mt-4 overflow-x-auto pb-2">
              <ol className="flex min-w-max items-end gap-[3px] border-b-4 px-2 pt-6" style={{ borderColor: `${s.color}66` }}>
                {s.items
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(v => {
                    const w = 18 + Math.round(Math.sqrt(v.weight) * 10)
                    const h = 120 + Math.round(((v.words ?? 600) / maxWords) * 110)
                    const on = hover?.id === v.id
                    return (
                      <li key={v.id} style={{ width: w }}>
                        <Open
                          className="group relative block border border-white/15 transition-transform hover:-translate-y-2 focus:-translate-y-2"
                          onHover={setHover}
                          v={v}
                        >
                          <span
                            className="block"
                            style={{
                              width: w,
                              height: h,
                              background: on ? s.color : `linear-gradient(180deg, ${s.color}33, ${s.color}14 60%, #0b0b0f)`,
                              boxShadow: 'inset 2px 0 0 rgba(255,255,255,0.08), inset -2px 0 0 rgba(0,0,0,0.4)',
                            }}
                          />
                          <span
                            className={`pointer-events-none absolute left-0 top-0 flex h-full w-full items-start justify-center overflow-hidden font-mono text-[10px] uppercase tracking-[0.08em] ${on ? 'text-black' : 'text-foreground/85'}`}
                          >
                            <span className="block whitespace-nowrap pt-2 leading-none [writing-mode:vertical-rl]">{v.title.length > 30 ? `${v.title.slice(0, 29)}…` : v.title}</span>
                          </span>
                          {v.isNew && <span className="absolute -top-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold" />}
                          <span className="sr-only">{`${v.title}, ${v.dateLabel}, weight ${v.weight}`}</span>
                        </Open>
                        <span className="mt-1 block text-center font-mono text-[9px] text-fg-2/70">{v.date.slice(2, 4)}</span>
                      </li>
                    )
                  })}
              </ol>
            </div>
          </div>
        ))}
      </section>

      {/* the open book: what the cursor is on */}
      <div aria-live="polite" className="mt-4 min-h-[3.5rem] border-l-2 border-gold/60 pl-4 text-sm">
        {hover ? (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-2">
              {hover.issue ? `No. ${hover.issue} · ` : `${hover.platform ?? 'Archive'} · `}
              {hover.dateLabel} · {hover.author} · weight {hover.weight}
            </p>
            <p className="mt-1 text-foreground">{hover.title}</p>
            <p className="mt-1 line-clamp-2 text-fg-2">{hover.summary}</p>
          </>
        ) : (
          <p className="text-fg-2">Hover a spine to read its card. Thicker spine, heavier article; taller spine, longer read. Click to open.</p>
        )}
      </div>

      {/* ── CATALOGUE ── */}
      <section aria-label="Catalogue" className="mt-16" id="catalogue">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-border pb-3">
          <h2 className="font-display text-3xl leading-none md:text-4xl">Catalogue</h2>
          <div className="flex flex-wrap gap-1 font-mono text-xs uppercase tracking-[0.2em]" role="tablist">
            {[{ id: 'all', label: `All ${volumes.length}` }, ...shelves.map(s => ({ id: s.author, label: `${s.author} ${s.items.length}` }))].map(t => (
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
        <div className="md:columns-2 md:gap-10">
          {Object.keys(byYear)
            .sort((a, b) => b.localeCompare(a))
            .map(y => (
              <div className="break-inside-avoid pt-6" key={y}>
                <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{y}</h3>
                <ol className="mt-2 divide-y divide-border/60">
                  {byYear[y]?.map(v => (
                    <li key={v.id}>
                      <Open className="group grid grid-cols-[3.25rem_1fr_auto] items-baseline gap-3 py-2 text-sm hover:bg-card/50" onHover={setHover} v={v}>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-2/80">{v.issue ? `No. ${v.issue}` : v.date.length > 4 ? v.date.slice(5, 7) + '.' + v.date.slice(2, 4) : '—'}</span>
                        <span className="min-w-0">
                          <span className="text-foreground group-hover:text-gold">{v.title}</span>
                          {v.isNew && <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-gold">new</span>}
                          <span className="block font-mono text-[10px] uppercase tracking-wider text-fg-2/70">
                            {v.author}
                            {v.minutes ? ` · ${v.minutes} min` : ''}
                            {v.external ? ' · ↗' : ''}
                          </span>
                        </span>
                        <span className="font-mono text-[10px] text-fg-2/70" title={v.weightLabel}>
                          w{v.weight}
                        </span>
                      </Open>
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
