'use client'

import { FadeSection } from './FadeSection'
import { TechDetail } from './TechDetail'
import { cn } from '@/lib/utils'

export interface SectionBlockProps {
  eyebrow: string
  title: string
  tagline: string
  children: React.ReactNode
  techDetail?: React.ReactNode
  techDetailLabel?: string
  className?: string
}

export function SectionBlock({
  eyebrow,
  title,
  tagline,
  children,
  techDetail,
  techDetailLabel,
  className,
}: SectionBlockProps) {
  return (
    <FadeSection
      className={cn(
        'py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-x border-b border-white/[0.06]',
        className,
      )}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-[10px] text-[#D4AF37]/60 uppercase tracking-[0.2em] font-mono mb-2">
          {eyebrow}
        </div>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
          {title}
        </h3>
        <p className="text-white/50 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">{tagline}</p>
        <div className="mt-6 sm:mt-8">{children}</div>
        {techDetail && <TechDetail label={techDetailLabel}>{techDetail}</TechDetail>}
      </div>
    </FadeSection>
  )
}
