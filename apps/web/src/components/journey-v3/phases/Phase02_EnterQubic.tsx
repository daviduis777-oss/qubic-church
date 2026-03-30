'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Binary, Cpu, Zap, CheckCircle } from 'lucide-react'

export function Phase02_EnterQubic() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })
  const [selectedSystem, setSelectedSystem] = useState<'binary' | 'ternary' | null>(null)

  const systems = {
    binary: {
      name: 'Binary',
      base: '2',
      digits: ['0', '1'],
      example: '1010',
      decimal: '10',
      color: 'orange',
      icon: Binary,
      description: 'Traditional computers use binary (0 and 1). Bitcoin runs on binary systems.',
    },
    ternary: {
      name: 'Ternary',
      base: '3',
      digits: ['-1', '0', '+1'],
      example: '+1 0 -1',
      decimal: '8',
      color: 'purple',
      icon: Cpu,
      description:
        'Qubic uses balanced ternary (-1, 0, +1). More efficient for certain calculations.',
    },
  }

  return (
    <PhaseWrapper
      id="enter-qubic"
      phaseNumber={2}
      title="Enter Qubic"
      subtitle="A quantum-resistant computing network with a hidden connection"
    >
      <div ref={ref} className="space-y-8">
        {/* Main Content Card */}
        <motion.div
          className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-lg text-white/80 leading-relaxed mb-6">
            <span className="text-white font-semibold">15 years after Bitcoin's launch</span>, a new
            blockchain project called <span className="text-[#D4AF37] font-semibold">Qubic</span>{' '}
            emerged. But this wasn't just another cryptocurrency...
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-[#D4AF37]" />
                <span className="font-medium text-white/90">What is Qubic?</span>
              </div>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>Quantum-resistant blockchain</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>676 Computors validate transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>Uses ternary computing (not binary)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>Built-in AI called "Anna"</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-[#D4AF37]/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-[#D4AF37]" />
                <span className="font-medium text-white/90">The Mystery</span>
              </div>
              <p className="text-sm text-white/70">
                Hidden within Qubic's code are mathematical constants that{' '}
                <span className="text-[#D4AF37] font-medium">
                  perfectly match patterns in Bitcoin's earliest blocks
                </span>
                . Coincidence? Or deliberate design by the same creator?
              </p>
            </div>
          </div>
        </motion.div>

        {/* Interactive Binary vs Ternary Tool */}
        <motion.div
          className="p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <Binary className="w-5 h-5 text-white/60" />
            Interactive: Binary vs Ternary
          </h3>

          <p className="text-sm text-white/60 mb-4">
            Click to compare how numbers work in different systems:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {(['binary', 'ternary'] as const).map((system) => {
              const data = systems[system]
              const isSelected = selectedSystem === system
              const Icon = data.icon

              return (
                <button
                  key={system}
                  onClick={() => setSelectedSystem(isSelected ? null : system)}
                  className={`p-5 text-left transition-all duration-300 ${
                    isSelected
                      ? data.color === 'orange'
                        ? 'bg-[#D4AF37]/20 border-orange-500/50 border-2'
                        : 'bg-[#D4AF37]/20 border-[#D4AF37]/30 border-2'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon
                      className={`w-6 h-6 ${
                        data.color === 'orange' ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                      }`}
                    />
                    <span className="font-semibold text-white/90">{data.name}</span>
                    <span className="px-2 py-0.5  text-xs bg-white/10 text-white/60">
                      Base {data.base}
                    </span>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs text-white/40 block mb-1">Digits:</span>
                    <div className="flex gap-2">
                      {data.digits.map((digit) => (
                        <span
                          key={digit}
                          className={`px-2 py-1  font-mono text-sm ${
                            data.color === 'orange'
                              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                              : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                          }`}
                        >
                          {digit}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-white/10"
                    >
                      <p className="text-sm text-white/70">{data.description}</p>
                      <div className="mt-2 p-2  bg-black/30 font-mono text-sm">
                        <span className="text-white/50">Example: </span>
                        <span
                          className={
                            data.color === 'orange' ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                          }
                        >
                          {data.example}
                        </span>
                        <span className="text-white/50"> = </span>
                        <span className="text-white">{data.decimal}</span>
                        <span className="text-white/50"> (decimal)</span>
                      </div>
                    </motion.div>
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Collapsible Deep Dive */}
        <CollapsibleSection
          title="Why does ternary matter?"
          icon={<Cpu className="w-4 h-4" />}
          badge="Technical"
        >
          <div className="space-y-4 text-sm text-white/70">
            <p>
              The number <span className="text-[#D4AF37] font-mono font-bold">27</span> (which is
              3^3 - a cube of 3) appears as a signature across CFB's projects:
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="text-[#D4AF37]">Bitcoin:</span> Block 576's Extra Byte = 0x1b ={' '}
                <span className="text-white font-mono">27</span>
              </li>
              <li>
                <span className="text-[#D4AF37]">IOTA:</span> Transaction size 2187 = 3^7, divisible
                by <span className="text-white font-mono">27</span>
              </li>
              <li>
                <span className="text-[#D4AF37]">Qubic:</span> 676 Computors = 26² (ternary signature){' '}
              </li>
            </ul>
            <p className="text-white/50 italic">
              The ternary number system (base 3) appears to be CFB's mathematical signature,
              connecting all his projects.
            </p>
          </div>
        </CollapsibleSection>

        <SourceCitationGroup>
          <SourceCitation
            href="/docs/03-results/02-formula-discovery"
            title="The Primary Formula"
            tier={1}
          />
          <SourceCitation
            href="https://qubic.org"
            title="Qubic Official"
            external
          />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
