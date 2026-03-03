'use client'

/**
 * BitcoinBridgeSection - Section 05: The Bitcoin-Qubic Bridge
 * HUD with classified-file aesthetic, redacted text effects, evidence markers
 */

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link2, Hash, Binary, ArrowRight, Shield, Lock } from 'lucide-react'
import Link from 'next/link'

const discoveries = [
  {
    number: '01',
    title: 'POCC + HASV Pattern',
    detail: 'p = 2.05e-8 (survives Bonferroni)',
    description:
      'The only finding that survives full statistical correction. Two Qubic token-issuing addresses encode the number 676 (the computor count) through the Anna Matrix diagonal sums. Monte Carlo validated.',
    icon: Link2,
    tier: 'TIER-1',
    confidence: '5\u03C3+',
  },
  {
    number: '02',
    title: 'Block 576 Coinbase Byte',
    detail: '0x1b = 27 = 3\u00B3',
    description:
      'Block 576 coinbase scriptSig contains byte 0x1b (decimal 27, the cube of 3). Unique in a sample of the first 1,000 blocks. 576 = 24\u00B2. Verifiable on-chain.',
    icon: Binary,
    tier: 'TIER-1',
    confidence: 'Confirmed',
  },
  {
    number: '03',
    title: '1CFB Vanity Address',
    detail: '1CFBdvaiZgZPTZERqnezAtDQJuGHKoHSzg',
    description:
      'A Bitcoin vanity address encoding "1CFB" \u2014 Come-From-Beyond\'s identifier. Created January 13, 2009 (Block 264), ten days after Bitcoin\'s Genesis Block. Dormant since creation.',
    icon: Shield,
    tier: 'TIER-2',
    confidence: 'On-chain',
  },
  {
    number: '04',
    title: 'Anna Matrix Properties',
    detail: '128 \u00D7 128 = 16,384 cells',
    description:
      'The matrix is 99.58% point-symmetric with exactly 68 asymmetric exception cells. These structural properties are mathematically verifiable from the published data.',
    icon: Hash,
    tier: 'TIER-1',
    confidence: 'Verified',
  },
]

export function BitcoinBridgeSection() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-28 md:py-36 overflow-hidden"
    >
      <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
        05
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-6xl">
        {/* Header - Classified file style */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <motion.div
            className="inline-flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              05 &mdash; Evidence
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05] tracking-wide md:tracking-wider uppercase"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            The Bitcoin-Qubic{' '}
            <span className="text-[#D4AF37]/80">Bridge</span>
          </motion.h2>

          <motion.p
            className="mt-6 text-lg md:text-xl text-white/40 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12 }}
          >
            Investigating mathematical correlations between Bitcoin blockchain structures and the Anna Matrix.
            All claims independently validated &mdash; only findings surviving statistical correction are shown.
          </motion.p>
        </div>

        {/* Discovery Cards - Evidence file style */}
        <div className="grid md:grid-cols-2 gap-[1px] bg-white/[0.04] mb-16">
          {discoveries.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.number}
                className="relative p-5 md:p-7 lg:p-8 bg-[#050505] border border-white/[0.04] transition-all duration-500 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] group overflow-hidden"
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: 0.25 + idx * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Top-left evidence marker */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#D4AF37]/15" />
                {/* Bottom-right evidence marker */}
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#D4AF37]/15" />

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-white/[0.06] flex items-center justify-center group-hover:border-[#D4AF37]/15 transition-colors">
                      <Icon className="w-4 h-4 text-[#D4AF37]/30 group-hover:text-[#D4AF37]/50 transition-colors" strokeWidth={1.5} />
                    </div>
                    <span className="text-white/15 text-[10px] font-mono uppercase tracking-wider">
                      EV-{item.number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#D4AF37]/25 uppercase tracking-[0.2em] font-mono border border-[#D4AF37]/10 px-2 py-0.5">
                      {item.tier}
                    </span>
                    <span className="text-[9px] text-[#D4AF37]/30 font-mono">
                      {item.confidence}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#D4AF37]/90 transition-colors duration-500">
                  {item.title}
                </h3>

                <div className="text-[#D4AF37]/50 font-mono text-sm mb-4 border-l-2 border-[#D4AF37]/15 pl-3 break-all">
                  {item.detail}
                </div>

                <p className="text-sm text-white/30 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Classified footer */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {/* Redacted disclaimer */}
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-white/[0.04] bg-[#050505]">
            <Lock className="w-3 h-3 text-white/15" />
            <p className="text-[10px] text-white/20 font-mono">
              MATHEMATICAL FACTS ARE REPRODUCIBLE. INTERPRETATIONS ARE SPECULATION.
              CFB HAS PUBLICLY DENIED THE SATOSHI CONNECTION.
            </p>
          </div>

          <div>
            <Link
              href="/docs"
              className="group inline-flex items-center gap-2.5 text-white/40 hover:text-[#D4AF37]/70 text-sm transition-colors duration-300 font-mono"
            >
              <span className="text-[#D4AF37]/20 group-hover:text-[#D4AF37]/40 transition-colors">&gt;_</span>
              Read the Full Research
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
