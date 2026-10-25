import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { locales } from '@/config/i18n'
import { SITE_URL } from '@/lib/books'
import { jsonLd } from '@/lib/json-ld'
import { BOARDS, MEMBERS, bioOf, homeOf, memberByHandle, postsOf, profileHref } from '@/lib/forum'
import { ForumShell, Stars } from '@/components/church/forum/ForumUI'
import { Avatar } from '@/components/church/forum/Avatar'

export function generateStaticParams() {
  return locales.flatMap(locale => MEMBERS.map(m => ({ locale, handle: m.handle.toLowerCase() })))
}

export async function generateMetadata(props: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await props.params
  const m = memberByHandle(handle)
  if (!m) return {}
  return {
    title: { absolute: `View the profile of ${m.name} · The Crypt` },
    description: `${m.name} (@${m.handle}) in The Crypt, the forum of Qubic Church: ${m.role ? `${m.role}, ` : ''}${m.rank.name}, rank ${m.rank.level}. ${bioOf(m) ?? ''}`.slice(0, 160),
    alternates: { canonical: `${SITE_URL}${profileHref(m.handle)}` },
  }
}

export default async function ProfilePage(props: { params: Promise<{ locale: string; handle: string }> }) {
  const { locale, handle } = await props.params
  setRequestLocale(locale)
  const m = memberByHandle(handle)
  if (!m) notFound()
  const posts = postsOf(m)
  const last = posts[0]
  const staff = m.role === 'Founder' ? '#b8860b' : m.role ? '#8b1a8b' : undefined
  const rows: [string, React.ReactNode][] = [
    ['Name', <b key="n">{m.name}</b>],
    [m.name === 'Maria' ? 'Reposts' : 'Posts', m.name === 'Maria' ? m.activity : `${m.activity}${m.replies ? ` (${m.replies} replies)` : ''}`],
    ['Merit', m.rank.level === 10 ? '∞' : m.merit],
    ['Weight', m.weight],
    [
      'Position',
      <span key="p">
        {m.role && <b style={{ color: staff }}>{m.role} · </b>}
        {m.role === m.rank.name ? '' : `${m.rank.name} · `}rank {m.rank.level} <Stars gold={m.rank.level === 10} n={m.rank.level} />
      </span>,
    ],
    ['Next rank', m.next ? `${m.next.rank.name} (rank ${m.next.rank.level}), ${m.next.missing} weight to go` : m.rank.level === 10 ? 'none, this is the origin' : 'top of the ladder'],
    [m.name === 'Maria' ? 'Member since' : 'Writing since', m.since],
    ['Last active', last ? last.dateLabel : 'not yet'],
    [
      m.auth === 'qubic' ? 'Qubic ID' : m.auth === 'trip' ? 'Tripcode' : 'X',
      homeOf(m).href ? (
        <a href={homeOf(m).href} key="home" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
          {m.auth === 'qubic' ? m.identity : homeOf(m).label}
        </a>
      ) : (
        <span key="home">{homeOf(m).label}</span>
      ),
    ],
  ]
  if (m.auth !== 'x' && m.x)
    rows.push([
      'X',
      <a href={`https://x.com/${m.x}`} key="x" rel="noopener noreferrer">
        @{m.x}
      </a>,
    ])

  const sameAs = [m.x ? `https://x.com/${m.x}` : null, m.auth === 'qubic' ? homeOf(m).href : null].filter(Boolean) as string[]
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${SITE_URL}${profileHref(m.handle)}`,
    name: `${m.name} on The Crypt, the forum of Qubic Church`,
    mainEntity: {
      '@type': 'Person',
      name: m.name,
      ...(bioOf(m) ? { description: bioOf(m) } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(m.role ? { jobTitle: m.role } : {}),
      interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WriteAction', userInteractionCount: m.activity },
    },
    hasPart: posts.slice(0, 20).map(t => ({ '@type': 'Article', headline: t.title, url: `${SITE_URL}${t.href}`, datePublished: t.date })),
  }
  return (
    <ForumShell crumbs={[{ label: 'The Crypt', href: '/articles' }, { label: `View the profile of ${m.name}` }]}>
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <div className="qcf-box">
        <div className="qcf-cat">View the profile of {m.name}</div>
        <table>
          <tbody>
            <tr className="qcf-win qcf-stack">
              <td style={{ width: 200, textAlign: 'center' }}>
                <div style={{ width: 96, margin: '4px auto 8px' }}>
                  <Avatar pic={m.avatar} seed={m.identity ?? m.handle} size={96} />
                </div>
                <h1 className="qcf-name">{m.name}</h1>
                {m.role && (
                  <div className="qcf-strong" style={{ color: staff }}>
                    {m.role}
                  </div>
                )}
                <Stars gold={m.rank.level === 10} n={m.rank.level} />
              </td>
              <td>
                <table>
                  <tbody>
                    {rows.map(([k, v]) => (
                      <tr key={k}>
                        <td className="qcf-strong" style={{ width: 140, borderTop: 0, padding: '3px 8px' }}>
                          {k}:
                        </td>
                        <td style={{ borderTop: 0, padding: '3px 8px' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bioOf(m) && <p style={{ margin: '10px 8px 0', whiteSpace: 'pre-line' }}>{bioOf(m)}</p>}
                {m.signature && <div className="qcf-sig" style={{ margin: '12px 8px 0' }}>{m.signature}</div>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="qcf-box">
        <div className="qcf-cat">{m.name === 'Maria' ? `Topics reposted by ${m.name}` : `Show the last posts of ${m.name}`} ({posts.length})</div>
        <table>
          <tbody>
            {posts.length === 0 && (
              <tr className="qcf-win">
                <td className="qcf-muted" style={{ textAlign: 'center', padding: 20 }}>
                  {m.name === 'Maria' ? 'No reposts yet. Write a topic on X starting with “hey @maria_aigarth”.' : 'No posts yet.'}
                </td>
              </tr>
            )}
            {posts.map((t, i) => (
              <tr className={i % 2 ? 'qcf-win2' : 'qcf-win'} key={t.id}>
                <td>
                  <Link className="qcf-strong" href={t.href}>
                    {t.title}
                  </Link>
                  <div className="qcf-small qcf-muted">
                    {BOARDS.find(b => b.id === t.board)?.name} · {t.dateLabel} · weight {t.weight}
                    {m.name === 'Maria' && ` · by ${t.author}`}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ForumShell>
  )
}
