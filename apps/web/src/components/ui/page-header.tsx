import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * One page-header pattern for all content pages: a plain readable eyebrow,
 * the display title and a short lede. No watermarks, no pseudo-code labels.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  align = 'center',
  className,
  children,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  lede?: React.ReactNode
  align?: 'center' | 'start'
  className?: string
  children?: React.ReactNode
}) {
  return (
    <header
      className={cn(
        'mx-auto max-w-3xl px-4 pt-12 pb-10 sm:px-6 md:pt-20 md:pb-14',
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}
    >
      {eyebrow && <p className="eyebrow mb-4 text-gold">{eyebrow}</p>}
      <h1 className="text-3xl uppercase leading-tight tracking-wide text-balance text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h1>
      {lede && (
        <p
          className={cn(
            'mt-5 text-lg leading-relaxed text-pretty text-fg-2',
            align === 'center' && 'mx-auto max-w-2xl'
          )}
        >
          {lede}
        </p>
      )}
      {children && <div className="mt-8">{children}</div>}
    </header>
  )
}

/** Section eyebrow used inside pages: a readable label with a short gold rule. */
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'eyebrow mb-4 flex items-center gap-3 text-gold',
        className
      )}
    >
      <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
      {children}
    </p>
  )
}

/** Heading block for a page section: label, title, optional lede. */
export function SectionHeading({
  label,
  title,
  lede,
  align = 'center',
  className,
}: {
  label?: React.ReactNode
  title: React.ReactNode
  lede?: React.ReactNode
  align?: 'center' | 'start'
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-10 md:mb-12',
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl',
        className
      )}
    >
      {label && (
        <p
          className={cn(
            'eyebrow mb-3 text-gold',
            align === 'center' && 'justify-center'
          )}
        >
          {label}
        </p>
      )}
      <h2 className="text-2xl font-semibold tracking-tight text-balance text-foreground md:text-3xl">
        {title}
      </h2>
      {lede && (
        <p className="mt-3 text-base leading-relaxed text-pretty text-fg-2">
          {lede}
        </p>
      )}
    </div>
  )
}
