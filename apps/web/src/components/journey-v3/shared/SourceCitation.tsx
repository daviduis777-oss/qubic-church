'use client'

import { ExternalLink, FileText } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SourceCitationProps {
  href: string
  title: string
  tier?: 1 | 2 | 3
  className?: string
  external?: boolean
}

export function SourceCitation({
  href,
  title,
  tier,
  className,
  external = false,
}: SourceCitationProps) {
  const tierColors = {
    1: 'text-[#D4AF37] border-[#D4AF37]/20 bg-[#D4AF37]/10',
    2: 'text-[#D4AF37] border-[#D4AF37]/20 bg-[#D4AF37]/10',
    3: 'text-[#D4AF37] border-[#D4AF37]/20 bg-[#D4AF37]/10',
  }

  const tierLabels = {
    1: 'Tier 1: Verified',
    2: 'Tier 2: Supported',
    3: 'Tier 3: Hypothetical',
  }

  const content = (
    <>
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate">{title}</span>
      {tier && (
        <span
          className={cn(
            'px-1.5 py-0.5 text-[10px]  border shrink-0',
            tierColors[tier]
          )}
        >
          T{tier}
        </span>
      )}
      {external && <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />}
    </>
  )

  const baseClasses = cn(
    'inline-flex items-center gap-2 px-3 py-1.5',
    'text-sm text-white/70 hover:text-white/90',
    'bg-white/5 hover:bg-white/10 border border-white/10',
    'transition-colors cursor-pointer',
    className
  )

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        title={tier ? tierLabels[tier] : undefined}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={baseClasses} title={tier ? tierLabels[tier] : undefined}>
      {content}
    </Link>
  )
}

interface SourceCitationGroupProps {
  children: React.ReactNode
  className?: string
}

export function SourceCitationGroup({ children, className }: SourceCitationGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-2 mt-4', className)}>
      <span className="text-xs text-white/40 self-center mr-1">Sources:</span>
      {children}
    </div>
  )
}
