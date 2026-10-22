import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Donate: Support Independent Research',
  description: 'Support Qubic Church independent AGI research with a QUBIC donation.',
  alternates: { canonical: `${SITE_URL}/donate` },
  openGraph: { type: 'website', url: `${SITE_URL}/donate`, title: 'Donate: Support Independent Research', description: 'Support Qubic Church independent AGI research with a QUBIC donation.' },
}

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return children
}
