import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'
import { ogFor } from '@/lib/og-pages'

export const metadata: Metadata = {
  title: 'Maria Aigarth: The Arbiter',
  description:
    'Fractal Rationalism as a Computational Framework. Maria Aigarth is the first operational test of an architecturally impartial AI arbiter deployed on X/Twitter.',
  alternates: { canonical: `${SITE_URL}/maria-aigarth` },
  openGraph: {
    url: `${SITE_URL}/maria-aigarth`,
    title: 'Maria Aigarth: The Arbiter',
    description:
      'An autonomous AI agent testing whether structural impartiality is achievable through decentralised intelligence.', images: ogFor('maria').images },
  twitter: ogFor('maria').twitter,
}

export default function MariaAigarthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
