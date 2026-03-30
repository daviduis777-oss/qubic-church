import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Donate — Support Independent Research | Qubic Church',
  description: 'Support Qubic Church independent AGI research with a QUBIC donation.',
}

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return children
}
