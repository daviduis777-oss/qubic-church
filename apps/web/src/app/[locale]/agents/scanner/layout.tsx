import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anna Matrix Scanner | Qubic Church',
  description:
    'Immersive 3D scanner that traverses the 128x128 Anna Matrix, discovering Bitcoin addresses and visualizing energy hotspots in real time.',
}

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
