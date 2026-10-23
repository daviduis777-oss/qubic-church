'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { HelpCircle, Quote as QuoteIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Verbatim quote with its source. Quotes on this page are copied word for word. */
export function Quote({
  children,
  source,
  href,
  className,
}: {
  children: ReactNode
  source: string
  href?: string
  className?: string
}) {
  return (
    <figure className={cn('relative border-l-2 border-gold/60 bg-white/[0.03] py-4 pl-5 pr-4', className)}>
      <QuoteIcon aria-hidden="true" className="absolute right-3 top-3 size-4 text-gold/30" />
      <blockquote className="font-serif text-lg leading-relaxed text-white/90 md:text-xl">{children}</blockquote>
      <figcaption className="mt-2 font-mono text-xs uppercase tracking-wider text-white/45">
        {href ? (
          <a className="hover:text-gold" href={href} rel="noopener noreferrer" target="_blank">
            {source}
          </a>
        ) : (
          source
        )}
      </figcaption>
    </figure>
  )
}

export interface Moment {
  date: string
  title: string
  text: ReactNode
  href?: string
  hrefLabel?: string
}

/** A vertical run of dated moments. */
export function Moments({ items }: { items: Moment[] }) {
  return (
    <ol className="relative space-y-6 border-l border-white/10 pl-6">
      {items.map((m, i) => (
        <motion.li
          className="relative"
          initial={{ opacity: 0, x: -12 }}
          key={`${m.date}-${m.title}`}
          transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.3) }}
          viewport={{ once: true, amount: 0.4 }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <span aria-hidden="true" className="absolute -left-[29px] top-1.5 size-2.5 rounded-full border border-gold bg-black" />
          <p className="font-mono text-xs uppercase tracking-wider text-gold">{m.date}</p>
          <h3 className="mt-1 text-lg font-semibold text-white/90">{m.title}</h3>
          <div className="mt-1.5 text-sm leading-relaxed text-white/65 md:text-base">{m.text}</div>
          {m.href && (
            <Link className="mt-2 inline-block text-xs text-white/45 underline decoration-white/20 underline-offset-4 hover:text-gold" href={m.href}>
              {m.hrefLabel ?? 'Source'}
            </Link>
          )}
        </motion.li>
      ))}
    </ol>
  )
}

/** The open question a phase leaves behind. */
export function OpenQuestion({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border border-gold/25 bg-gold/[0.06] p-5">
      <HelpCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" />
      <p className="text-base leading-relaxed text-white/85 md:text-lg">{children}</p>
    </div>
  )
}

/** Plain story paragraph block. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl space-y-4 text-base leading-relaxed text-white/75 md:text-lg">{children}</div>
}

export type ClueStatus = 'documented' | 'his-words' | 'community'

const STATUS: Record<ClueStatus, { label: string; cls: string }> = {
  documented: { label: 'Documented', cls: 'border-gold/40 text-gold' },
  'his-words': { label: 'In his words', cls: 'border-violet-400/40 text-violet-300' },
  community: { label: 'Community reading', cls: 'border-sky-400/40 text-sky-300' },
}

export interface Clue {
  title: string
  text: ReactNode
  status: ClueStatus
  source: string
  href?: string
}

/** A strange fact, labelled by how solid it is. */
export function ClueCard({ clue, index }: { clue: Clue; index: number }) {
  const s = STATUS[clue.status]
  return (
    <motion.article
      className="flex h-full flex-col border border-white/10 bg-black/60 p-5 backdrop-blur-sm"
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.4, delay: Math.min((index % 3) * 0.08, 0.2) }}
      viewport={{ once: true, amount: 0.3 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-white/35">{String(index + 1).padStart(2, '0')}</span>
        <span className={cn('border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider', s.cls)}>{s.label}</span>
      </div>
      <h3 className="text-lg font-semibold leading-snug text-white/90">{clue.title}</h3>
      <div className="mt-2 flex-1 text-sm leading-relaxed text-white/65">{clue.text}</div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-white/35">
        {clue.href ? (
          clue.href.startsWith('/') ? (
            <Link className="hover:text-gold" href={clue.href}>
              {clue.source}
            </Link>
          ) : (
            <a className="hover:text-gold" href={clue.href} rel="noopener noreferrer" target="_blank">
              {clue.source}
            </a>
          )
        ) : (
          clue.source
        )}
      </p>
    </motion.article>
  )
}
