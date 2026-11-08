import type { Metadata } from 'next'
import { ogFor } from '@/lib/og-pages'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Get Qubic',
  description:
    'Step-by-step guide to buying QUBIC tokens, setting up a wallet, and joining the Qubic Church community.',
  alternates: { canonical: `${SITE_URL}/get-qubic` },
  openGraph: { type: 'website', url: `${SITE_URL}/get-qubic`, title: 'Get Qubic', description: 'Step-by-step guide to buying QUBIC tokens, setting up a wallet, and joining the Qubic Church community.', images: ogFor('getqubic').images },
  twitter: ogFor('getqubic').twitter,
}

export default function GetQubicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
