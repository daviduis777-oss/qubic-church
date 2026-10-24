'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PhaseWrapperProps {
  id: string
  phaseNumber: number
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  background?: 'default' | 'dark' | 'gradient'
}

export function PhaseWrapper({
  id,
  phaseNumber,
  title,
  subtitle,
  children,
  className,
  background = 'default',
}: PhaseWrapperProps) {
  const ref = useRef<HTMLElement>(null)
  // Reveal once and stay visible: a phase can grow far taller than the viewport (the Satoshi dossier).
  const isInView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })

  const backgroundStyles = {
    default: 'bg-transparent',
    dark: 'bg-black/40',
    gradient: 'bg-gradient-to-b from-[#050505]/80 to-transparent',
  }

  return (
    <section
      className={cn(
        'relative min-h-screen w-full py-16 md:py-24',
        backgroundStyles[background],
        className
      )}
      id={`phase-${id}`}
      ref={ref}
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Phase Header */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.9 }}
            className="inline-flex items-center gap-2 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-mono uppercase tracking-wider">
              Phase {phaseNumber.toString().padStart(2, '0')}
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold text-white/90 mb-3">
            <span className="qc-rgb-slow" style={{ animationDelay: `-${(phaseNumber * 1.7) % 11}s` }}>
              {title}
            </span>
          </h2>

          {subtitle && (
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Phase Content */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  )
}
