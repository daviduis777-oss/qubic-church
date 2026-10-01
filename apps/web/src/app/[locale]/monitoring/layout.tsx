import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Network Monitor | Qubic Church',
  description:
    'Real-time Qubic network statistics, price tracking, epoch progress, mining profitability calculator, and address watchlist.',
}

export default function MonitoringLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
