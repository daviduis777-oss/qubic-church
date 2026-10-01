import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Qubic | Qubic Church',
  description:
    'Step-by-step guide to buying QUBIC tokens, setting up a wallet, and joining the Qubic Church community.',
}

export default function GetQubicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
