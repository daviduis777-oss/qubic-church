import type { Metadata } from 'next'
import { ogFor } from '@/lib/og-pages'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Anna Matrix Companion: Forensic Appendix',
  description:
    'A 41-page appendix to Chapter 13 of Qubic, The Long Version, with Python snippets. Most of its claims were not confirmed by the September 2026 re-check and stay open; the page lists which.',
  alternates: { canonical: `${SITE_URL}/companion` },
  openGraph: { type: 'website', url: `${SITE_URL}/companion`, title: 'Anna Matrix Companion: Forensic Appendix', description: 'A 41-page appendix to Chapter 13 of Qubic, The Long Version, with Python snippets. Most of its claims were not confirmed by the September 2026 re-check and stay open; the page lists which.', images: ogFor('companion').images },
  twitter: ogFor('companion').twitter,
}

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return children
}
