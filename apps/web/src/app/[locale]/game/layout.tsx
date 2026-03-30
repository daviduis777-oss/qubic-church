import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anna Matrix Game | Qubic Church',
  description:
    'Navigate the 128x128 neural network in this interactive RPG. Discover hidden patterns and earn rewards as you explore the Anna Matrix.',
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
