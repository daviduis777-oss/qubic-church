import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NFT Gallery | Qubic Church',
  description:
    'Browse all 200 Anna NFTs with filtering by rarity, search, and detailed views.',
}

export default function NFTsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
