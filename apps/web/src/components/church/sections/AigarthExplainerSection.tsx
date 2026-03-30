'use client'

/**
 * AigarthExplainerSection - Section 04: What is Aigarth?
 * HUD style with neural pulse animation and data-stream layer visualization
 */

import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Cpu, ChevronRight } from 'lucide-react'

const ternaryStates = [
  { value: '+1', name: 'Activated', description: 'Neuron fires', color: 'text-[#D4AF37]/80', border: 'border-[#D4AF37]/20', glow: 'shadow-[0_0_15px_rgba(212,175,55,0.1)]' },
  { value: '0', name: 'Neutral', description: 'Resting state', color: 'text-[#D4AF37]/80', border: 'border-[#D4AF37]/20', glow: 'shadow-[0_0_15px_rgba(212,175,55,0.1)]' },
  { value: '-1', name: 'Inhibited', description: 'Suppressed', color: 'text-red-400/80', border: 'border-red-500/20', glow: 'shadow-[0_0_15px_rgba(248,113,113,0.1)]' },
]

const architectureLayers = [
  { rows: '0-20', name: 'Initialization', description: 'Bootstrap and initial state configuration', highlight: false, width: '35%' },
  { rows: '21', name: 'Input Row', description: 'Hypothesized external data input layer', highlight: true, width: '100%' },
  { rows: '22-67', name: 'Processing', description: 'Feature extraction and pattern recognition layers', highlight: false, width: '70%' },
  { rows: '68', name: 'Central Row', description: 'Structurally significant \u2014 highest asymmetric cell density', highlight: true, width: '100%' },
  { rows: '69-95', name: 'Deep Layers', description: 'Deeper processing and state abstraction', highlight: false, width: '55%' },
  { rows: '96', name: 'Output Row', description: 'Final state computation and output', highlight: true, width: '100%' },
]

const benefits = [
  { title: 'More Dense', desc: '58.5% more information per unit than binary systems', icon: '1.585' },
  { title: 'Uncertainty', desc: 'Can represent "unknown" as a native, first-class state', icon: '?' },
  { title: 'Efficient', desc: 'Ternary logic enables compact representation of complex states', icon: '<>' },
  { title: 'Biological', desc: 'Matches real neuron excitation/inhibition behavior', icon: '~' },
]

/* Pulsing neural dot */
function NeuralPulse({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-[#D4AF37]/40"
      animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.5, 0.5] }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

export function AigarthExplainerSection() {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section ref={sectionRef} className="relative w-full py-28 md:py-36 overflow-hidden">
      {/* Decorative section number */}
      <div aria-hidden="true" className="absolute top-16 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono">
        04
      </div>

      {/* Neural pulse dots scattered */}
      <NeuralPulse delay={0} />
      <div className="absolute top-[30%] left-[15%]"><NeuralPulse delay={1.2} /></div>
      <div className="absolute top-[60%] right-[20%]"><NeuralPulse delay={2.4} /></div>
      <div className="absolute bottom-[25%] left-[40%]"><NeuralPulse delay={0.6} /></div>

      <div className="relative z-10 container mx-auto px-6 max-w-5xl">

        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              04 &mdash; Architecture
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white mb-8 tracking-wide md:tracking-wider uppercase"
          >
            What is <span className="text-[#D4AF37]/80">Aigarth</span>?
          </h2>

          <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed">
            Aigarth Intelligent Tissue 1.0 is a{' '}
            <span className="text-white/90 border-b border-[#D4AF37]/20">publicly verifiable ternary neural network</span>{' '}
            &mdash; designed by Come-From-Beyond as the core of Qubic&apos;s architecture.
          </p>
        </motion.div>

        {/* Binary vs Ternary Comparison */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="text-[#D4AF37]/30 text-[11px] uppercase tracking-[0.4em] mb-6 text-center font-mono">
            // ternary.compare(binary)
          </div>

          <div className="grid md:grid-cols-2 gap-[1px] bg-white/[0.04]">
            {/* Binary Card */}
            <div className="relative bg-[#050505] border border-white/[0.04] p-8 group hover:bg-[#0a0a0a] transition-colors duration-500">
              <div className="text-white/20 text-[10px] uppercase tracking-[0.4em] mb-4 font-mono">
                <span className="text-red-400/30">deprecated</span> // Traditional
              </div>
              <h4 className="text-xl font-semibold text-white/40 mb-6">Binary</h4>

              <div className="flex justify-center gap-4 mb-6">
                {['0', '1'].map((v) => (
                  <div key={v} className="w-16 h-16 border border-white/[0.06] flex items-center justify-center bg-white/[0.01]">
                    <span className="text-2xl font-mono text-white/30">{v}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-white/25 text-center font-mono">
                2 states = 1 bit
              </p>
              {/* Strike-through effect */}
              <div className="absolute inset-0 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-full h-px bg-red-500/10" />
              </div>
            </div>

            {/* Ternary Card */}
            <div className="relative bg-[#050505] border border-[#D4AF37]/[0.06] p-8 group hover:bg-[#0a0a0a] transition-colors duration-500">
              <div className="text-[#D4AF37]/40 text-[10px] uppercase tracking-[0.4em] mb-4 font-mono">
                <span className="text-[#D4AF37]/40">active</span> // Aigarth
              </div>
              <h4 className="text-xl font-semibold text-white mb-6">Ternary</h4>

              <div className="flex justify-center gap-3 mb-6">
                {ternaryStates.map((state) => (
                  <motion.div
                    key={state.value}
                    className={`w-16 h-16 ${state.border} border flex flex-col items-center justify-center bg-white/[0.01] ${state.glow}`}
                    whileHover={{ scale: 1.08 }}
                  >
                    <span className={`text-xl font-mono font-bold ${state.color}`}>
                      {state.value}
                    </span>
                    <span className="text-[9px] text-white/30 mt-0.5 font-mono">{state.name}</span>
                  </motion.div>
                ))}
              </div>

              <p className="text-sm text-white/40 text-center font-mono">
                3 states = <span className="text-[#D4AF37]/70">1.585 bits</span> &rarr; +58.5%
              </p>
            </div>
          </div>
        </motion.div>

        {/* Why Ternary Matters - with data icons */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="text-[#D4AF37]/30 text-[11px] uppercase tracking-[0.4em] mb-6 text-center font-mono">
            // advantages.list()
          </div>

          <div className="grid md:grid-cols-2 gap-[1px] bg-white/[0.04]">
            {benefits.map((item, index) => (
              <motion.div
                key={index}
                className="relative p-6 bg-[#050505] border border-white/[0.04] transition-all duration-500 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 + index * 0.08 }}
              >
                {/* Left accent line - appears on hover */}
                <div className="absolute top-0 left-0 w-px h-full bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/25 transition-colors duration-500" />

                <div className="flex items-start gap-4">
                  {/* Data icon */}
                  <div className="w-10 h-10 border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-[#D4AF37]/15 transition-colors font-mono text-white/20 group-hover:text-[#D4AF37]/40 text-sm">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-white/35 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Architecture Visualization - with animated bars */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          <div className="text-[#D4AF37]/30 text-[11px] uppercase tracking-[0.4em] mb-6 text-center font-mono">
            // matrix.layers(128, 128)
          </div>

          <h3
            className="text-2xl md:text-3xl text-white mb-10 text-center tracking-wider uppercase"
          >
            The 128 x 128 Neural Matrix
          </h3>

          <div className="relative bg-[#050505] border border-white/[0.06] p-5 md:p-8 lg:p-10">
            {/* Corner dots */}
            <div className="absolute top-2 left-2 w-1 h-1 bg-[#D4AF37]/20" />
            <div className="absolute top-2 right-2 w-1 h-1 bg-[#D4AF37]/20" />
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-[#D4AF37]/20" />
            <div className="absolute bottom-2 right-2 w-1 h-1 bg-[#D4AF37]/20" />

            <div className="flex items-center justify-center gap-3 mb-8">
              <Cpu className="w-5 h-5 text-[#D4AF37]/30" />
              <span className="text-lg font-mono text-white/60">
                <span className="text-[#D4AF37]/50">16,384</span> Neurons
              </span>
            </div>

            {/* Layer bars - with animated width */}
            <div className="space-y-1 max-w-lg mx-auto">
              {architectureLayers.map((layer, index) => {
                const isHovered = hoveredLayer === index
                return (
                  <motion.div
                    key={index}
                    className={`group flex items-center gap-2 md:gap-4 px-2 md:px-4 py-3 transition-all duration-300 cursor-pointer border-l-2 ${
                      layer.highlight
                        ? 'border-l-[#D4AF37]/40 bg-[#D4AF37]/[0.02]'
                        : 'border-l-white/[0.04] hover:border-l-white/[0.12] hover:bg-white/[0.01]'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.3 + index * 0.06 }}
                    onMouseEnter={() => setHoveredLayer(index)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <span className="w-12 md:w-16 text-[10px] md:text-[11px] font-mono text-white/30 group-hover:text-white/50 transition-colors shrink-0">
                      Row {layer.rows}
                    </span>

                    {/* Animated bar fill */}
                    <div className="flex-1 h-1 bg-white/[0.03] overflow-hidden">
                      <motion.div
                        className={`h-full ${layer.highlight ? 'bg-[#D4AF37]/30' : 'bg-white/[0.06]'}`}
                        initial={{ width: '0%' }}
                        whileInView={{ width: layer.width }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                      />
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-sm font-mono transition-colors ${
                        layer.highlight ? 'text-[#D4AF37]/70' : 'text-white/40 group-hover:text-white/60'
                      }`}>
                        {layer.name}
                      </span>
                    </div>

                    <motion.div
                      animate={{ x: isHovered ? 2 : 0, opacity: isHovered ? 0.4 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronRight className="w-4 h-4 text-[#D4AF37]/30" />
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>

            {/* Hovered layer description */}
            <div className="h-10 mt-6 flex items-center justify-center">
              {hoveredLayer !== null && (
                <motion.p
                  key={hoveredLayer}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-white/40 text-center font-mono"
                >
                  <span className="text-[#D4AF37]/30">// </span>
                  {architectureLayers[hoveredLayer]?.description}
                </motion.p>
              )}
            </div>

            {/* Key Discovery callout */}
            <div className="mt-8 p-5 border-l-2 border-l-[#D4AF37]/25 bg-[#D4AF37]/[0.015]">
              <p className="text-sm text-white/50 leading-relaxed">
                <span className="text-[#D4AF37]/50 font-mono text-[10px] uppercase tracking-wider">RESEARCH HYPOTHESIS:</span>{' '}
                <span className="text-white/70">Row 21 may serve as a Bitcoin Input Layer</span> &mdash; where Bitcoin block data could enter the neural network. This interpretation is under active investigation.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <a
            href="/docs"
            className="group inline-flex items-center gap-2.5 px-8 py-4 bg-[#050505] border border-white/[0.06] text-white/80 hover:bg-[#0a0a0a] hover:border-[#D4AF37]/15 transition-all duration-300 font-mono text-sm"
          >
            <span className="text-[#D4AF37]/25">&gt;</span>
            Read Full Technical Docs
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37]/40 group-hover:translate-x-1 transition-all" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
