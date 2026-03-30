import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Books — Qubic, The Long Version | Qubic Church',
  description:
    'Qubic — The Long Version: a free 200-page book by Qubic Church on the history, mechanics, and meaning of Qubic. With English and Russian editions and the Anna Matrix Companion forensic appendix.',
}

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return children
}
