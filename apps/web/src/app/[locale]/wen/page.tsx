import type { Metadata } from 'next'
import { WhenApp } from '@/components/when/WhenApp'
import { jsonLd } from '@/lib/json-ld'
import { WEN_MD_URL, WEN_URL, wenLd } from '@/lib/when-text'

const TITLE = 'WEN? Every date that matters for Qubic and Aigarth'
const DESCRIPTION =
  'The live BTC feed test on 18 November 2026, qualification by prediction accuracy on 25 November, The Day on 13 April 2027, and every milestone back to 2021: Oracle Machines, Outsourced Computing, Monero, Dogecoin, halvings, the science. Each with its source and Come-from-Beyond in his own words.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: WEN_URL, types: { 'text/markdown': WEN_MD_URL } },
  openGraph: { type: 'website', url: WEN_URL, title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export const revalidate = 3600

/** The roadmap and the tracker of moments: what is coming on top, everything that happened below. */
export default function WenPage() {
  return (
    <>
      {wenLd().map((d, i) => (
        <script dangerouslySetInnerHTML={{ __html: jsonLd(d) }} key={i} type="application/ld+json" />
      ))}
      <WhenApp />
    </>
  )
}
