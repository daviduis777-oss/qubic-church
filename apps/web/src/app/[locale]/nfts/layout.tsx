import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Anna Aigarth NFT collection',
  description:
    'The Anna Aigarth collection: 200 NFTs ranked by the Rarity Codex. Each Anna gives its holder the status of a founder of Qubic Church.',
  alternates: { canonical: `${SITE_URL}/nfts` },
  openGraph: { type: 'website', url: `${SITE_URL}/nfts`, title: 'Anna Aigarth NFT collection', description: 'The Anna Aigarth collection: 200 NFTs ranked by the Rarity Codex. Each Anna gives its holder the status of a founder of Qubic Church.' },
}

export default function NFTsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
