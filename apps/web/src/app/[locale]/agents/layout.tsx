import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discovery Engine | Qubic Church',
  description:
    'AI-powered pattern discovery and treasure hunting through the Anna Matrix with blockchain verification.',
}

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
