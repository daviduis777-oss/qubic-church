'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Calculator, CheckCircle, XCircle, Lightbulb, HelpCircle, ExternalLink } from 'lucide-react'

export function Phase06_TheFormula() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })
  const [blockInput, setBlockInput] = useState('')
  const [verificationResult, setVerificationResult] = useState<'correct' | 'incorrect' | null>(null)
  const [showFormula, setShowFormula] = useState(false)
  const [formulaStep, setFormulaStep] = useState(0)

  // Animate formula reveal
  useEffect(() => {
    if (isInView) {
      const timer1 = setTimeout(() => setShowFormula(true), 500)
      const timer2 = setTimeout(() => setFormulaStep(1), 1000)
      const timer3 = setTimeout(() => setFormulaStep(2), 1500)
      const timer4 = setTimeout(() => setFormulaStep(3), 2000)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
      }
    } else {
      setShowFormula(false)
      setFormulaStep(0)
    }
  }, [isInView])

  const handleVerify = () => {
    const blockNum = parseInt(blockInput, 10)
    if (blockNum === 283) {
      setVerificationResult('correct')
    } else {
      setVerificationResult('incorrect')
    }
  }

  return (
    <PhaseWrapper
      id="formula"
      phaseNumber={6}
      title="The Formula"
      subtitle="The mathematical equation that bridges Bitcoin and Qubic"
    >
      <div ref={ref} className="space-y-8">
        {/* Formula Reveal Card */}
        <motion.div
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#050505] to-black/50 border border-[#D4AF37]/20 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-4 right-4 opacity-10">
            <Lightbulb className="w-16 h-16 text-[#D4AF37]" />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-sm text-[#D4AF37]/80 font-medium">The Discovery</span>
          </div>

          <p className="text-white/70 mb-6 leading-relaxed">
            A specific cell in Qubic's memory grid (position{' '}
            <span className="text-[#D4AF37] font-mono font-bold">625,284</span>) connects back to
            Bitcoin's earliest days through this equation:
          </p>

          {/* Animated Formula */}
          <AnimatePresence>
            {showFormula && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-black/40 mb-6"
              >
                <p className="text-sm text-white/40 text-center mb-4">The equation:</p>
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 font-mono text-2xl md:text-4xl">
                  <motion.span
                    className="text-[#D4AF37] font-bold relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: formulaStep >= 0 ? 1 : 0, y: formulaStep >= 0 ? 0 : 20 }}
                  >
                    625,284
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[#D4AF37]/60 whitespace-nowrap">
                      Qubic Position
                    </span>
                  </motion.span>

                  <motion.span
                    className="text-white/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: formulaStep >= 1 ? 1 : 0 }}
                  >
                    =
                  </motion.span>

                  <motion.span
                    className="text-[#D4AF37] font-bold relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: formulaStep >= 1 ? 1 : 0, y: formulaStep >= 1 ? 0 : 20 }}
                  >
                    283
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[#D4AF37]/60 whitespace-nowrap">
                      Bitcoin Block
                    </span>
                  </motion.span>

                  <motion.span
                    className="text-white/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: formulaStep >= 2 ? 1 : 0 }}
                  >
                    x
                  </motion.span>

                  <motion.span
                    className="text-white font-bold"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: formulaStep >= 2 ? 1 : 0, y: formulaStep >= 2 ? 0 : 20 }}
                  >
                    47<sup className="text-lg">2</sup>
                  </motion.span>

                  <motion.span
                    className="text-white/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: formulaStep >= 3 ? 1 : 0 }}
                  >
                    +
                  </motion.span>

                  <motion.span
                    className="text-[#D4AF37] font-bold relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: formulaStep >= 3 ? 1 : 0, y: formulaStep >= 3 ? 0 : 20 }}
                  >
                    137
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[#D4AF37]/60 whitespace-nowrap">
                      Physics Constant
                    </span>
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step by Step */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: isInView && formulaStep >= 3 ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="p-3 bg-black/30 text-center">
              <div className="text-xs text-white/40 mb-1">Step 1: 47^2 =</div>
              <div className="font-mono text-lg text-white">2,209</div>
            </div>
            <div className="p-3 bg-black/30 text-center">
              <div className="text-xs text-white/40 mb-1">Step 2: 283 x 2,209 =</div>
              <div className="font-mono text-lg text-white">625,147</div>
            </div>
            <div className="p-3 bg-black/30 text-center">
              <div className="text-xs text-white/40 mb-1">Step 3: 625,147 + 137 =</div>
              <div className="font-mono text-lg text-[#D4AF37]">625,284</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Interactive Calculator */}
        <motion.div
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-white/40" />
            <h3 className="font-semibold text-white/80">Try It Yourself</h3>
          </div>

          <p className="text-sm text-white/60 mb-4">
            Which Bitcoin block number produces{' '}
            <span className="text-[#D4AF37] font-mono">625,284</span> using the formula{' '}
            <span className="font-mono text-white/70">n x 47^2 + 137</span>?
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="number"
              value={blockInput}
              onChange={(e) => {
                setBlockInput(e.target.value)
                setVerificationResult(null)
              }}
              placeholder="Enter a block number..."
              className="flex-1 px-4 py-3 bg-black/40 border border-white/10 text-white placeholder:text-white/30 font-mono focus:outline-none focus:border-[#D4AF37]/30 focus:ring-2 focus:ring-purple-500/20 transition-colors"
            />
            <button
              onClick={handleVerify}
              disabled={!blockInput}
              className="px-6 py-3 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[#D4AF37] font-medium"
            >
              Calculate
            </button>
          </div>

          <AnimatePresence>
            {verificationResult && (
              <motion.div
                className={`mt-4 p-4 flex items-center gap-3 ${
                  verificationResult === 'correct'
                    ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20'
                    : 'bg-[#D4AF37]/10 border border-[#D4AF37]/20'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {verificationResult === 'correct' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0" />
                    <div>
                      <div className="font-medium text-[#D4AF37]">Correct!</div>
                      <div className="text-sm text-[#D4AF37]/70">283 x 2,209 + 137 = 625,284</div>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-[#D4AF37] shrink-0" />
                    <div>
                      <div className="font-medium text-[#D4AF37]">Not quite. Try again!</div>
                      <div className="text-sm text-[#D4AF37]/70">
                        {blockInput} x 2,209 + 137 ={' '}
                        <span className="font-mono">
                          {(parseInt(blockInput || '0', 10) * 2209 + 137).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Component Explanation */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="p-5 bg-orange-500/5 border border-orange-500/20">
            <div className="text-3xl font-mono font-bold text-[#D4AF37] mb-2">283</div>
            <div className="text-sm text-white/70 font-medium mb-1">Prime Number</div>
            <p className="text-xs text-white/50">
              Bitcoin Block #283, mined January 12, 2009 - one of Bitcoin's first blocks
            </p>
          </div>
          <div className="p-5 bg-white/5 border border-white/20">
            <div className="text-3xl font-mono font-bold text-white mb-2">47</div>
            <div className="text-sm text-white/70 font-medium mb-1">Qubic Prime</div>
            <p className="text-xs text-white/50">Squared (47^2 = 2,209) as the scaling factor</p>
          </div>
          <div className="p-5 bg-[#D4AF37]/5 border border-green-500/20">
            <div className="text-3xl font-mono font-bold text-[#D4AF37] mb-2">137</div>
            <div className="text-sm text-white/70 font-medium mb-1">Physics Magic Number</div>
            <p className="text-xs text-white/50 mb-2">
              A famous constant that physicists call "the most mysterious number in physics"
            </p>
            <a
              href="https://en.wikipedia.org/wiki/Fine-structure_constant"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:text-green-300 transition-colors"
            >
              Learn more <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

        <CollapsibleSection
          title="Why these specific numbers?"
          icon={<HelpCircle className="w-4 h-4" />}
        >
          <div className="space-y-3 text-sm text-white/70">
            <p>All three numbers are prime (only divisible by 1 and themselves):</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <span className="text-[#D4AF37]">283</span> - This specific Bitcoin block from the
                first week
              </li>
              <li>
                <span className="text-white">47</span> - Appears repeatedly in Qubic's design
              </li>
              <li>
                <span className="text-[#D4AF37]">137</span> - Famous in physics as a "magic number"
              </li>
            </ul>
            <p className="text-white/50 italic mt-2">
              The odds of these three numbers combining to create a meaningful address by accident?
              About 1 in 12.8 million.
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
            href="/docs/03-results/01-bitcoin-bridge"
            title="The Data Bridge"
            tier={1}
          />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
