'use client'

import { motion, useInView } from 'framer-motion'
import {
  Wallet,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Download,
  CreditCard,
  ChevronDown,
} from 'lucide-react'
import { useState, useRef } from 'react'

// =============================================================================
// DATA
// =============================================================================

const exchanges = [
  {
    name: 'SafeTrade',
    url: 'https://safe.trade/trading/qubiceth',
    type: 'CEX',
    pairs: ['QUBIC/ETH', 'QUBIC/BTC'],
    description: 'Primary exchange for QUBIC trading',
  },
  {
    name: 'Bitget',
    url: 'https://www.bitget.com/spot/QUBICUSDT',
    type: 'CEX',
    pairs: ['QUBIC/USDT'],
    description: 'Large exchange with high liquidity',
  },
  {
    name: 'Gate.io',
    url: 'https://www.gate.io/trade/QUBIC_USDT',
    type: 'CEX',
    pairs: ['QUBIC/USDT'],
    description: 'Popular exchange with global reach',
  },
  {
    name: 'MEXC',
    url: 'https://www.mexc.com/exchange/QUBIC_USDT',
    type: 'CEX',
    pairs: ['QUBIC/USDT'],
    description: 'High volume, low fees',
  },
]

const steps = [
  {
    step: 1,
    title: 'Get a Wallet',
    description: 'Download the official Qubic Wallet to store your QUBIC safely.',
    icon: Download,
    action: { label: 'Download Wallet', url: 'https://wallet.qubic.org' },
    terminal: 'wallet.install --official',
    details: [
      'Available as web wallet (wallet.qubic.org)',
      'Your private key = your QUBIC. Back it up!',
      'Copy your wallet address (60 characters, all uppercase)',
    ],
  },
  {
    step: 2,
    title: 'Buy QUBIC',
    description: 'Purchase QUBIC on any supported exchange and withdraw to your wallet.',
    icon: CreditCard,
    action: { label: 'See Exchanges', url: '#exchanges' },
    terminal: 'exchange.connect --buy QUBIC',
    details: [
      'Register on an exchange (Bitget, Gate.io, MEXC, SafeTrade)',
      'Deposit USDT, ETH, or BTC',
      'Buy QUBIC and withdraw to your wallet address',
    ],
  },
  {
    step: 3,
    title: 'Get an Anna NFT',
    description: 'Buy an Anna NFT on QubicBay to join the community and enter the giveaway.',
    icon: ShieldCheck,
    action: { label: 'Browse NFTs', url: 'https://qubicbay.io/collections/7' },
    terminal: 'nft.acquire --collection anna',
    details: [
      'Visit QubicBay.com and connect your wallet',
      'Browse the Anna Aigarth collection (200 NFTs)',
      'Purchase = automatic giveaway entry',
    ],
  },
]

const faqs = [
  {
    q: 'What is Qubic?',
    a: 'Qubic is a Layer 1 blockchain powered by Useful Proof of Work (UPoW). Instead of wasting energy on meaningless calculations, Qubic miners train AI models. It features the first ternary neural network architecture and aims to build Aigarth, an artificial general intelligence.',
  },
  {
    q: 'What makes Qubic different from other blockchains?',
    a: 'Qubic uses Useful Proof of Work where mining power trains AI neural networks. It has no transaction fees, instant finality, and runs on ternary logic (0, 1, -1) instead of binary. The network processes over 40M transfers per second.',
  },
  {
    q: 'What are Anna NFTs?',
    a: 'Anna NFTs are a collection of 200 unique digital artworks on the Qubic blockchain, each tied to the research of the 128x128 neural matrix called Anna. Holding an NFT grants giveaway entry (676M QUBIC prize pool), community access, and tiered research benefits.',
  },
  {
    q: 'Is Qubic safe?',
    a: 'Qubic is a public, decentralized blockchain. Your funds are secured by your private key. Always back up your seed phrase and never share it. The official wallet at wallet.qubic.org is the recommended way to store QUBIC.',
  },
  {
    q: 'How much QUBIC do I need for an NFT?',
    a: 'NFT prices vary on QubicBay marketplace. Check the current floor price at qubicbay.io/collections/7. Each NFT purchase also serves as your giveaway entry.',
  },
]

// =============================================================================
// COMPONENTS
// =============================================================================

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/[0.04] bg-[#050505] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-5 md:px-6 md:py-5 text-left hover:bg-[#0a0a0a] transition-colors group"
      >
        <span className="font-medium text-white/80 pr-4 group-hover:text-white transition-colors">{q}</span>
        <ChevronDown className={`w-4 h-4 text-[#D4AF37]/40 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 md:px-6 md:pb-6 pt-0">
          <div className="h-px w-full bg-[#D4AF37]/15 mb-4" />
          <p className="text-sm text-white/45 leading-relaxed">
            {a}
          </p>
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

export default function GetQubicPage() {
  const heroRef = useRef(null)
  const stepsRef = useRef(null)
  const exchangeRef = useRef(null)
  const faqRef = useRef(null)
  const heroInView = useInView(heroRef, { once: true, margin: '-40px' })
  const stepsInView = useInView(stepsRef, { once: true, margin: '-80px' })
  const exchangeInView = useInView(exchangeRef, { once: true, margin: '-80px' })
  const faqInView = useInView(faqRef, { once: true, margin: '-80px' })

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      {/* Hero */}
      <section ref={heroRef} className="relative w-full py-20 md:py-28 overflow-hidden">
        {/* Watermark */}
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.02] leading-none select-none pointer-events-none font-mono">
          GET
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <SectionHeader number="01" label="Getting Started" />

            <h1
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white mb-5 tracking-wide md:tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Get{' '}
              <span className="text-[#D4AF37]/80">Qubic</span>
            </h1>

            <p className="text-lg text-white/35 max-w-2xl mx-auto leading-relaxed">
              Your guide to buying QUBIC, setting up a wallet, and joining the
              Qubic Church community. From zero to NFT holder in 10 minutes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section ref={stepsRef} className="relative w-full py-20 md:py-28 overflow-hidden">
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
          02
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-5xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={stepsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionHeader number="02" label="Steps" />
            <h2
              className="text-2xl sm:text-3xl md:text-5xl text-white tracking-wide md:tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              3 Steps to{' '}
              <span className="text-[#D4AF37]/80">Begin</span>
            </h2>
          </motion.div>

          <div className="space-y-[1px] bg-white/[0.04]">
            {steps.map((step, idx) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={idx}
                  className="relative p-5 md:p-8 bg-[#050505] border border-white/[0.04] hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all duration-500 group overflow-hidden"
                  initial={{ opacity: 0, y: 24 }}
                  animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + idx * 0.12 }}
                >
                  {/* Top accent */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 transition-colors duration-500" />
                  {/* Corner dots */}
                  <div className="absolute top-2 right-2 w-1 h-1 bg-white/0 group-hover:bg-[#D4AF37]/30 transition-colors duration-500" />
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/0 group-hover:bg-white/10 transition-colors duration-500" />

                  <div className="flex items-start gap-5">
                    <div className="flex items-center justify-center w-10 h-10 border border-white/[0.06] group-hover:border-[#D4AF37]/15 transition-colors shrink-0">
                      <Icon className="w-5 h-5 text-[#D4AF37]/40 group-hover:text-[#D4AF37]/70 transition-colors" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[9px] font-mono font-bold text-[#D4AF37]/40 border border-[#D4AF37]/15 px-2 py-0.5 uppercase">
                          Step {step.step}
                        </span>
                        <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37]/90 transition-colors duration-500">{step.title}</h3>
                      </div>
                      <p className="text-sm text-white/35 mb-4">{step.description}</p>

                      <ul className="space-y-2 mb-5">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/25">
                            <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]/25 mt-0.5 shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>

                      <a
                        href={step.action.url}
                        target={step.action.url.startsWith('http') ? '_blank' : undefined}
                        rel={step.action.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37]/[0.04] border border-[#D4AF37]/15 text-[#D4AF37]/60 hover:bg-[#D4AF37]/[0.08] hover:border-[#D4AF37]/25 hover:text-[#D4AF37]/80 transition-all text-sm font-mono tracking-wider"
                      >
                        {step.action.label}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* Terminal line */}
                      <div className="border-t border-white/[0.04] pt-3 mt-5">
                        <code className="text-[10px] text-[#D4AF37]/20 font-mono">
                          $ {step.terminal}
                        </code>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Exchanges */}
      <section ref={exchangeRef} id="exchanges" className="relative w-full py-20 md:py-28 overflow-hidden">
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
          03
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-5xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={exchangeInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionHeader number="03" label="Exchanges" />
            <h2
              className="text-2xl sm:text-3xl md:text-5xl text-white tracking-wide md:tracking-wider uppercase mb-4"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Where to{' '}
              <span className="text-[#D4AF37]/80">Buy</span>
            </h2>
            <p className="text-white/30 text-sm font-mono">Available on multiple exchanges worldwide</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-[1px] bg-white/[0.04]">
            {exchanges.map((exchange, idx) => (
              <motion.a
                key={idx}
                href={exchange.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative p-5 md:p-6 bg-[#050505] border border-white/[0.04] hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all duration-500 group overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={exchangeInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 transition-colors duration-500" />
                <div className="absolute top-2 right-2 w-1 h-1 bg-white/0 group-hover:bg-[#D4AF37]/30 transition-colors duration-500" />

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37]/90 transition-colors duration-500">
                    {exchange.name}
                  </h3>
                  <span className="text-[9px] text-[#D4AF37]/25 font-mono border border-[#D4AF37]/10 px-2 py-0.5 uppercase">
                    {exchange.type}
                  </span>
                </div>
                <p className="text-sm text-white/30 mb-3">{exchange.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {exchange.pairs.map((pair) => (
                      <span key={pair} className="text-[10px] text-[#D4AF37]/25 bg-[#D4AF37]/[0.04] px-2 py-0.5 font-mono">
                        {pair}
                      </span>
                    ))}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/10 group-hover:text-[#D4AF37]/40 transition-colors" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} className="relative w-full py-20 md:py-28 overflow-hidden">
        <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
          04
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-4xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionHeader number="04" label="Knowledge" />
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
              Ready to{' '}
              <span className="text-[#D4AF37]/80">Join</span>?
            </h2>
            <p className="text-white/30 mb-10 text-sm font-mono">
              Get your QUBIC, grab an Anna NFT, and enter the 676M QUBIC giveaway.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wallet.qubic.org"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#D4AF37]/[0.04] border border-[#D4AF37]/15 text-white font-bold text-base hover:bg-[#D4AF37]/[0.08] hover:border-[#D4AF37]/25 transition-all duration-500 overflow-hidden font-mono tracking-wider"
              >
                {/* Shimmer */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-[#D4AF37]/[0.04] to-transparent" />
                <Wallet className="relative w-5 h-5 text-[#D4AF37]/40 group-hover:text-[#D4AF37]/60 transition-colors" />
                <span className="relative">GET YOUR WALLET</span>
              </a>
              <a
                href="https://qubicbay.io/collections/7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 border border-white/[0.06] text-white/50 font-bold text-base hover:border-white/15 hover:text-white/80 transition-all duration-500 font-mono tracking-wider"
              >
                Browse Anna NFTs
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[10px] text-white/15 mt-6 font-mono">
              $ wallet.qubic.org // Your key to the congregation
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
