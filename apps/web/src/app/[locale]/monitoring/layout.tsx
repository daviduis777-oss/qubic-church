import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Network Monitor',
  description:
    'Real-time Qubic network statistics, price tracking, epoch progress, mining profitability calculator, and address watchlist.',
  alternates: { canonical: `${SITE_URL}/monitoring` },
  openGraph: { type: 'website', url: `${SITE_URL}/monitoring`, title: 'Network Monitor', description: 'Real-time Qubic network statistics, price tracking, epoch progress, mining profitability calculator, and address watchlist.' },
}

export default function MonitoringLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
