'use client'

/**
 * ConvergenceCountdown - Section 14: The Convergence
 * HUD countdown timer with angular design, large digits, terminal aesthetic
 */

import { useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useCountdown } from '@/hooks/useCountdown'
import { CHURCH_CONFIG } from '@/config/church'

function CountdownDigit({ value, label, pad = 2 }: { value: number; label: string; pad?: number }) {
  const display = String(value).padStart(pad, '0')

  return (
    <div className="text-center">
      <div className="relative p-2 sm:p-3 md:p-5 bg-[#050505] border border-white/[0.04]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={display}
            className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl 2xl:text-9xl font-bold font-mono text-white tracking-tight tabular-nums"
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {display}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="text-[9px] md:text-[10px] text-white/20 uppercase tracking-[0.3em] mt-2 font-mono">
        {label}
      </div>
    </div>
  )
}

export function ConvergenceCountdown() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const countdown = useCountdown(CHURCH_CONFIG.countdown.targetDate.getTime())

  return (
    <section ref={ref} className="relative w-full py-24 md:py-32 overflow-hidden">
      {/* Decorative section number */}
      <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
        14
      </div>

      {/* Subtle glow behind */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-[500px] h-[250px] bg-[#D4AF37]/[0.02] blur-[100px]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-5xl 2xl:max-w-6xl">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Section label */}
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              14 &mdash; Countdown
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
          </div>

          {/* Icon with pulse */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <motion.div
              className="absolute w-14 h-14 border border-[#D4AF37]/10"
              animate={{ scale: [1, 1.4, 1.4], opacity: [0.3, 0, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            />
            <div className="w-10 h-10 bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#D4AF37]/50" />
            </div>
          </div>

          {/* Title */}
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white/90 mb-2 tracking-wide md:tracking-wider uppercase"
          >
            Preparing for{' '}
            <span className="text-[#D4AF37]/80">Anna&apos;s Arrival</span>
          </h2>

          <p className="text-sm text-white/30 mb-4 font-mono">
            TARGET: 2027-04-13T00:00:00Z
          </p>

          {/* Angular ornament */}
          <div className="flex items-center justify-center gap-1.5 mb-10 opacity-20">
            <div className="w-1 h-1 bg-[#D4AF37]" />
            <div className="w-6 h-px bg-[#D4AF37]/50" />
            <div className="w-2 h-2 rotate-45 border border-[#D4AF37]/40" />
            <div className="w-6 h-px bg-[#D4AF37]/50" />
            <div className="w-1.5 h-1.5 border border-[#D4AF37]/40" />
            <div className="w-6 h-px bg-[#D4AF37]/50" />
            <div className="w-2 h-2 rotate-45 border border-[#D4AF37]/40" />
            <div className="w-6 h-px bg-[#D4AF37]/50" />
            <div className="w-1 h-1 bg-[#D4AF37]" />
          </div>

          {/* Countdown digits */}
          <div className="inline-flex items-start gap-1 sm:gap-2 md:gap-3 2xl:gap-5">
            <CountdownDigit value={countdown.days} label="Days" pad={3} />
            <span className="text-xl sm:text-2xl md:text-4xl text-[#D4AF37]/20 font-mono mt-2 sm:mt-3 md:mt-5">:</span>
            <CountdownDigit value={countdown.hours} label="Hours" />
            <span className="text-xl sm:text-2xl md:text-4xl text-[#D4AF37]/20 font-mono mt-2 sm:mt-3 md:mt-5">:</span>
            <CountdownDigit value={countdown.minutes} label="Mins" />
            <span className="text-xl sm:text-2xl md:text-4xl text-[#D4AF37]/20 font-mono mt-2 sm:mt-3 md:mt-5">:</span>
            <CountdownDigit value={countdown.seconds} label="Secs" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
