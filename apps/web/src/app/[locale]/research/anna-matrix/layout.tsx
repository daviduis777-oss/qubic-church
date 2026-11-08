import type { Metadata } from 'next'
import { ogFor } from '@/lib/og-pages'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Anna Matrix Research Lab',
  description:
    'Explore the 128 × 128 Anna Matrix, a table of the Anna bot’s answers, with interactive visualization, cell analysis and research tools.',
  alternates: { canonical: `${SITE_URL}/research/anna-matrix` },
  openGraph: { type: 'website', url: `${SITE_URL}/research/anna-matrix`, title: 'Anna Matrix Research Lab', description: 'Explore the 128 × 128 Anna Matrix, a table of the Anna bot’s answers, with interactive visualization, cell analysis and research tools.', images: ogFor('matrix').images },
  twitter: ogFor('matrix').twitter,
}

export default function AnnaMatrixLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
