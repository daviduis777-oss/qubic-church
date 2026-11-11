import type { Metadata } from 'next'
import Link from 'next/link'
import { jsonLd } from '@/lib/json-ld'
import { SITE_URL } from '@/lib/books'
import { ogFor } from '@/lib/og-pages'
import { type Answer, answerBySlug, answerUrl } from '@/lib/answers'

const OG: Record<string, 'about' | 'cfb' | 'nfts'> = { 'what-is-qubic': 'about', 'who-is-come-from-beyond': 'cfb', 'what-is-anna-aigarth': 'nfts', 'what-is-aigarth': 'about' }
const T = {
  en: { eyebrow: 'Short answer', facts: 'Key facts', read: 'Read further on qubic.church', faq: 'Questions people ask', sources: 'Sources', by: 'By QC, Qubic Church', updated: 'Updated', date: 'en-GB' },
}

export function answerMetadata(slug: string): Metadata {
  const a = answerBySlug(slug)!, url = answerUrl(a), og = ogFor(OG[slug] ?? 'about', a.question)
  return {
    title: { absolute: a.title }, description: a.description,
    alternates: { canonical: url },
    openGraph: { type: 'article', title: a.title, description: a.description, url, locale: 'en_US', images: og.images },
    twitter: og.twitter,
  }
}

/** [text](url) inside a paragraph: internal links stay in the site, external ones open safely. */
function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = []; const re = /\[([^\]]+)\]\(([^)]+)\)/g; let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const [, label, href] = m as unknown as [string, string, string]
    out.push(href.startsWith('/') ? <Link className="text-gold underline-offset-4 hover:underline" href={href} key={i++}>{label}</Link>
      : <a className="text-gold underline-offset-4 hover:underline" href={href} key={i++} rel="noopener" target="_blank">{label}</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}
const plain = (t: string) => t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')

export function AnswerPage({ slug }: { slug: string }) {
  const a = answerBySlug(slug) as Answer, t = T[a.lang], url = answerUrl(a)
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: a.question, description: a.description, inLanguage: a.lang,
    url, mainEntityOfPage: url, dateModified: a.updated, datePublished: a.updated,
    author: { '@id': `${SITE_URL}/#qc` }, publisher: { '@id': `${SITE_URL}/#org` },
    about: a.entity, abstract: a.answer.map(plain).join(' '),
    citation: a.sources.map(s => (s.href.startsWith('/') ? SITE_URL + s.href : s.href)),
  }
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: a.lang, mainEntity: a.faq.map(([q, ans]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain(ans) } })) }
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Qubic Church', item: SITE_URL }, { '@type': 'ListItem', position: 2, name: a.question, item: url }] }
  return (
    <article className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:px-6 md:pt-16" lang={a.lang}>
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: jsonLd(faqLd) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }} type="application/ld+json" />
      <header>
        <p className="eyebrow text-gold">{t.eyebrow}</p>
        <h1 className="mt-3 font-display text-[clamp(2.25rem,11vw,3rem)] leading-[0.95] [hyphens:auto] [overflow-wrap:anywhere] md:text-7xl">{a.question}</h1>
        <div className="mt-8 space-y-4 font-serif text-xl leading-relaxed text-foreground/90">
          {a.answer.map((p, i) => <p className={i === 0 ? 'text-2xl leading-snug text-foreground' : ''} key={i}><Rich text={p} /></p>)}
        </div>
      </header>

      <section aria-labelledby="facts" className="mt-12 border-t border-border pt-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-gold" id="facts">{t.facts}</h2>
        <dl className="mt-5 grid gap-px border border-border bg-border sm:grid-cols-[minmax(9rem,13rem)_1fr]">
          {a.facts.map(([k, v]) => [
            <dt className="bg-background px-4 pt-3 text-sm font-semibold text-fg-2 sm:py-3" key={k + 'k'}>{k}</dt>,
            <dd className="bg-background px-4 pb-3 text-base sm:py-3" key={k + 'v'}>{v}</dd>,
          ])}
        </dl>
      </section>

      {a.sections.map((s, i) => (
        <section aria-labelledby={`s${i}`} className="mt-12 border-t border-border pt-8" key={s.h}>
          <h2 className="text-3xl font-semibold leading-tight" id={`s${i}`}>{s.h}</h2>
          <div className="mt-5 space-y-4 font-serif text-lg leading-relaxed text-foreground/90">{s.p.map((p, j) => <p key={j}><Rich text={p} /></p>)}</div>
        </section>
      ))}

      <section aria-labelledby="read" className="mt-12 border-t border-border pt-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-gold" id="read">{t.read}</h2>
        <ul className="mt-5 grid gap-2">
          {a.read.map(r => <li key={r.href}><Link className="text-lg text-gold underline-offset-4 hover:underline" href={r.href}>{r.label}</Link></li>)}
        </ul>
      </section>

      <section aria-labelledby="faq" className="mt-12 border-t border-border pt-8">
        <h2 className="text-3xl font-semibold leading-tight" id="faq">{t.faq}</h2>
        <div className="mt-5 divide-y divide-border border-y border-border">
          {a.faq.map(([q, ans]) => (
            <details className="group py-4" key={q}>
              <summary className="cursor-pointer list-none text-lg font-semibold marker:hidden">{q}</summary>
              <p className="mt-2 font-serif text-lg leading-relaxed text-foreground/90"><Rich text={ans} /></p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="src" className="mt-12 border-t border-border pt-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-gold" id="src">{t.sources}</h2>
        <ol className="mt-5 list-decimal space-y-1 pl-5 text-base text-fg-2">
          {a.sources.map(s => <li key={s.href}>{s.href.startsWith('/') ? <Link className="hover:text-gold" href={s.href}>{s.label}</Link> : <a className="hover:text-gold" href={s.href} rel="noopener" target="_blank">{s.label}</a>}</li>)}
        </ol>
        <p className="mt-8 text-sm text-fg-2">{t.by} · {t.updated} <time dateTime={a.updated}>{new Date(a.updated).toLocaleDateString(t.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
      </section>
    </article>
  )
}
