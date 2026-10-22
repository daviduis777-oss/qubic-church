'use client'

import { useState } from 'react'

export function CiteBox({ apa, md }: { apa: string; md: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <aside aria-label="How to cite" className="mt-16 border border-border bg-card p-5">
      <p className="eyebrow mb-2 text-gold">How to cite this chapter</p>
      <p className="font-mono text-xs leading-relaxed text-fg-2">{apa}</p>
      <div className="mt-3 flex gap-2">
        <button
          className="inline-flex h-9 items-center border border-border px-3 text-xs text-fg-2 hover:text-foreground"
          onClick={() => {
            navigator.clipboard?.writeText(apa).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
          type="button"
        >
          {copied ? 'Copied' : 'Copy citation'}
        </button>
        <a className="inline-flex h-9 items-center px-3 text-xs text-fg-2 hover:text-foreground" href={md}>
          Plain text (.md)
        </a>
      </div>
    </aside>
  )
}
