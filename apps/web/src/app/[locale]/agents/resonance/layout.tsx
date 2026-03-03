import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resonance Engine | Qubic Church',
  description:
    'Compute ternary resonance through the 128x128 Anna Matrix. Oracle mode, single analysis, comparison, and batch processing.',
}

export default function ResonanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
