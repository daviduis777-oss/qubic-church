import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { locales } from '@/config/i18n'
import { SITE_URL } from '@/lib/books'
import { jsonLd } from '@/lib/json-ld'
import { seoDescription, seoTitle, seoTitleText } from '@/lib/seo'
import { CFB_ARTICLES, archiveId, archivedUrl, formatArchiveDate, getArchiveEntry } from '@/lib/archive'
import { memberOf } from '@/lib/forum'
import { ForumShell, Postbit } from '@/components/church/forum/ForumUI'

export function generateStaticParams() {
  return locales.flatMap(locale => CFB_ARTICLES.map(a => ({ locale, id: archiveId(a) })))
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const a = getArchiveEntry(id)
  if (!a) return {}
  const url = `${SITE_URL}/articles/cfb/${id}`
  return {
    title: seoTitle(`${a.title} · Come-from-Beyond`),
    description: seoDescription(a.summary),
    alternates: { canonical: url },
    openGraph: { type: 'article', title: seoTitleText(a.title), description: seoDescription(a.summary), url },
  }
}

export default async function CfbArchivePage(props: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await props.params
  setRequestLocale(locale)
  const a = getArchiveEntry(id)
  if (!a) notFound()
  const i = CFB_ARTICLES.indexOf(a)
  const newer = CFB_ARTICLES[i - 1]
  const older = CFB_ARTICLES[i + 1]
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.summary,
    datePublished: a.date,
    url: a.url,
    mainEntityOfPage: `${SITE_URL}/articles/cfb/${id}`,
    author: { '@type': 'Person', name: 'Come-from-Beyond', url: 'https://x.com/c___f___b' },
    keywords: a.tags.join(', '),
    isPartOf: { '@type': 'Collection', name: 'Qubic Church: archive of Come-from-Beyond', url: `${SITE_URL}/articles` },
  }
  const m = memberOf('Come-from-Beyond')
  return (
    <ForumShell
      crumbs={[
        { label: 'Qubic Church Forum', href: '/articles' },
        { label: "Founder's Archive", href: '/articles/board/founder' },
        { label: a.title },
      ]}
    >
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <div className="qcf-box">
        <div className="qcf-cat">🔒︎ Topic: {a.title} (read only)</div>
        <table>
          <tbody>
            <tr className="qcf-win qcf-stack">
              <td className="qcf-postbit">{m && <Postbit m={m} />}</td>
              <td>
                <div className="qcf-small qcf-muted" style={{ borderBottom: '1px solid var(--qcf-line)', paddingBottom: 6, marginBottom: 10 }}>
                  <h1 className="qcf-strong" style={{ fontSize: 14, color: 'var(--qcf-text)' }}>
                    {a.title}
                  </h1>
                  « on: {formatArchiveDate(a.date)} » · {a.platform} · primary source · weight 3
                </div>
                <div className="qcf-post">
                  <p>{a.summary}</p>
                  {a.tags.length > 0 && <p className="qcf-small qcf-muted">Tags: {a.tags.join(', ')}</p>}
                  <p>
                    <a className="qcf-btn qcf-btn-main" href={a.url} rel="noopener noreferrer">
                      Read the full article on {a.platform}
                    </a>{' '}
                    <a className="qcf-btn" href={archivedUrl(a.url)} rel="noopener noreferrer">
                      Archived copy
                    </a>
                  </p>
                  {a.shared && a.shared.length > 0 && (
                    <>
                      <h3>He shared it on X</h3>
                      <ul style={{ paddingLeft: 18, listStyle: 'disc', margin: '0 0 12px' }}>
                        {a.shared.map(s => (
                          <li key={s.url}>
                            <a href={s.url} rel="noopener noreferrer">
                              {formatArchiveDate(s.date)}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <div className="qcf-sig">
                  The text belongs to Come-from-Beyond and lives at the original link. This topic keeps its date, a short summary in
                  our words, and a preserved copy, so it can always be found.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="qcf-box">
        <table>
          <tbody>
            <tr className="qcf-win2">
              <td style={{ width: '50%' }}>
                {older ? (
                  <>
                    <span className="qcf-small qcf-muted">« earlier topic</span>
                    <br />
                    <Link href={`/articles/cfb/${archiveId(older)}`}>{older.title}</Link>
                  </>
                ) : (
                  <span className="qcf-small qcf-muted">This is the first topic in the archive.</span>
                )}
              </td>
              <td style={{ textAlign: 'right' }}>
                {newer ? (
                  <>
                    <span className="qcf-small qcf-muted">later topic »</span>
                    <br />
                    <Link href={`/articles/cfb/${archiveId(newer)}`}>{newer.title}</Link>
                  </>
                ) : (
                  <span className="qcf-small qcf-muted">This is the latest topic in the archive.</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ForumShell>
  )
}
