import type { Metadata } from 'next'
import { ogFor } from '@/lib/og-pages'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Network Monitor',
  description:
    'Real-time Qubic network statistics: ticks, epoch progress, supply and an address watchlist.',
  alternates: { canonical: `${SITE_URL}/monitoring` },
  openGraph: { type: 'website', url: `${SITE_URL}/monitoring`, title: 'Network Monitor', description: 'Real-time Qubic network statistics: ticks, epoch progress, supply and an address watchlist.', images: ogFor('monitor').images },
  twitter: ogFor('monitor').twitter,
}

export default function MonitoringLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
