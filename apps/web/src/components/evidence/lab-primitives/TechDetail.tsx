'use client'

import { useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TechDetailProps {
  children: React.ReactNode
  label?: string
}

export function TechDetail({ children, label }: TechDetailProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3">
      <button
        className="flex items-center gap-1.5 text-xs text-gold/80 hover:text-gold/80 font-mono uppercase tracking-wider transition-colors"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <ChevronDown
          className={cn('w-3 h-3 transition-transform', open && 'rotate-180')}
        />
        {open ? 'Hide' : 'Show'} {label ?? 'technical details'}
      </button>
      {open && (
        <LazyMotion features={domAnimation}>
          <m.div
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 text-xs font-mono text-muted-foreground leading-relaxed border-l-2 border-gold/15 pl-3 space-y-1"
            initial={{ opacity: 0, height: 0 }}
          >
            {children}
          </m.div>
        </LazyMotion>
      )}
    </div>
  )
}
