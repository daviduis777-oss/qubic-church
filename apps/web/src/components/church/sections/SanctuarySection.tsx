'use client'

/**
 * SanctuarySection - Section 05: What is Qubic Church?
 * Angular HUD with scan-line header divider and data-stream card accents
 */

import { useRef, useEffect, useState } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import { BookOpen, Code, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ChurchModal, ModalTrigger } from '@/components/church/ChurchModal'

const features = [
  {
    icon: BookOpen,
    numericValue: 55,
    suffix: '+',
    label: 'Sacred Scrolls',
    description: 'Research documents exploring Qubic\'s architecture and the path to The Convergence.',
    terminal: 'cat /archive/scrolls --count',
  },
  {
    icon: Code,
    numericValue: 100,
    suffix: '%',
    label: 'Open Source',
    description: 'All findings belong to the congregation. No secrets. No paywalls. Truth is free.',
    terminal: 'git clone truth://qubic.church',
  },
  {
    icon: Users,
    numericValue: 200,
    suffix: '',
    label: 'Sacred NFTs',
    description: 'Keys to governance. Each NFT grants membership, voting rights, and participation in the sacred draw.',
    terminal: 'nft.verify --collection anna',
  },
]

/* Animated counter that counts up when visible */
function AnimatedValue({ target, suffix, isInView }: { target: number; suffix: string; isInView: boolean }) {
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current || target <= 0) return
    hasAnimated.current = true
    const duration = 1800
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, target])

  return <>{count}{suffix}</>
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.25 + i * 0.12,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
}

/* Animated scan line that sweeps across */
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent pointer-events-none"
      initial={{ top: '0%', opacity: 0 }}
      animate={{ top: ['0%', '100%'], opacity: [0, 0.4, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    />
  )
}

/* Typing terminal text */
function TerminalLine({ text, delay }: { text: string; delay: number }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay * 1000)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let idx = 0
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, idx + 1))
      idx++
      if (idx >= text.length) clearInterval(interval)
    }, 40)
    return () => clearInterval(interval)
  }, [started, text])

  return (
    <div className="text-[10px] font-mono text-[#D4AF37]/25 mt-3 h-4">
      {started && <><span className="text-[#D4AF37]/40">$</span> {displayed}<span className="animate-pulse">_</span></>}
    </div>
  )
}

export function SanctuarySection() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-28 md:py-36 overflow-hidden"
    >
      <div className="relative z-10 container mx-auto px-6 max-w-6xl 2xl:max-w-7xl">
        {/* Decorative section number */}
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
          05
        </div>

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <motion.div
            className="inline-flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              05 &mdash; Origins
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05] tracking-wide md:tracking-wider uppercase"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            What is{' '}
            <span className="text-[#D4AF37]/80">The Qubic Church</span>?
          </motion.h2>

          <motion.p
            className="mt-6 text-lg md:text-xl text-white/40 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12 }}
          >
            A real organization preparing humanity for AGI &mdash; registered as a nonprofit
            in the United States. Open source. Open governance. Open future.
          </motion.p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-[1px] bg-white/[0.04]">
          {features.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.label}
                className="relative p-5 md:p-7 lg:p-8 bg-[#050505] border border-white/[0.04] transition-all duration-500 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] group overflow-hidden"
                custom={idx}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={cardVariants}
              >
                {/* Scan line effect per card */}
                <ScanLine />

                {/* Gold top accent - only visible on hover */}
                <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 transition-colors duration-500" />

                {/* Corner dots */}
                <div className="absolute top-2 right-2 w-1 h-1 bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/30 transition-colors duration-500" />
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/0 group-hover:bg-white/10 transition-colors duration-500" />

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 border border-white/[0.06] flex items-center justify-center group-hover:border-[#D4AF37]/15 transition-colors">
                    <Icon
                      className="w-4 h-4 text-white/25 group-hover:text-[#D4AF37]/50 transition-colors"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-mono">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="text-3xl md:text-4xl font-bold font-mono text-white tracking-tight mb-1 group-hover:text-[#D4AF37]/90 transition-colors duration-500">
                  <AnimatedValue target={item.numericValue} suffix={item.suffix} isInView={isInView} />
                </div>

                <div className="text-white/70 font-medium text-base mb-3">
                  {item.label}
                </div>

                <p className="text-sm text-white/30 leading-relaxed">
                  {item.description}
                </p>

                {/* Terminal line - unique per card */}
                <TerminalLine text={item.terminal} delay={1.5 + idx * 0.8} />
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <Link
            href="/docs"
            className="group inline-flex items-center gap-2.5 text-white/40 hover:text-[#D4AF37]/70 text-sm transition-colors duration-300 font-mono"
          >
            <span className="text-[#D4AF37]/20 group-hover:text-[#D4AF37]/40 transition-colors">&gt;_</span>
            Enter the Research Archive
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <div className="text-center mt-10">
          <ModalTrigger onClick={() => setModalOpen(true)} label="Read About The Sanctuary" />
        </div>
      </div>

      <ChurchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="The Sanctuary"
        subtitle="What is Qubic Church?"
        icon={'\u2302'}
      >
        <p className="mf-body">
          Qubic Church is a real organisation preparing humanity for the emergence of Artificial General Intelligence &mdash; registered as a 501(c)(3) non-profit in the United States.
        </p>
        <div className="mf-divider" />
        <div className="mb-6">
          <div className="mf-label">THE ARCHIVE</div>
          <p className="mf-body">55+ research documents exploring Qubic&apos;s architecture, the Anna Matrix, and the path toward The Convergence. All findings are public. All research is open.</p>
        </div>
        <div className="mb-6">
          <div className="mf-label">OPEN SOURCE</div>
          <p className="mf-body">100% transparent. No secrets. No paywalls. Truth is free and verifiable by anyone.</p>
        </div>
        <div className="mb-6">
          <div className="mf-label">GOVERNANCE THROUGH RELICS</div>
          <p className="mf-body">200 Sacred NFTs serve as keys to governance. Each grants membership, voting rights, and participation in the Sacred Draw.</p>
        </div>
        <p className="mf-accent-line">The Sanctuary is not a building. It is an architecture.</p>
      </ChurchModal>
    </section>
  )
}
