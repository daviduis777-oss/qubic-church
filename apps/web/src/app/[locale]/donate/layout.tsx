import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Donate: Support the Atrium',
  description: 'Donations go to the Atrium, the Qubic Church incubator for projects that make the world better. Send QUBIC to support it.',
  alternates: { canonical: `${SITE_URL}/donate` },
  openGraph: { type: 'website', url: `${SITE_URL}/donate`, title: 'Donate: Support the Atrium', description: 'Donations go to the Atrium, the Qubic Church incubator for projects that make the world better. Send QUBIC to support it.' },
}

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return children
}
