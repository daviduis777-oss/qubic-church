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
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] text-[#D4AF37]/40 hover:text-[#D4AF37]/80 font-mono uppercase tracking-wider transition-colors"
      >
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
        {open ? 'Hide' : 'Show'} {label ?? 'technical details'}
      </button>
      {open && (
        <LazyMotion features={domAnimation}>
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 text-[11px] font-mono text-white/40 leading-relaxed border-l-2 border-[#D4AF37]/15 pl-3 space-y-1"
          >
            {children}
          </m.div>
        </LazyMotion>
      )}
    </div>
  )
}
