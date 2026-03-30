import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Future Simulation — MiroFish Swarm Intelligence | Qubic Church',
  description:
    'AI swarm simulation predicting community reaction to Qubic Dogecoin mining launch. 100 agents, 1,370 interactions, 4 scenarios analyzed.',
}

export default function SimulationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
