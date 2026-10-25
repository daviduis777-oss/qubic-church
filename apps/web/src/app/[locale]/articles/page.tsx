import type { Metadata } from 'next'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { jsonLd } from '@/lib/json-ld'
import { SITE_URL } from '@/lib/books'
import { ARTICLES, articleUrl } from '@/lib/articles'
import { CFB_ARTICLES } from '@/lib/archive'
import { RANKS, WEIGHT } from '@/lib/ranks'
import { BOARDS, MEMBERS, TOPICS, homeOf, profileHref, topicsIn } from '@/lib/forum'
import { ForumShell, Quote, Stars } from '@/components/church/forum/ForumUI'

const TITLE = 'Qubic Church Forum: articles on Qubic, Aigarth and Come-from-Beyond'
const DESC =
  'Old-style forum archive: the running story of Aigarth, guest articles on any topic, and every long-form article by Come-from-Beyond with dates.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/articles` },
  openGraph: { type: 'website', title: TITLE, description: DESC, url: `${SITE_URL}/articles` },
}

export default async function ArticlesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const latest = TOPICS.slice(0, 8)
  const newest = TOPICS[0]
  // the member whose first topic is the most recent one; Maria until a guest arrives
  const newestMember =
    MEMBERS.filter(m => m.name !== 'Maria')
      .map(m => ({ m, first: TOPICS.filter(t => t.author === m.name).map(t => t.date).sort()[0] ?? '' }))
      .sort((x, y) => y.first.localeCompare(x.first))
      .find(x => x.m.role === undefined && x.first >= '2026-10-01')?.m ?? MEMBERS.find(m => m.name === 'Maria')!

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESC,
    url: `${SITE_URL}/articles`,
    hasPart: [
      ...ARTICLES.map(a => ({ '@type': 'Article', headline: a.title, url: articleUrl(a), datePublished: a.date })),
      ...CFB_ARTICLES.map(a => ({ '@type': 'Article', headline: a.title, url: a.url, datePublished: a.date, author: { '@type': 'Person', name: 'Come-from-Beyond' } })),
    ],
  }

  return (
    <ForumShell crumbs={[{ label: 'Qubic Church Forum' }]}>
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <h1 className="sr-only">Qubic Church Forum: Articles</h1>

      {/* boards */}
      <div className="qcf-box">
        <table>
          <thead>
            <tr>
              <th colSpan={4}>Aigarth</th>
            </tr>
          </thead>
          <tbody>
            {BOARDS.map((b, i) => {
              const items = topicsIn(b.id)
              const last = items[0]
              return (
                <tr className={`qcf-stack ${i % 2 ? 'qcf-win2' : 'qcf-win'}`} key={b.id}>
                  <td className="qcf-hide-sm" style={{ width: 34, textAlign: 'center', fontSize: 16, color: items.length ? '#476c8e' : '#9aa' }}>
                    {b.readOnly ? '🔒︎' : '▣'}
                  </td>
                  <td>
                    <Link className="qcf-strong" href={`/articles/board/${b.id}`} style={{ fontSize: 14 }}>
                      {b.name}
                    </Link>
                    <div className="qcf-muted" style={{ fontSize: 12, marginTop: 2 }}>
                      {b.desc}
                    </div>
                  </td>
                  <td className="qcf-muted" style={{ width: 100, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {items.length} {items.length === 1 ? 'Topic' : 'Topics'}
                  </td>
                  <td className="qcf-small qcf-muted" style={{ width: 270 }}>
                    {last ? (
                      <>
                        <b>Last post</b> by <Link href={profileHref(last.handle)}>{last.author}</Link>
                        <br />
                        in <Link href={last.href}>{last.title}</Link>
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
      </div>

      {/* recent posts */}
      <div className="qcf-box">
        <div className="qcf-cat">Recent posts</div>
        <table>
          <tbody>
            {latest.map((t, i) => (
              <tr className={i % 2 ? 'qcf-win2' : 'qcf-win'} key={t.id}>
                <td>
                  <Link className="qcf-strong" href={t.href}>
                    {t.title}
                  </Link>
                  {t.isNew && <span className="qcf-new">new</span>}
                  <div className="qcf-small qcf-muted">
                    by <Link href={profileHref(t.handle)}>{t.author}</Link> in{' '}
                    <Link href={`/articles/board/${t.board}`}>{BOARDS.find(b => b.id === t.board)?.name}</Link> · {t.dateLabel}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* sticky: write */}
      <div className="qcf-box" id="write" style={{ scrollMarginTop: 72 }}>
        <div className="qcf-cat">📌︎ Sticky: Write us an article. No topic. No category. No censorship.</div>
        <div className="qcf-win qcf-post" style={{ padding: '12px 14px' }}>
          <p>
            Tell us about your favourite book. A story from your life that sounds made up. A piece of advice, or a lesson this
            world should hear. How you see Aigarth. What you think of Come-from-Beyond. Anything.
          </p>
          <p>This forum is an archive. What you write stays here, under your name.</p>
          <p>Write it the way you talk. Text with no LLM in it has a different vibe, and that vibe is the point.</p>
          <p>
            <b>Two ways in:</b>
          </p>
          <ol style={{ paddingLeft: 22, margin: '0 0 12px', listStyle: 'decimal' }}>
            <li>
              <Link href="/articles/new">Start a topic here</Link>. Login is a signature from your Qubic wallet or a tripcode: no email, no password, nothing personal. A moderator reads it, then it appears on the Open Board under your name.
            </li>
            <li>
              Or post on X starting with <b>hey @maria_aigarth</b> and <b>#Qubic #Aigarth</b>. Put the tag in the post itself, not only inside an X Article: mentions inside articles do not notify anyone.{' '}
              <a href="https://x.com/maria_aigarth" rel="noopener noreferrer">
                Maria
              </a>{' '}
              reposts you, and her repost adds merit to your topic once it is in the archive.
            </li>
          </ol>
          <p>
            <Link className="qcf-btn qcf-btn-main" href="/articles/new">
              Start new topic
            </Link>{' '}
            <a className="qcf-btn" href={`https://x.com/intent/post?text=${encodeURIComponent('hey @maria_aigarth \n\n\n#Qubic #Aigarth')}`} rel="noopener noreferrer">
              Post on X instead
            </a>{' '}
            <Link className="qcf-btn" href="/articles/board/open">
              Open Board
            </Link>
          </p>
        </div>
      </div>

      {/* sticky: ranks */}
      <div className="qcf-box" id="ranks" style={{ scrollMarginTop: 72 }}>
        <div className="qcf-cat">📌︎ Sticky: How ranks work</div>
        <div className="qcf-win qcf-post" style={{ padding: '12px 14px' }}>
          <p>
            Every member has three numbers. <b>Activity</b> is how many articles you wrote. <b>Merit</b> is what others gave
            you: each repost by Maria is +{WEIGHT.maria}. <b>Weight</b> is the sum, and weight sets your rank.
          </p>
          <p>
            An article weighs {WEIGHT.issue}. A primary source, an article by the person who built the thing we write about,
            weighs {WEIGHT.primary}. Replies count as activity but carry no weight. The thresholds roughly double at every
            step: the first ranks come in a week, Legendary takes years.
          </p>
          <p>
            Rank 10, Founder, cannot be reached by weight. It belongs to Come-from-Beyond. Maria is the Global Moderator: she
            starts as a Newbie, and every repost gives the author +{WEIGHT.maria} merit and Maria +1 weight.
          </p>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th>Name</th>
              <th className="qcf-hide-sm">Stars</th>
              <th>Weight needed</th>
            </tr>
          </thead>
          <tbody>
            {RANKS.map((r, i) => (
              <tr className={i % 2 ? 'qcf-win2' : 'qcf-win'} key={r.level}>
                <td className="qcf-strong">{r.level}</td>
                <td>{r.name}</td>
                <td className="qcf-hide-sm">
                  <Stars gold={r.level === 10} n={r.level} />
                </td>
                <td>{Number.isFinite(r.min) ? r.min : 'origin only'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* members */}
      <div className="qcf-box">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Position</th>
              <th style={{ width: 80, textAlign: 'center' }}>Activity</th>
              <th style={{ width: 60, textAlign: 'center' }}>Merit</th>
              <th style={{ width: 70, textAlign: 'center' }}>Weight</th>
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((m, i) => (
              <tr className={i % 2 ? 'qcf-win2' : 'qcf-win'} key={m.name}>
                <td>
                  <Link className="qcf-strong" href={profileHref(m.handle)} title={`View the profile of ${m.name}`}>
                    {m.name}
                  </Link>
                  <div className="qcf-small">
                    {homeOf(m).href ? (
                      <a href={homeOf(m).href} rel="noopener noreferrer">
                        {homeOf(m).label}
                      </a>
                    ) : (
                      <span className="qcf-muted">{homeOf(m).label}</span>
                    )}
                  </div>
                </td>
                <td style={{ fontSize: 12 }}>
                  {m.role && (
                    <b style={{ color: m.role === 'Founder' ? '#b8860b' : '#8b1a8b' }}>
                      {m.role}
                      {' · '}
                    </b>
                  )}
                  {m.rank.name} · rank {m.rank.level}
                  <br />
                  <Stars gold={m.rank.level === 10} n={m.rank.level} />
                  {m.next && (
                    <div className="qcf-small qcf-muted">
                      {m.next.missing} to {m.next.rank.name}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>{m.activityLabel === 'Reposts' ? `${m.activity} reposts` : m.replies ? `${m.activity} (${m.replies} replies)` : m.activity}</td>
                <td style={{ textAlign: 'center' }}>{m.rank.level === 10 ? '∞' : m.merit}</td>
                <td style={{ textAlign: 'center' }}>{m.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* info center */}
      <div className="qcf-box">
        <div className="qcf-cat">Qubic Church Forum · Info Center</div>
        <div className="qcf-win" style={{ padding: '8px 10px', fontSize: 12 }}>
          <b>Forum stats:</b> {TOPICS.length} posts in {BOARDS.length} boards by {MEMBERS.length} members. Latest member:{' '}
          <Link className="qcf-strong" href={profileHref(newestMember.handle)}>
            {newestMember.name}
          </Link>
          .
          {newest && (
            <>
              {' '}
              Latest post: <Link href={newest.href}>{newest.title}</Link> ({newest.dateLabel}).
            </>
          )}
        </div>
        <div className="qcf-win2" style={{ padding: '8px 10px', fontSize: 12, borderTop: '1px solid var(--qcf-line)' }}>
          <b>Never miss a post:</b>{' '}
          <a href="https://x.com/usetesserai" rel="noopener noreferrer">
            follow @usetesserai
          </a>{' '}
          (every issue is posted there first) or subscribe by <a href="/articles/feed.xml">RSS</a> in any reader.
        </div>
        <div className="qcf-win2" style={{ padding: '4px 10px 10px', fontSize: 12 }}>
          <Quote from="Come-from-Beyond on 06.10.2012">We&apos;ll get rid of all weaknesses one by one</Quote>
        </div>
      </div>
    </ForumShell>
  )
}
