import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anna Matrix Companion — Forensic Appendix | Qubic Church',
  description:
    'A 41-page forensic appendix to Chapter 13 of Qubic — The Long Version. Three confidence tiers, copy-paste Python verification, 22,480 hypotheses tested, 10 confirmed.',
}

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return children
}
