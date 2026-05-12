'use client'

import type { ReactNode } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

/**
 * Lazy-loaded KaTeX container. Imported via `next/dynamic` from ExplainPanel
 * so the ~120 KB KaTeX bundle only ships when a visitor opens the Math tab.
 */
export default function MathView({ children }: { children: ReactNode }) {
  return <div className="space-y-3 [&_.katex]:text-white/85">{children}</div>
}

export { BlockMath, InlineMath }
