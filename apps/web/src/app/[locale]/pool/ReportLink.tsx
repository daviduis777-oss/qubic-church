'use client'

import { MessageSquareWarning } from 'lucide-react'
import { OPEN_APP_EVENT, type OpenApp } from '@/lib/pool/qc'

/**
 * "Report a bug, idea or update": brings Maria's phone into view and opens its Report app. A link to
 * /pool#report does the same from anywhere: the phone opens the Report app when the page loads with it.
 */
export function ReportLink({ className }: { className?: string }) {
  return (
    <button
      className={className}
      onClick={() => {
        const phone = document.getElementById('maria-phone')
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        phone?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
        window.dispatchEvent(new CustomEvent<OpenApp>(OPEN_APP_EVENT, { detail: { app: 'report', from: 'page' } }))
      }}
      type="button"
    >
      <MessageSquareWarning aria-hidden size={15} strokeWidth={1.8} />
      Report a bug, idea or update
    </button>
  )
}
