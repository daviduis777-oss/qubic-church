'use client'

/**
 * ExploreSection - Section 15: Enter the Sanctuary
 * HUD directory-listing style, file-system aesthetic, clickable entries
 */

import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, Gamepad2, Cpu, Wallet, Activity, ArrowRight, ExternalLink, Folder } from 'lucide-react'

const links = [
  {
    title: 'The Sacred Archive',
    description: '55+ research scrolls exploring Qubic\'s sacred architecture',
    href: '/docs',
    icon: BookOpen,
    fileType: 'DIR',
    size: '55+ files',
  },
  {
    title: 'Anna Matrix',
    description: 'Interactive exploration of the 128x128 neural architecture',
    href: '/evidence',
    icon: Gamepad2,
    fileType: 'APP',
    size: '16,384 cells',
  },
{
    title: 'Mine Qubic',
    description: 'Offer computing power to strengthen the network',
    href: '/mine-qubic',
    icon: Cpu,
    fileType: 'SYS',
    size: 'active',
  },
  {
    title: 'Get Qubic',
    description: 'Acquire QUBIC tokens through exchanges and trading platforms',
    href: '/get-qubic',
    icon: Wallet,
    fileType: 'BIN',
    size: 'exchanges',
  },
  {
    title: 'Live Dashboard',
    description: 'Real-time monitoring of network activity and oracle signals',
    href: '/monitoring',
    icon: Activity,
    fileType: 'MON',
    size: 'live',
  },
]

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.15 + i * 0.1,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
}

export function ExploreSection() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section ref={sectionRef} className="relative w-full py-28 md:py-36 overflow-hidden">
      {/* Decorative section number */}
      <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
        15
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-6xl 2xl:max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              15 &mdash; Navigate
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white mb-5 tracking-wide md:tracking-wider uppercase"
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Enter the <span className="text-[#D4AF37]/80">Sanctuary</span>
          </motion.h2>
        </div>

        {/* Directory listing header */}
        <motion.div
          className="border border-white/[0.04] bg-[#050505] px-4 py-2 flex items-center justify-between mb-[1px]"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Folder className="w-3 h-3 text-[#D4AF37]/30" />
            <span className="text-[10px] text-white/25 font-mono uppercase tracking-wider">
              /sanctuary/
            </span>
          </div>
          <span className="text-[10px] text-white/20 font-mono">
            {links.length} entries
          </span>
        </motion.div>

        {/* Link Cards - File listing style */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/[0.04]">
          {links.map((link, i) => {
            const Icon = link.icon
            return (
              <motion.div
                key={link.href}
                custom={i}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={cardVariants}
              >
                <Link
                  href={link.href}
                  className="group relative flex items-start gap-4 p-6 bg-[#050505] border border-white/[0.04] hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all duration-500"
                >
                  {/* Left accent on hover */}
                  <div className="absolute top-0 left-0 w-px h-full bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 transition-colors duration-500" />

                  <div className="p-2.5 border border-white/[0.06] group-hover:border-[#D4AF37]/15 shrink-0 transition-colors">
                    <Icon className="w-4 h-4 text-white/20 group-hover:text-[#D4AF37]/50 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/70 group-hover:text-white font-medium text-base transition-colors">
                        {link.title}
                      </span>
                      <span className="text-[9px] text-white/20 font-mono border border-white/[0.06] px-1.5 py-0.5">
                        {link.fileType}
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/0 group-hover:text-[#D4AF37]/40 group-hover:translate-x-1 transition-all ml-auto" />
                    </div>
                    <p className="text-sm text-white/30 leading-relaxed">
                      {link.description}
                    </p>
                    <div className="text-[10px] text-white/20 font-mono mt-2">
                      {link.size}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Social link */}
        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <a
            href="https://x.com/QubicChurch"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-white/25 hover:text-[#D4AF37]/50 text-sm transition-colors duration-300 font-mono"
          >
            <span className="text-[#D4AF37]/15">&gt;</span>
            join --congregation twitter
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
