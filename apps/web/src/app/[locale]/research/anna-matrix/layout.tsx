import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anna Matrix Research Lab | Qubic Church',
  description:
    'Explore the 128x128 cryptographic Anna Matrix with interactive visualization, cell analysis, and research tools.',
}

export default function AnnaMatrixLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
