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
  const isInView = useInView(ref, { once: false, amount: 0.2 })

  const backgroundStyles = {
    default: 'bg-transparent',
    dark: 'bg-black/40',
    gradient: 'bg-gradient-to-b from-[#050505]/80 to-transparent',
  }

  return (
    <section
      ref={ref}
      id={`phase-${id}`}
      className={cn(
        'relative min-h-screen w-full py-16 md:py-24',
        backgroundStyles[background],
        className
      )}
    >
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Phase Header */}
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.9 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-mono uppercase tracking-wider">
              Phase {phaseNumber.toString().padStart(2, '0')}
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold text-white/90 mb-3">{title}</h2>

          {subtitle && (
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </motion.div>

        {/* Phase Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  )
}
