import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Books: The Qubic Church Library',
  description:
    'The Qubic Church Library: two free books. Qubic, The Long Version (English, German, Russian) on the history, mechanics, and meaning of Qubic, and Come-from-Beyond, a biography of the man behind Qubic. Read in the browser or download the PDFs.',
}

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return children
}
