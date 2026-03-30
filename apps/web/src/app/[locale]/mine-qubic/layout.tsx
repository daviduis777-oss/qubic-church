import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mine Qubic | Qubic Church',
  description:
    'Learn how to mine Qubic using Useful Proof of Work. Compare hardware, choose a pool, and start earning QUBIC while training AI.',
}

export default function MineQubicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
