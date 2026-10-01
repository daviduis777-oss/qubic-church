import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Come-from-Beyond Dossier | Qubic Church',
  description:
    'An archive of eras, personas, and technological milestones from Come-from-Beyond: founder of Qubic, creator of NXT, IOTA co-founder.',
}

export default function CfbLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
