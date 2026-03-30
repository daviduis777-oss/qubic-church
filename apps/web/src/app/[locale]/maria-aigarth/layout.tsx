import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maria Aigarth — The Arbiter | Qubic Church',
  description:
    'Fractal Rationalism as a Computational Framework. Maria Aigarth is the first operational test of an architecturally impartial AI arbiter deployed on X/Twitter.',
  openGraph: {
    title: 'Maria Aigarth — The Arbiter',
    description:
      'An autonomous AI agent testing whether structural impartiality is achievable through decentralised intelligence.',
  },
}

export default function MariaAigarthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
