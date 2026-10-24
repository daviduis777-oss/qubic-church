import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Member } from '@/lib/forum'

export type Crumb = { label: string; href?: string }

/** The forum frame: header, menu, breadcrumbs. Everything under /articles sits in it. */
export function ForumShell({ crumbs, children }: { crumbs: Crumb[]; children: ReactNode }) {
  return (
    <div className="qcf min-h-screen">
      <div className="qcf-wrap">
        <div className="qcf-head">
          <Link className="qcf-logo" href="/articles">
            Qubic Church Forum
          </Link>
          <span className="qcf-tag">The archive of Aigarth, est. 2026 · founded on the words of Come-from-Beyond</span>
        </div>
        <div className="qcf-menu">
          <Link href="/articles">Home</Link>
          <Link href="/articles/board/founder">Founder&apos;s Archive</Link>
          <Link href="/articles/board/chronicle">Chronicle</Link>
          <Link href="/articles/board/open">Open Board</Link>
          <Link href="/articles#write">Write a topic</Link>
          <Link href="/articles#ranks">Ranks</Link>
          <a href="/articles/feed.xml">RSS</a>
          <span className="qcf-hello">Welcome, Guest. Please login on X and start with “hey @maria_aigarth”.</span>
        </div>
        <nav aria-label="Breadcrumb" className="qcf-crumbs">
          {crumbs.map((c, i) => (
            <span key={c.label}>
              {i > 0 && ' » '}
              {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </nav>
        {children}
        <p className="qcf-small qcf-muted" style={{ textAlign: 'center', marginTop: 24 }}>
          Qubic Church Forum · powered by Qubic Church · <Link href="/">qubic.church</Link> · Not financial advice.
        </p>
      </div>
    </div>
  )
}

export function Stars({ n, gold }: { n: number; gold?: boolean }) {
  return (
    <span aria-label={`rank ${n} of 10`} className="qcf-stars" role="img" style={gold ? { color: '#b8860b' } : undefined}>
      {'★'.repeat(n)}
      <span className="off">{'★'.repeat(10 - n)}</span>
    </span>
  )
}

/** The left column of a post: who wrote it and where they stand. */
export function Postbit({ m }: { m: Member }) {
  const staff = m.role === 'Founder' ? '#b8860b' : m.role ? '#8b1a8b' : undefined
  return (
    <div>
      <a className="qcf-name" href={`https://x.com/${m.handle}`} rel="noopener noreferrer">
        {m.name}
      </a>
      {m.role && (
        <div className="qcf-strong" style={{ color: staff }}>
          {m.role}
        </div>
      )}
      <div>{m.role === m.rank.name ? `rank ${m.rank.level}` : `${m.rank.name} · rank ${m.rank.level}`}</div>
      <Stars gold={m.rank.level === 10} n={m.rank.level} />
      <div style={{ marginTop: 6 }}>
        {m.activityLabel}: {m.activity}
        <br />
        Merit: {m.rank.level === 10 ? '∞' : m.merit}
        <br />
        Weight: {m.weight}
      </div>
      <div className="qcf-muted" style={{ marginTop: 6 }}>
        @{m.handle}
      </div>
    </div>
  )
}

export function Quote({ from, children }: { from?: string; children: ReactNode }) {
  return (
    <>
      {from && <div className="qcf-quote-head">Quote from: {from}</div>}
      <div className="qcf-quote">{children}</div>
    </>
  )
}
