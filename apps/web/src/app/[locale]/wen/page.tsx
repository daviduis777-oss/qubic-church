import type { Metadata } from 'next'
import { WhenApp } from '@/components/when/WhenApp'
import { SITE_URL } from '@/lib/books'

const TITLE = 'WEN? Every date that matters for Qubic and Aigarth'
const DESCRIPTION =
  'The live feed test on 18 November 2026, qualification by accuracy on 25 November, The Day on 13 April 2027, and every milestone back to 2021: Oracle Machines, Outsourced Computing, Monero, Dogecoin, halvings, the science. Each with its source and Come-from-Beyond in his own words.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/wen` },
  openGraph: { type: 'website', url: `${SITE_URL}/wen`, title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/** The roadmap and the tracker of moments: what is coming on top, everything that happened below. */
export default function WenPage() {
  return <WhenApp />
}
