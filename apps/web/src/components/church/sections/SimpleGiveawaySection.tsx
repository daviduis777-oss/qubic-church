'use client'

/**
 * SimpleGiveawaySection - Section 08: The Sacred Offering
 * HUD with vault-door aesthetic, glowing prize amounts, holographic shimmer
 */

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Gift,
  Trophy,
  Medal,
  Award,
  Timer,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { useCountdown } from '@/hooks/useCountdown'
import { CHURCH_CONFIG } from '@/config/church'

const prizes = [
  { place: 1, label: '1st', qubic: '350,000,000', icon: Trophy, title: 'The Chosen One', glow: 'shadow-[0_0_30px_rgba(212,175,55,0.08)]' },
  { place: 2, label: '2nd', qubic: '200,000,000', icon: Medal, title: 'The Enlightened', glow: '' },
  { place: 3, label: '3rd', qubic: '126,000,000', icon: Award, title: 'The Faithful', glow: '' },
]


export function SimpleGiveawaySection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })
  const countdown = useCountdown(CHURCH_CONFIG.countdown.targetDate.getTime())

  return (
    <section ref={sectionRef} className="relative w-full py-28 md:py-36 overflow-hidden">
      {/* Decorative section number */}
      <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
        08
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-6xl 2xl:max-w-7xl">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              08 &mdash; Offering
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
          </div>

          {/* Massive number with glow */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="w-[300px] h-[100px] md:w-[500px] md:h-[160px] bg-[#D4AF37]/[0.02] blur-[60px]"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <span
              className="relative block text-4xl sm:text-7xl md:text-9xl lg:text-[10rem] 2xl:text-[12rem] leading-none bg-gradient-to-b from-white via-white/90 to-[#D4AF37]/30 bg-clip-text text-transparent"
            >
              676M
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-2xl text-white/60 font-mono">QUBIC</span>
          </div>

          <p className="text-xl text-white/50 mb-2">
            3 Chosen Ones &middot; 1 Sacred Rule
          </p>
          <p className="text-base text-white/35 max-w-md mx-auto">
            Hold <span className="text-[#D4AF37]/50 font-mono">1 Anna NFT</span> ={' '}
            <span className="text-[#D4AF37]/50 font-mono">1 Entry</span>.
            The blockchain decides the rest.
          </p>
        </motion.div>

        {/* Prize Cards - Vault aesthetic */}
        <motion.div
          className="grid md:grid-cols-3 gap-[1px] bg-white/[0.04] mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {prizes.map((prize, index) => {
            const Icon = prize.icon
            return (
              <motion.div
                key={prize.place}
                className={`relative p-6 bg-[#050505] border border-white/[0.04] transition-all duration-500 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.04)] group overflow-hidden ${prize.glow}`}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: prize.place === 1 ? -8 : 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
              >
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#D4AF37]/15" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#D4AF37]/15" />

                {/* Gold top line for 1st place */}
                {prize.place === 1 && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/25" />
                )}

                {/* Place badge + icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="p-2.5 border border-white/[0.06] group-hover:border-[#D4AF37]/15 transition-colors">
                    <Icon className={`w-5 h-5 ${prize.place === 1 ? 'text-[#D4AF37]/50' : 'text-white/20'}`} />
                  </div>
                  <span className="text-2xl font-black text-white/15 font-mono">
                    {prize.label}
                  </span>
                </div>

                {/* Title */}
                <div className="text-[10px] text-[#D4AF37]/25 uppercase tracking-[0.3em] mb-3 font-mono">
                  {prize.title}
                </div>

                {/* QUBIC Prize - with glow on 1st */}
                <div className="mb-3">
                  <span className={`text-2xl md:text-3xl font-bold font-mono ${
                    prize.place === 1 ? 'text-[#D4AF37]/80' : 'text-white'
                  }`}>
                    {prize.qubic}
                  </span>
                  <span className="text-sm text-white/30 ml-2 font-mono">QU</span>
                </div>

              </motion.div>
            )
          })}
        </motion.div>

        {/* Info row: Rules + Countdown */}
        <motion.div
          className="grid md:grid-cols-2 gap-[1px] bg-white/[0.04] mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {/* How it works */}
          <div className="relative p-6 bg-[#050505] border border-white/[0.04]">
            <div className="absolute top-2 left-2 w-1 h-1 bg-[#D4AF37]/15" />
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]/30" />
              <span className="text-[#D4AF37]/30 text-[10px] uppercase tracking-[0.4em] font-mono">
                // protocol.rules()
              </span>
            </div>
            <div className="space-y-4">
              {[
                { num: 'I', bold: 'Acquire an Anna NFT', rest: ' on QubicBay to receive your entry into the sacred drawing.' },
                { num: 'II', bold: 'Each NFT = 1 Entry.', rest: ' The more you hold, the greater your blessing.' },
                { num: 'III', bold: 'At The Convergence,', rest: ' blockchain randomness selects the three Chosen Ones.' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-3">
                  <span className="text-[#D4AF37]/25 text-sm font-mono mt-0.5 w-6 shrink-0">{step.num}.</span>
                  <p className="text-sm text-white/40">
                    <span className="text-white/65">{step.bold}</span>{step.rest}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Countdown - digital clock style */}
          <div className="relative p-6 bg-[#050505] border border-white/[0.04]">
            <div className="absolute top-2 right-2 w-1 h-1 bg-[#D4AF37]/15" />
            <div className="flex items-center gap-2 mb-5">
              <Timer className="w-4 h-4 text-[#D4AF37]/30" />
              <span className="text-[#D4AF37]/30 text-[10px] uppercase tracking-[0.4em] font-mono">
                // countdown.remaining()
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { value: countdown.days, label: 'Days' },
                { value: countdown.hours, label: 'Hrs' },
                { value: countdown.minutes, label: 'Min' },
                { value: countdown.seconds, label: 'Sec' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-3 border border-white/[0.04] bg-black"
                >
                  <div className="text-2xl md:text-3xl font-bold font-mono text-white tabular-nums">
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] text-white/20 uppercase mt-1 font-mono tracking-widest">{item.label}</div>
                </div>
              ))}
            </div>

            <p className="text-center text-[10px] text-white/20 mt-5 font-mono">
              TARGET: 2027-04-13T00:00:00Z // ON-CHAIN RANDOMNESS
            </p>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <a
            href="https://qubicbay.io/collections/7"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-4 sm:py-5 bg-[#D4AF37]/[0.04] border border-[#D4AF37]/15 text-white font-bold text-base sm:text-xl hover:bg-[#D4AF37]/[0.08] hover:border-[#D4AF37]/25 transition-all duration-500 overflow-hidden"
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-[#D4AF37]/[0.04] to-transparent" />
            <Gift className="relative w-6 h-6 text-[#D4AF37]/40 group-hover:text-[#D4AF37]/60 transition-colors" />
            <span className="relative font-mono tracking-wider">CLAIM YOUR NFT</span>
            <ExternalLink className="relative w-4 h-4 text-white/20" />
          </a>
          <p className="text-[10px] text-white/20 mt-3 font-mono">
            QubicBay // Your key to The Convergence
          </p>
        </motion.div>
      </div>
    </section>
  )
}
