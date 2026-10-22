import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Rarity Codex: Anna Aigarth Collection',
  description: '200 tokens, 5 trait layers, ranked by emergence. Explore the complete rarity analysis of the Anna Aigarth NFT collection.',
  alternates: { canonical: `${SITE_URL}/rarity-codex` },
  openGraph: { type: 'website', url: `${SITE_URL}/rarity-codex`, title: 'Rarity Codex: Anna Aigarth Collection', description: '200 tokens, 5 trait layers, ranked by emergence. Explore the complete rarity analysis of the Anna Aigarth NFT collection.' },
}

export default function RarityCodexLayout({ children }: { children: React.ReactNode }) {
  return children
}
