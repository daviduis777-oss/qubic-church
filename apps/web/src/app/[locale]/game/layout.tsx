import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Anna Matrix Game',
  description:
    'An interactive game set in the 128x128 Anna Matrix. Explore its zones, collect patterns and score points.',
  alternates: { canonical: `${SITE_URL}/game` },
  openGraph: { type: 'website', url: `${SITE_URL}/game`, title: 'Anna Matrix Game', description: 'An interactive game set in the 128x128 Anna Matrix. Explore its zones, collect patterns and score points.' },
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
