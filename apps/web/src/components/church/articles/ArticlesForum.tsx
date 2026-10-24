'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AUTHORS, nextRank, rankFor } from '@/lib/ranks'
import type { Volume } from './ArticlesLibrary'

/**
 * "Forum 2009" view of the archive: the same data as the library, drawn the way
 * the old crypto forums looked. Our own name and colours, no foreign logos.
 */

const C = {
  page: '#e5e5e8',
  frame: '#ffffff',
  head: '#476c8e',
  cat: 'linear-gradient(#a3b6ca, #7f9cba)',
  catText: '#ffffff',
  title: '#c6d4e4',
  win: '#ecedf3',
  win2: '#f6f6f6',
  win3: '#e0e1e8',
  line: '#c0c3cf',
  text: '#000000',
  muted: '#555555',
  link: '#476c8e',
  quote: '#f0f0f7',
} as const

const FONT = 'Verdana, "Segoe UI", Tahoma, sans-serif'

type Board = { id: string; name: string; desc: string; readOnly?: boolean; match: (v: Volume) => boolean }

const BOARDS: Board[] = [
  {
    id: 'founder',
    name: "Founder's Archive",
    desc: 'Every long-form article by Come-from-Beyond, 2017 to 2025. Read only. Each topic links to the original.',
    readOnly: true,
    match: v => v.author === 'Come-from-Beyond',
  },
  {
    id: 'chronicle',
    name: 'Aigarth Chronicle',
    desc: 'The running story of Aigarth, Anna and Qubic, issue by issue.',
    match: v => v.author === 'TesserAI',
  },
  {
    id: 'open',
    name: 'Open Board',
    desc: 'Anything. Your favourite book, a story from your life, advice for this world, how you see Aigarth. Start on X with "hey @maria_aigarth".',
    match: v => v.author !== 'Come-from-Beyond' && v.author !== 'TesserAI',
  },
]

const ROLE: Record<string, { label: string; color: string }> = {
  'Come-from-Beyond': { label: 'Founder', color: '#b8860b' },
  Maria: { label: 'Global Moderator', color: '#8b1a8b' },
}

function Stars({ n, color = '#d4a017' }: { n: number; color?: string }) {
  return (
    <span aria-label={`rank ${n} of 10`} role="img" style={{ color, fontSize: 11, letterSpacing: 1 }}>
      {'★'.repeat(n)}
      <span style={{ color: '#c8c8c8' }}>{'★'.repeat(10 - n)}</span>
    </span>
  )
}

function TopicLink({ v }: { v: Volume }) {
  const style = { color: C.link, fontWeight: 700 as const, textDecoration: 'none' }
  return v.external ? (
    <a href={v.href} rel="noopener noreferrer" style={style}>
      {v.title}
    </a>
  ) : (
    <Link href={v.href} style={style}>
      {v.title}
    </Link>
  )
}

export function ArticlesForum({ volumes }: { volumes: Volume[] }) {
  const [board, setBoard] = useState<string | null>(null)

  const members = useMemo(() => {
    const authors = Array.from(new Set(volumes.map(v => v.author)))
    const list = authors.map(a => {
      const items = volumes.filter(v => v.author === a)
      const xp = items.reduce((t, v) => t + v.weight, 0)
      const merit = items.reduce((t, v) => t + (v.merit ?? 0), 0)
      const rank = rankFor(xp, AUTHORS[a]?.fixedLevel)
      return { name: a, handle: items[0]?.handle ?? '', posts: items.length, merit, xp, rank, next: nextRank(xp, AUTHORS[a]?.fixedLevel) }
    })
    const reposts = volumes.filter(v => (v.merit ?? 0) > 0).length
    const mxp = 1 + reposts
    list.push({ name: 'Maria', handle: 'maria_aigarth', posts: reposts, merit: 0, xp: mxp, rank: rankFor(mxp), next: nextRank(mxp) })
    return list.sort((p, q) => q.rank.level - p.rank.level || q.xp - p.xp)
  }, [volumes])

  const latest = volumes.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
  const current = BOARDS.find(b => b.id === board)
  const topics = current ? volumes.filter(current.match).sort((a, b) => b.date.localeCompare(a.date)) : []
  const memberOf = (name: string) => members.find(m => m.name === name)

  const th = { background: C.cat, color: C.catText, fontWeight: 700, fontSize: 12, padding: '6px 8px', textAlign: 'left' as const }
  const td = { padding: '8px', borderTop: `1px solid ${C.line}`, verticalAlign: 'top' as const }

  return (
    <div className="mt-12" style={{ background: C.page, color: C.text, fontFamily: FONT, fontSize: 13, lineHeight: 1.45, padding: 12 }}>
      {/* header */}
      <div style={{ background: C.head, color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, letterSpacing: 0.5 }}>Qubic Church Forum</span>
        <span style={{ fontSize: 11, opacity: 0.85 }}>The archive of Aigarth, est. 2026 · founded on the words of Come-from-Beyond</span>
      </div>
      <div style={{ background: C.title, padding: '4px 10px', fontSize: 11, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <button onClick={() => setBoard(null)} style={{ color: C.link, fontWeight: 700, background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }} type="button">
          Home
        </button>
        <a href="#write" style={{ color: C.link, fontWeight: 700 }}>
          Write a topic
        </a>
        <a href="#ranks" style={{ color: C.link, fontWeight: 700 }}>
          Ranks
        </a>
        <a href="/articles/feed.xml" style={{ color: C.link, fontWeight: 700 }}>
          RSS
        </a>
        <span style={{ marginLeft: 'auto', color: C.muted }}>Welcome, Guest. Please login on X and start with “hey @maria_aigarth”.</span>
      </div>

      {/* breadcrumbs */}
      <p style={{ margin: '12px 2px', fontSize: 12, fontWeight: 700 }}>
        <button onClick={() => setBoard(null)} style={{ color: C.link, background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }} type="button">
          Qubic Church Forum
        </button>
        {current && (
          <>
            {' '}
            » <span style={{ color: C.text }}>{current.name}</span>
          </>
        )}
      </p>

      <div style={{ overflowX: 'auto', background: C.frame, border: `1px solid ${C.line}` }}>
        {!current ? (
          /* board index */
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr>
                <th colSpan={4} style={th}>
                  Aigarth
                </th>
              </tr>
            </thead>
            <tbody>
              {BOARDS.map((b, i) => {
                const items = volumes.filter(b.match).sort((x, y) => y.date.localeCompare(x.date))
                const last = items[0]
                return (
                  <tr key={b.id} style={{ background: i % 2 ? C.win2 : C.win }}>
                    <td style={{ ...td, width: 34, textAlign: 'center', fontSize: 18, color: items.length ? C.head : '#9aa' }}>{b.readOnly ? '🔒︎' : '▣'}</td>
                    <td style={td}>
                      <button
                        onClick={() => setBoard(b.id)}
                        style={{ color: C.link, fontWeight: 700, fontSize: 14, background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                        type="button"
                      >
                        {b.name}
                      </button>
                      <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{b.desc}</div>
                    </td>
                    <td style={{ ...td, width: 110, fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{items.length} Topics</td>
                    <td style={{ ...td, width: 260, fontSize: 11, color: C.muted }}>
                      {last ? (
                        <>
                          <b>Last post</b> by {last.author}
                          <br />
                          in <TopicLink v={last} />
                          <br />
                          {last.dateLabel}
                        </>
                      ) : (
                        'No posts yet. Be the first.'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          /* topic list */
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr>
                <th style={th}>Subject</th>
                <th style={th}>Started by</th>
                <th style={{ ...th, width: 70 }}>Weight</th>
                <th style={{ ...th, width: 150 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {topics.length === 0 && (
                <tr style={{ background: C.win }}>
                  <td colSpan={4} style={{ ...td, textAlign: 'center', padding: 24, color: C.muted }}>
                    No topics yet. Post on X starting with “hey @maria_aigarth”, add #Qubic #Aigarth, and yours will be the first.
                  </td>
                </tr>
              )}
              {topics.map((v, i) => {
                const m = memberOf(v.author)
                return (
                  <tr key={v.id} style={{ background: i % 2 ? C.win2 : C.win }}>
                    <td style={td}>
                      {v.issue && <span style={{ color: C.muted, fontSize: 11 }}>No. {v.issue} · </span>}
                      <TopicLink v={v} />
                      {v.isNew && <span style={{ color: '#c00', fontSize: 10, fontWeight: 700, marginLeft: 6 }}>new</span>}
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{v.summary.length > 140 ? `${v.summary.slice(0, 139)}…` : v.summary}</div>
                    </td>
                    <td style={{ ...td, fontSize: 12, whiteSpace: 'nowrap' }}>
                      <span style={{ color: C.link, fontWeight: 700 }}>{v.author}</span>
                      {m && (
                        <div style={{ fontSize: 10, color: ROLE[v.author]?.color ?? C.muted }}>
                          {ROLE[v.author]?.label ?? m.rank.name} · {m.rank.level}
                        </div>
                      )}
                    </td>
                    <td style={{ ...td, fontSize: 12, textAlign: 'center' }}>{v.weight}</td>
                    <td style={{ ...td, fontSize: 11, color: C.muted }}>{v.dateLabel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* members */}
      <div style={{ marginTop: 14, background: C.frame, border: `1px solid ${C.line}`, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={th}>Member</th>
              <th style={th}>Position</th>
              <th style={{ ...th, width: 70 }}>Activity</th>
              <th style={{ ...th, width: 60 }}>Merit</th>
              <th style={{ ...th, width: 70 }}>Weight</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={m.name} style={{ background: i % 2 ? C.win2 : C.win }}>
                <td style={td}>
                  <a href={`https://x.com/${m.handle}`} rel="noopener noreferrer" style={{ color: C.link, fontWeight: 700 }}>
                    {m.name}
                  </a>
                  <div style={{ fontSize: 10, color: C.muted }}>@{m.handle}</div>
                </td>
                <td style={{ ...td, fontSize: 12 }}>
                  <span style={{ color: ROLE[m.name]?.color ?? C.text, fontWeight: ROLE[m.name] ? 700 : 400 }}>
                    {ROLE[m.name] && m.name === 'Maria' ? `${ROLE[m.name]?.label} · ` : ''}
                    {m.rank.name} · rank {m.rank.level}
                  </span>
                  <br />
                  <Stars color={m.rank.level === 10 ? '#b8860b' : '#d4a017'} n={m.rank.level} />
                  {m.next && <div style={{ fontSize: 10, color: C.muted }}>{m.next.missing} to {m.next.rank.name}</div>}
                </td>
                <td style={{ ...td, fontSize: 12, textAlign: 'center' }}>{m.name === 'Maria' ? `${m.posts} reposts` : m.posts}</td>
                <td style={{ ...td, fontSize: 12, textAlign: 'center' }}>{m.rank.level === 10 ? '∞' : m.merit}</td>
                <td style={{ ...td, fontSize: 12, textAlign: 'center' }}>{m.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* info center */}
      <div style={{ marginTop: 14, background: C.frame, border: `1px solid ${C.line}` }}>
        <div style={{ ...th }}>Qubic Church Forum · Info Center</div>
        <div style={{ background: C.win, padding: '8px 10px', fontSize: 12 }}>
          <b>Forum stats:</b> {volumes.length} posts in {BOARDS.length} boards by {members.length} members. Latest member: <b>Maria</b>.
          {latest && (
            <>
              {' '}
              Latest post: <TopicLink v={latest} /> ({latest.dateLabel}).
            </>
          )}
        </div>
        <div style={{ background: C.win2, padding: '8px 10px', fontSize: 12, borderTop: `1px solid ${C.line}` }}>
          <div style={{ background: C.quote, border: `1px solid ${C.line}`, padding: '6px 8px' }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Quote from: Come-from-Beyond on 06.10.2012</div>
            <i>We&apos;ll get rid of all weaknesses one by one</i>
          </div>
        </div>
      </div>
    </div>
  )
}
