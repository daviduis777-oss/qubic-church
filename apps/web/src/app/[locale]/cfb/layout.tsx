import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/books'

export const metadata: Metadata = {
  title: 'Come-from-Beyond Dossier',
  description:
    'An archive of eras, personas, and technological milestones from Come-from-Beyond: founder of Qubic, creator of NXT, IOTA co-founder.',
  alternates: { canonical: `${SITE_URL}/cfb` },
  openGraph: { type: 'website', url: `${SITE_URL}/cfb`, title: 'Come-from-Beyond Dossier', description: 'An archive of eras, personas, and technological milestones from Come-from-Beyond: founder of Qubic, creator of NXT, IOTA co-founder.' },
}

export default function CfbLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
