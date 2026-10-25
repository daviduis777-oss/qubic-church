'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Horizontal, snap-scrolling row of issue cards. The cards are rendered on the
 * server (children), so crawlers see every issue; only the arrows need JavaScript.
 */
export function IssueCarousel({ children, count }: { children: ReactNode; count: number }) {
  const ref = useRef<HTMLOListElement>(null)
  const [at, setAt] = useState({ start: true, end: false })

  const update = () => {
    const el = ref.current
    if (!el) return
    setAt({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }

  useEffect(() => {
    update()
    const el = ref.current
    el?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const go = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    const card = el.querySelector('li')
    const step = card ? card.getBoundingClientRect().width + 1 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step * (window.innerWidth >= 768 ? 2 : 1), behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <ol
        aria-label={`${count} topics`}
        className="-mx-4 flex snap-x snap-mandatory gap-px overflow-x-auto border-y border-border bg-border px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:border sm:px-0 [&::-webkit-scrollbar]:hidden"
        ref={ref}
      >
        {children}
      </ol>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-fg-2">Scroll for all {count} topics</p>
        <div className="flex gap-1">
          <button
            aria-label="Previous topics"
            className="inline-flex size-10 items-center justify-center border border-border text-fg-2 hover:text-foreground disabled:opacity-30"
            disabled={at.start}
            onClick={() => go(-1)}
            type="button"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            aria-label="Next topics"
            className="inline-flex size-10 items-center justify-center border border-border text-fg-2 hover:text-foreground disabled:opacity-30"
            disabled={at.end}
            onClick={() => go(1)}
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
