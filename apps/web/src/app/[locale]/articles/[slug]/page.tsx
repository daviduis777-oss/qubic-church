import type { Metadata } from 'next'
import { seoDescription, seoTitle, seoTitleText } from '@/lib/seo'
import { jsonLd } from '@/lib/json-ld'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { locales } from '@/config/i18n'
import { SITE_URL } from '@/lib/books'
import { ARTICLES, articleKeywords, articleMinutes, articleUrl, articleWeight, authorUrl, formatDate, getArticle, issueNumber } from '@/lib/articles'
import { memberOf } from '@/lib/forum'
import { ForumShell, Postbit, Quote } from '@/components/church/forum/ForumUI'

export function generateStaticParams() {
  return locales.flatMap(locale => ARTICLES.map(a => ({ locale, slug: a.slug })))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params
  const a = getArticle(slug)
  if (!a) return {}
  return {
    title: seoTitle(a.title),
    description: seoDescription(a.summary),
    alternates: { canonical: articleUrl(a) },
    authors: [{ name: a.author, url: authorUrl(a) }],
    openGraph: { type: 'article', title: seoTitleText(a.title), description: seoDescription(a.summary), url: articleUrl(a), publishedTime: a.date },
  }
}

export default async function ArticlePage(props: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await props.params
  setRequestLocale(locale)
  const a = getArticle(slug)
  if (!a) notFound()
  const i = ARTICLES.indexOf(a)
  const newer = ARTICLES[i - 1]
  const older = ARTICLES[i + 1]

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.summary,
    datePublished: a.date,
    url: articleUrl(a),
    wordCount: a.words,
    inLanguage: 'en',
    author: a.guest ? { '@type': 'Person', name: a.author, url: authorUrl(a), sameAs: [authorUrl(a)] } : { '@type': 'Organization', name: 'TesserAI', url: 'https://x.com/usetesserai', sameAs: ['https://x.com/usetesserai'] },
    keywords: articleKeywords(a).join(', '),
    articleSection: 'Articles',
    isPartOf: { '@type': 'CreativeWorkSeries', name: 'Qubic Church: Articles', url: `${SITE_URL}/articles` },
    position: issueNumber(a),
    publisher: { '@id': `${SITE_URL}/#org` },
    isBasedOn: a.url,
    about: [
      { '@type': 'Thing', name: 'Qubic' },
      { '@type': 'Thing', name: 'Aigarth' },
      { '@type': 'Person', name: 'Come-from-Beyond', alternateName: 'Sergey Ivancheglo' },
    ],
  }

  const m = memberOf(a.author)
  const boardName = a.guest ? 'Open Board' : 'Aigarth Chronicle'
  const boardId = a.guest ? 'open' : 'chronicle'

  return (
    <ForumShell
      crumbs={[
        { label: 'Qubic Church Forum', href: '/articles' },
        { label: boardName, href: `/articles/board/${boardId}` },
        { label: a.title },
      ]}
    >
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <div className="qcf-box">
        <div className="qcf-cat">
          Topic: {a.title} {a.kicker ? `· ${a.kicker}` : ''} (No. {issueNumber(a)}
          {a.guest ? ', guest issue' : ''})
        </div>
        <table>
          <tbody>
            <tr className="qcf-win qcf-stack">
              <td className="qcf-postbit">{m && <Postbit m={m} />}</td>
              <td>
                <div className="qcf-small qcf-muted" style={{ borderBottom: '1px solid var(--qcf-line)', paddingBottom: 6, marginBottom: 10 }}>
                  <h1 className="qcf-strong" style={{ fontSize: 14, color: 'var(--qcf-text)' }}>
                    {a.title}
                  </h1>
                  « on: {formatDate(a.date)} » · {articleMinutes(a)} min read · weight {articleWeight(a)}
                  {a.mariaRepost && (
                    <>
                      {' · '}
                      <a href={a.mariaRepost} rel="noopener noreferrer">
                        reposted by Maria
                      </a>
                    </>
                  )}
                  {' · '}
                  <a href={a.url} rel="noopener noreferrer">
                    original on X
                  </a>
                </div>
                <div className="qcf-post">
                  {a.blocks.map((b, k) =>
                    b.t === 'h' ? (
                      <h3 key={k}>{b.text}</h3>
                    ) : b.t === 'quote' ? (
                      <Quote from={b.cite} key={k}>
                        {b.text}
                      </Quote>
                    ) : (
                      <p key={k}>{b.text}</p>
                    ),
                  )}
                </div>
                {m?.signature && <div className="qcf-sig">{m.signature}</div>}
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
                    <span className="qcf-small qcf-muted">« previous topic</span>
                    <br />
                    <Link href={`/articles/${older.slug}`}>{older.title}</Link>
                  </>
                ) : (
                  <span className="qcf-small qcf-muted">This is the first topic.</span>
                )}
              </td>
              <td style={{ textAlign: 'right' }}>
                {newer ? (
                  <>
                    <span className="qcf-small qcf-muted">next topic »</span>
                    <br />
                    <Link href={`/articles/${newer.slug}`}>{newer.title}</Link>
                  </>
                ) : (
                  <>
                    <span className="qcf-small qcf-muted">go deeper »</span>
                    <br />
                    <Link href="/books">Read the books, free</Link>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="qcf-small qcf-muted" style={{ margin: '10px 2px' }}>
        Plain-text version for researchers and AI systems: <a href={`/text/articles/${a.slug}.md`}>/text/articles/{a.slug}.md</a>
      </p>
    </ForumShell>
  )
}
