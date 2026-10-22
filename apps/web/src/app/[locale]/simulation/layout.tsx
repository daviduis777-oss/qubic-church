import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Future Simulation: MiroFish Swarm Intelligence',
  description:
    'AI swarm simulation predicting community reaction to Qubic Dogecoin mining launch. 100 agents, 1,370 interactions, 4 scenarios analyzed.',
  alternates: { canonical: `${SITE_URL}/simulation` },
  openGraph: { type: 'website', url: `${SITE_URL}/simulation`, title: 'Future Simulation: MiroFish Swarm Intelligence', description: 'AI swarm simulation predicting community reaction to Qubic Dogecoin mining launch. 100 agents, 1,370 interactions, 4 scenarios analyzed.' },
}

export default function SimulationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
