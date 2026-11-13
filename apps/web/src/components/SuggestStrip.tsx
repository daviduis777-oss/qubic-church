'use client'

import Link from 'next/link'
import { usePathname } from '@/navigation'

/** Pages where the line would be noise: the form itself and the private ones. */
const SKIP = /^\/(?:(?:en|ru|pt)(?=\/|$))?\/?(?:suggest|mod|me|pool|lab|account)(?:\/|$)/

/**
 * One quiet line above the footer on every page: found a mistake, have an idea? It opens /suggest with the page
 * it came from, so the moderator sees what the message is about.
 */
export function SuggestStrip() {
  const path = usePathname() || '/'
  if (SKIP.test(path)) return null
  return (
    <aside aria-label="Suggest" className="relative z-10 mx-auto mt-16 max-w-5xl px-4 sm:px-6">
      <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 border-y border-border py-5 text-center text-[15px] text-fg-2">
        <span>Found a mistake on this page, or have an idea?</span>
        <Link className="font-medium text-gold underline-offset-4 hover:underline" href={`/suggest?from=${encodeURIComponent(path)}`} prefetch={false}>
          Tell us
        </Link>
      </p>
    </aside>
  )
}
