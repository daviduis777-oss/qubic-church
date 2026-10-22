import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Get Qubic',
  description:
    'Step-by-step guide to buying QUBIC tokens, setting up a wallet, and joining the Qubic Church community.',
  alternates: { canonical: `${SITE_URL}/get-qubic` },
  openGraph: { type: 'website', url: `${SITE_URL}/get-qubic`, title: 'Get Qubic', description: 'Step-by-step guide to buying QUBIC tokens, setting up a wallet, and joining the Qubic Church community.' },
}

export default function GetQubicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
