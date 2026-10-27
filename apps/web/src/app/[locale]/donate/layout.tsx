import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'
import { ogFor } from '@/lib/og-pages'

export const metadata: Metadata = {
  title: 'Donate: Support the Atrium',
  description: 'Donations go to the Atrium, the Qubic Church incubator for projects that make the world better. Send QUBIC to support it.',
  alternates: { canonical: `${SITE_URL}/donate` },
  openGraph: { type: 'website', url: `${SITE_URL}/donate`, title: 'Donate: Support the Atrium', description: 'Donations go to the Atrium, the Qubic Church incubator for projects that make the world better. Send QUBIC to support it.', images: ogFor('donate').images },
  twitter: ogFor('donate').twitter,
}

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return children
}
