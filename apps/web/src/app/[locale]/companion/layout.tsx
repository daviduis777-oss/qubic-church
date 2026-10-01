import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anna Matrix Companion: Forensic Appendix | Qubic Church',
  description:
    'A 41-page appendix to Chapter 13 of Qubic, The Long Version, with Python snippets. Most of its claims were withdrawn in September 2026; the page lists which.',
}

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return children
}
