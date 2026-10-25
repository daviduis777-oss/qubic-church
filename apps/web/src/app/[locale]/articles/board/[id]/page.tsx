import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { locales } from '@/config/i18n'
import { SITE_URL } from '@/lib/books'
import { BOARDS, getBoard, memberOf, profileHref, topicsIn } from '@/lib/forum'
import { ForumShell } from '@/components/church/forum/ForumUI'

export function generateStaticParams() {
  return locales.flatMap(locale => BOARDS.map(b => ({ locale, id: b.id })))
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const b = getBoard(id)
  if (!b) return {}
  return {
    title: { absolute: `${b.name} · The Crypt` },
    description: b.desc,
    alternates: { canonical: `${SITE_URL}/articles/board/${b.id}` },
  }
}

export default async function BoardPage(props: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await props.params
  setRequestLocale(locale)
  const b = getBoard(id)
  if (!b) notFound()
  const topics = topicsIn(b.id)

  return (
    <ForumShell crumbs={[{ label: 'The Crypt', href: '/articles' }, { label: b.name }]}>
      <h1 className="sr-only">{b.name}</h1>
      <p className="qcf-small qcf-muted" style={{ margin: '0 2px 8px' }}>
        {b.desc}
      </p>
      {b.id === 'open' && (
        <p style={{ margin: '0 2px 8px' }}>
          <a
            className="qcf-btn qcf-btn-main"
            href={`https://x.com/intent/post?text=${encodeURIComponent('hey @maria_aigarth \n\n\n#Qubic #Aigarth')}`}
            rel="noopener noreferrer"
          >
            New topic (on X)
          </a>{' '}
          <Link className="qcf-btn" href="/articles#write">
            How it works
          </Link>
        </p>
      )}
      <div className="qcf-box">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th style={{ width: 170 }}>Started by</th>
              <th className="qcf-hide-sm" style={{ width: 70, textAlign: 'center' }}>
                Weight
              </th>
              <th className="qcf-hide-sm" style={{ width: 150 }}>
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {topics.length === 0 && (
              <tr className="qcf-win">
                <td className="qcf-muted" colSpan={4} style={{ textAlign: 'center', padding: 24 }}>
                  No topics yet. Post on X starting with “hey @maria_aigarth”, add #Qubic #Aigarth, and yours will be the first.
                </td>
              </tr>
            )}
            {topics.map((t, i) => {
              const m = memberOf(t.author)
              return (
                <tr className={i % 2 ? 'qcf-win2' : 'qcf-win'} key={t.id}>
                  <td>
                    {t.issue && <span className="qcf-small qcf-muted">No. {t.issue} · </span>}
                    <Link className="qcf-strong" href={t.href}>
                      {t.title}
                    </Link>
                    {t.isNew && <span className="qcf-new">new</span>}
                    <div className="qcf-small qcf-muted" style={{ marginTop: 2 }}>
                      {t.summary.length > 160 ? `${t.summary.slice(0, 159)}…` : t.summary}
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <Link className="qcf-strong" href={profileHref(t.handle)} title={`View the profile of ${t.author}`}>
                      {t.author}
                    </Link>
                    {m && (
                      <div className="qcf-small" style={{ color: m.role === 'Founder' ? '#b8860b' : '#555' }}>
                        {m.role ?? m.rank.name} · rank {m.rank.level}
                      </div>
                    )}
                  </td>
                  <td className="qcf-hide-sm" style={{ textAlign: 'center' }}>
                    {t.weight}
                  </td>
                  <td className="qcf-hide-sm qcf-small qcf-muted">{t.dateLabel}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </ForumShell>
  )
}
