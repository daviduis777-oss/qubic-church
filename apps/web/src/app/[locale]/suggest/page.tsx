import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { SuggestForm } from '@/components/suggest/SuggestForm'
import { PageHeader } from '@/components/ui/page-header'
import { jsonLd } from '@/lib/json-ld'
import { SUGGEST_DESCRIPTION, SUGGEST_FAQ, SUGGEST_MD_URL, SUGGEST_TITLE, SUGGEST_URL, suggestLd } from '@/lib/suggest-text'

const OG = 'https://qubic.church/og-qubic-church.jpg'

export const metadata: Metadata = {
  title: { absolute: SUGGEST_TITLE },
  description: SUGGEST_DESCRIPTION,
  alternates: { canonical: SUGGEST_URL, types: { 'text/markdown': SUGGEST_MD_URL } },
  openGraph: {
    type: 'website',
    url: SUGGEST_URL,
    title: SUGGEST_TITLE,
    description: SUGGEST_DESCRIPTION,
    images: [{ url: OG, width: 1200, height: 630, alt: 'Qubic Church' }],
  },
  twitter: { card: 'summary_large_image', title: SUGGEST_TITLE, description: SUGGEST_DESCRIPTION, images: [OG] },
}

/** Suggest: anyone can send an idea, an update, a tool, a review or a bug. The moderator tracks them at /mod. */
export default async function SuggestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <div className="min-h-screen pb-16">
      {suggestLd().map((d, i) => (
        <script dangerouslySetInnerHTML={{ __html: jsonLd(d) }} key={i} type="application/ld+json" />
      ))}
      <PageHeader
        eyebrow="Suggest"
        lede="An idea for the site, a fact that is out of date, a tool you would use, or what you think of it all. No account needed."
        title="Suggest an idea, an update or a tool"
      />
      <div className="mx-auto w-full max-w-2xl space-y-14 px-4 sm:px-6">
        <SuggestForm />
        <section aria-labelledby="suggest-faq" className="space-y-6">
          <h2 className="eyebrow text-muted-foreground" id="suggest-faq">
            What happens to it
          </h2>
          <dl className="space-y-5">
            {SUGGEST_FAQ.map(f => (
              <div key={f.q}>
                <dt className="font-medium text-foreground">{f.q}</dt>
                <dd className="mt-1 leading-relaxed text-fg-2">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
