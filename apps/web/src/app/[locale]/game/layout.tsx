import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anna Matrix Game | Qubic Church',
  description:
    'An interactive game set in the 128x128 Anna Matrix. Explore its zones, collect patterns and score points.',
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
