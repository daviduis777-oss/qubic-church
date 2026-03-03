'use client'

import { motion, useInView } from 'framer-motion'
import {
  Cpu,
  Zap,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  TrendingUp,
  Server,
  Bolt,
} from 'lucide-react'
import { useState, useRef } from 'react'

// =============================================================================
// DATA
// =============================================================================

const comparisonData = [
  { feature: 'Consensus', qubic: 'Useful Proof of Work', monero: 'RandomX PoW' },
  { feature: 'Energy Usage', qubic: 'Trains AI models', monero: 'Meaningless hashes' },
  { feature: 'Algorithm', qubic: 'AI Training Tasks', monero: 'RandomX' },
  { feature: 'Block Time', qubic: '~1 second (ticks)', monero: '~2 minutes' },
  { feature: 'Transaction Fees', qubic: 'Zero fees', monero: 'Variable fees' },
  { feature: 'Mining Software', qubic: 'qubic.li client', monero: 'XMRig' },
  { feature: 'CPU Mining', qubic: 'Optimized', monero: 'Optimized' },
  { feature: 'GPU Mining', qubic: 'Supported (CUDA)', monero: 'Not efficient' },
  { feature: 'Purpose', qubic: 'Building AGI (Aigarth)', monero: 'Privacy payments' },
]

const pools = [
  {
    name: 'Qubic.li',
    url: 'https://app.qubic.li',
    description: 'Official mining pool with dashboard and statistics',
    fee: '15%',
    features: ['Auto-payout', 'Performance dashboard', 'Multi-GPU support'],
    terminal: 'pool.connect --qubic.li',
  },
  {
    name: 'Apool',
    url: 'https://www.apool.io/qubic',
    description: 'Alternative pool with competitive rates',
    fee: 'Variable',
    features: ['Low fees', 'Multiple coins', 'API access'],
    terminal: 'pool.connect --apool',
  },
  {
    name: 'Minerstat',
    url: 'https://minerstat.com/coin/QUBIC',
    description: 'Mining management platform with Qubic support',
    fee: 'Varies',
    features: ['Remote management', 'Profit switching', 'Monitoring'],
    terminal: 'pool.connect --minerstat',
  },
]

const quickStartSteps = [
  {
    step: 1,
    title: 'Get a Qubic Wallet',
    description: 'You need a wallet address to receive mining rewards.',
    link: { label: 'wallet.qubic.org', url: 'https://wallet.qubic.org' },
  },
  {
    step: 2,
    title: 'Register on Qubic.li',
    description: 'Create an account on the mining pool to get your access token.',
    link: { label: 'app.qubic.li', url: 'https://app.qubic.li' },
  },
  {
    step: 3,
    title: 'Download the Miner',
    description: 'Get the Qubic.li mining client for your platform (Windows/Linux).',
    link: { label: 'Download Client', url: 'https://github.com/qubic-li/client/releases' },
  },
  {
    step: 4,
    title: 'Configure & Start',
    description: 'Enter your access token, set your wallet address, and start mining.',
    link: null,
  },
]

const hardwareRecommendations = [
  {
    tier: 'Entry Level',
    cpu: 'AMD Ryzen 5 5600X / Intel i5-12400',
    gpu: 'Not required (CPU only)',
    ram: '16 GB',
    estimated: 'Low',
    opacity: '30',
  },
  {
    tier: 'Mid Range',
    cpu: 'AMD Ryzen 7 5800X / Intel i7-12700K',
    gpu: 'NVIDIA RTX 3060 Ti+',
    ram: '32 GB',
    estimated: 'Medium',
    opacity: '50',
  },
  {
    tier: 'High End',
    cpu: 'AMD Ryzen 9 5950X / Intel i9-13900K',
    gpu: 'NVIDIA RTX 4080/4090',
    ram: '64 GB',
    estimated: 'High',
    opacity: '80',
  },
]

const faqs = [
  {
    q: 'What is Useful Proof of Work (UPoW)?',
    a: 'Unlike traditional PoW that computes meaningless hashes, Qubic\'s UPoW uses mining power to train artificial neural networks. Your mining contributes to building Aigarth, Qubic\'s artificial general intelligence. You earn QUBIC while contributing to AI research.',
  },
  {
    q: 'Is Qubic mining more profitable than Monero?',
    a: 'Profitability depends on market conditions, hardware, and electricity costs. Qubic mining uses similar hardware (CPUs) as Monero but also supports GPUs. Check current profitability at qubic.li or use the calculator on our monitoring page.',
  },
  {
    q: 'Can I mine Qubic with my existing Monero setup?',
    a: 'Yes! If you\'re mining Monero with CPUs, you can switch to Qubic mining easily. Just install the qubic.li client and configure it with your access token. GPU miners can also participate for additional earnings.',
  },
  {
    q: 'How are mining rewards distributed?',
    a: 'Qubic rewards miners per epoch (roughly weekly). The network distributes rewards based on the quality of solutions submitted. Pools like qubic.li handle the distribution automatically.',
  },
  {
    q: 'What are the system requirements?',
    a: 'Minimum: Modern CPU with AVX2 support (2015+), 8GB RAM. Recommended: AMD Ryzen 5000+ or Intel 12th gen+, 16GB RAM. GPU mining requires NVIDIA cards with CUDA support.',
  },
]

// =============================================================================
// COMPONENTS
// =============================================================================

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/[0.04] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#0a0a0a] transition-colors group"
      >
        <span className="font-medium text-white/70 pr-4 group-hover:text-white/90 transition-colors">{q}</span>
        <ChevronDown className={`w-4 h-4 text-[#D4AF37]/30 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-white/35 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  )
}

function SectionHeader({ number, label }: { number: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-3 mb-8">
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
      <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
        {number} &mdash; {label}
      </span>
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
    </div>
  )
}

// =============================================================================
// PAGE
// =============================================================================

export default function MineQubicPage() {
  const heroRef = useRef(null)
  const compRef = useRef(null)
  const quickRef = useRef(null)
  const poolRef = useRef(null)
  const hwRef = useRef(null)
  const faqRef = useRef(null)
  const heroInView = useInView(heroRef, { once: true, margin: '-40px' })
  const compInView = useInView(compRef, { once: true, margin: '-80px' })
  const quickInView = useInView(quickRef, { once: true, margin: '-80px' })
  const poolInView = useInView(poolRef, { once: true, margin: '-80px' })
  const hwInView = useInView(hwRef, { once: true, margin: '-80px' })
  const faqInView = useInView(faqRef, { once: true, margin: '-80px' })

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      {/* Hero */}
      <section ref={heroRef} className="relative w-full py-20 md:py-28 overflow-hidden">
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.02] leading-none select-none pointer-events-none font-mono">
          MINE
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <SectionHeader number="01" label="Mining Guide" />

            <h1
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white mb-5 tracking-wide md:tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Mine{' '}
              <span className="text-[#D4AF37]/80">Qubic</span>
            </h1>

            <p className="text-lg text-white/35 max-w-2xl mx-auto leading-relaxed mb-8">
              Earn QUBIC by training AI. Useful Proof of Work means your
              mining power builds artificial intelligence, not wasted heat.
            </p>

            {/* Key benefits */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: Zap, text: 'Useful Proof of Work' },
                { icon: TrendingUp, text: 'Competitive Returns' },
                { icon: Bolt, text: 'CPU + GPU Support' },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2 border border-white/[0.06] bg-[#050505]">
                    <Icon className="w-4 h-4 text-[#D4AF37]/40" />
                    <span className="text-sm text-white/40 font-mono">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Qubic vs Monero Comparison */}
      <section ref={compRef} className="relative w-full py-20 md:py-28 overflow-hidden">
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
          02
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-5xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={compInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionHeader number="02" label="Compare" />
            <h2
              className="text-2xl sm:text-3xl md:text-5xl text-white tracking-wide md:tracking-wider uppercase mb-4"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Qubic vs{' '}
              <span className="text-[#D4AF37]/80">Monero</span>
            </h2>
            <p className="text-white/30 text-sm font-mono">Same hardware, more purpose</p>
          </motion.div>

          <motion.div
            className="overflow-x-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={compInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-white/30 uppercase tracking-[0.3em] font-mono">Feature</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-[#D4AF37]/50 uppercase tracking-[0.3em] font-mono">Qubic</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-white/30 uppercase tracking-[0.3em] font-mono">Monero</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="border-b border-white/[0.03] hover:bg-[#0a0a0a] transition-colors">
                    <td className="py-3 px-4 text-sm text-white/30 font-mono">{row.feature}</td>
                    <td className="py-3 px-4 text-sm text-white/70 font-mono">{row.qubic}</td>
                    <td className="py-3 px-4 text-sm text-white/25 font-mono">{row.monero}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Quick Start */}
      <section ref={quickRef} className="relative w-full py-20 md:py-28 overflow-hidden">
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
          03
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-5xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={quickInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionHeader number="03" label="Quick Start" />
            <h2
              className="text-2xl sm:text-3xl md:text-5xl text-white tracking-wide md:tracking-wider uppercase mb-4"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Start in{' '}
              <span className="text-[#D4AF37]/80">5 Minutes</span>
            </h2>
            <p className="text-white/30 text-sm font-mono">Start mining Qubic in under 5 minutes</p>
          </motion.div>

          <div className="space-y-[1px] bg-white/[0.04]">
            {quickStartSteps.map((step, idx) => (
              <motion.div
                key={idx}
                className="relative flex items-start gap-4 p-5 md:p-6 bg-[#050505] border border-white/[0.04] hover:bg-[#0a0a0a] transition-all duration-500 group overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={quickInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.1 }}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 transition-colors duration-500" />

                <div className="flex items-center justify-center w-10 h-10 border border-white/[0.06] group-hover:border-[#D4AF37]/15 transition-colors shrink-0">
                  <span className="text-lg font-bold text-[#D4AF37]/40 font-mono">{step.step}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1 group-hover:text-[#D4AF37]/90 transition-colors duration-500">{step.title}</h3>
                  <p className="text-sm text-white/30 mb-2">{step.description}</p>
                  {step.link && (
                    <a
                      href={step.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-[#D4AF37]/50 hover:text-[#D4AF37]/80 transition-colors font-mono"
                    >
                      {step.link.label}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <CheckCircle2 className="w-5 h-5 text-white/[0.06] group-hover:text-[#D4AF37]/20 transition-colors shrink-0 mt-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mining Pools */}
      <section ref={poolRef} className="relative w-full py-20 md:py-28 overflow-hidden">
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
          04
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-5xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={poolInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionHeader number="04" label="Pools" />
            <h2
              className="text-2xl sm:text-3xl md:text-5xl text-white tracking-wide md:tracking-wider uppercase mb-4"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Mining{' '}
              <span className="text-[#D4AF37]/80">Pools</span>
            </h2>
            <p className="text-white/30 text-sm font-mono">Join a pool for consistent rewards</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-[1px] bg-white/[0.04]">
            {pools.map((pool, idx) => (
              <motion.a
                key={idx}
                href={pool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative p-5 md:p-6 bg-[#050505] border border-white/[0.04] hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all duration-500 group overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={poolInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.1 }}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 transition-colors duration-500" />
                <div className="absolute top-2 right-2 w-1 h-1 bg-white/0 group-hover:bg-[#D4AF37]/30 transition-colors duration-500" />
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/0 group-hover:bg-white/10 transition-colors duration-500" />

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37]/90 transition-colors duration-500">
                    {pool.name}
                  </h3>
                  <span className="text-[9px] text-[#D4AF37]/25 font-mono border border-[#D4AF37]/10 px-2 py-0.5">
                    Fee: {pool.fee}
                  </span>
                </div>
                <p className="text-sm text-white/30 mb-4">{pool.description}</p>
                <div className="space-y-1.5 mb-4">
                  {pool.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-white/25">
                      <ArrowRight className="w-3 h-3 text-[#D4AF37]/25" />
                      <span className="font-mono">{f}</span>
                    </div>
                  ))}
                </div>
                {/* Terminal line */}
                <div className="border-t border-white/[0.04] pt-3">
                  <code className="text-[10px] text-[#D4AF37]/20 font-mono">$ {pool.terminal}</code>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Hardware Recommendations */}
      <section ref={hwRef} className="relative w-full py-20 md:py-28 overflow-hidden">
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
          05
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-5xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={hwInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionHeader number="05" label="Hardware" />
            <h2
              className="text-2xl sm:text-3xl md:text-5xl text-white tracking-wide md:tracking-wider uppercase mb-4"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Recommended{' '}
              <span className="text-[#D4AF37]/80">Hardware</span>
            </h2>
            <p className="text-white/30 text-sm font-mono">What you need to start mining</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-[1px] bg-white/[0.04]">
            {hardwareRecommendations.map((hw, idx) => (
              <motion.div
                key={idx}
                className="relative p-5 md:p-6 bg-[#050505] border border-white/[0.04] hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all duration-500 group overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={hwInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.1 }}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 transition-colors duration-500" />
                <div className="absolute top-2 right-2 w-1 h-1 bg-white/0 group-hover:bg-[#D4AF37]/30 transition-colors duration-500" />

                <div className={`text-sm font-bold font-mono mb-5`} style={{ color: `rgba(212, 175, 55, 0.${hw.opacity})` }}>
                  {hw.tier}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-white/20 mb-0.5 font-mono uppercase tracking-wider">CPU</div>
                    <div className="text-sm text-white/60 font-mono">{hw.cpu}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/20 mb-0.5 font-mono uppercase tracking-wider">GPU</div>
                    <div className="text-sm text-white/60 font-mono">{hw.gpu}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/20 mb-0.5 font-mono uppercase tracking-wider">RAM</div>
                    <div className="text-sm text-white/60 font-mono">{hw.ram}</div>
                  </div>
                  <div className="pt-3 border-t border-white/[0.04]">
                    <div className="text-[10px] text-white/20 mb-0.5 font-mono uppercase tracking-wider">Expected Earnings</div>
                    <div className="text-sm font-bold font-mono" style={{ color: `rgba(212, 175, 55, 0.${hw.opacity})` }}>
                      {hw.estimated}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} className="relative w-full py-20 md:py-28 overflow-hidden">
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
          06
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-4xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionHeader number="06" label="Knowledge" />
            <h2
              className="text-2xl sm:text-3xl md:text-5xl text-white tracking-wide md:tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Frequently{' '}
              <span className="text-[#D4AF37]/80">Asked</span>
            </h2>
          </motion.div>

          <motion.div
            className="space-y-[1px] bg-white/[0.04]"
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} q={faq.q} a={faq.a} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-2xl sm:text-3xl md:text-4xl text-white tracking-wide uppercase mb-4"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Start Mining{' '}
              <span className="text-[#D4AF37]/80">Today</span>
            </h2>
            <p className="text-white/30 mb-10 text-sm font-mono">
              Earn QUBIC while contributing to artificial intelligence research.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://app.qubic.li"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#D4AF37]/[0.04] border border-[#D4AF37]/15 text-white font-bold text-base hover:bg-[#D4AF37]/[0.08] hover:border-[#D4AF37]/25 transition-all duration-500 overflow-hidden font-mono tracking-wider"
              >
                {/* Shimmer */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-[#D4AF37]/[0.04] to-transparent" />
                <Server className="relative w-5 h-5 text-[#D4AF37]/40 group-hover:text-[#D4AF37]/60 transition-colors" />
                <span className="relative">JOIN QUBIC.LI POOL</span>
              </a>
              <a
                href="/monitoring"
                className="inline-flex items-center gap-3 px-8 py-4 border border-white/[0.06] text-white/50 font-bold text-base hover:border-white/15 hover:text-white/80 transition-all duration-500 font-mono tracking-wider"
              >
                Check Profitability
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[10px] text-white/15 mt-6 font-mono">
              $ miner.start --gpu --cpu // Your compute trains AI
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
