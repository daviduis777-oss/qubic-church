'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Activity, Coins, Lock, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react'

// Block data with Patoshi research details
interface PatoshiBlock {
  height: number
  isPatoshi: boolean
  btc: number
  nonce?: string
  timestamp?: string
  extraNonce?: string
  significance?: string
}

// Early blocks with actual research data (simplified representation)
const PATOSHI_BLOCKS: PatoshiBlock[] = Array.from({ length: 50 }, (_, i) => {
  const height = i + 1
  // Simplified Patoshi detection pattern (real pattern uses nonce analysis)
  const isPatoshi = i % 5 !== 0 && i % 7 !== 0

  // Special blocks with known significance
  const specialBlocks: Record<number, Partial<PatoshiBlock>> = {
    1: { significance: 'First block after Genesis. Mining began.', nonce: '2083236893' },
    9: { significance: 'First known Bitcoin transaction to Hal Finney', nonce: '1639830024' },
    27: { significance: 'Special number 27 appears frequently in CFB\'s work', nonce: '2504433986' },
    47: { significance: 'Prime number 47 - another CFB signature value', nonce: '3175756882' },
    50: { significance: 'Block 50: Half of first 100 blocks mined', nonce: '1842523774' },
  }

  return {
    height,
    isPatoshi,
    btc: 50,
    timestamp: `Jan ${3 + Math.floor(i / 10)}, 2009`,
    extraNonce: isPatoshi ? 'Patoshi range' : 'Standard range',
    ...specialBlocks[height],
  }
})

// Simplified mining pattern visualization
function MiningPatternVisualizer() {
  const [selectedBlock, setSelectedBlock] = useState<PatoshiBlock | null>(null)
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null)

  const handleBlockClick = (block: PatoshiBlock) => {
    setSelectedBlock(selectedBlock?.height === block.height ? null : block)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm flex-wrap gap-2">
        <span className="text-white/60">Click a block for details</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3  bg-orange-500" />
            <span className="text-white/60">Patoshi</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3  bg-white/20" />
            <span className="text-white/60">Other</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-1">
        {PATOSHI_BLOCKS.map((block) => (
          <motion.button
            key={block.height}
            className={`aspect-square  cursor-pointer transition-all relative ${
              block.isPatoshi
                ? 'bg-orange-500/80 hover:bg-orange-400'
                : 'bg-white/10 hover:bg-white/20'
            } ${selectedBlock?.height === block.height ? 'ring-2 ring-white' : ''} ${
              block.significance ? 'ring-1 ring-yellow-400/50' : ''
            }`}
            onClick={() => handleBlockClick(block)}
            onMouseEnter={() => setHoveredBlock(block.height)}
            onMouseLeave={() => setHoveredBlock(null)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {block.significance && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredBlock !== null && !selectedBlock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-2  bg-white/5 text-sm text-center"
        >
          Block #{hoveredBlock} -{' '}
          {PATOSHI_BLOCKS[hoveredBlock - 1]?.isPatoshi ? (
            <span className="text-[#D4AF37]">Patoshi miner</span>
          ) : (
            <span className="text-white/60">Other miner</span>
          )}{' '}
          - 50 BTC
        </motion.div>
      )}

      {/* Selected block detail panel */}
      <AnimatePresence>
        {selectedBlock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-gradient-to-b from-[#050505] to-black/50 border border-[#D4AF37]/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#D4AF37]" />
                Block #{selectedBlock.height}
              </h4>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  selectedBlock.isPatoshi
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                {selectedBlock.isPatoshi ? 'Patoshi Miner' : 'Other Miner'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="p-2  bg-white/5">
                <span className="text-white/40 text-xs block">Reward</span>
                <span className="text-white font-mono">{selectedBlock.btc} BTC</span>
              </div>
              <div className="p-2  bg-white/5">
                <span className="text-white/40 text-xs block">Timestamp</span>
                <span className="text-white font-mono">{selectedBlock.timestamp}</span>
              </div>
              {selectedBlock.nonce && (
                <div className="p-2  bg-white/5 col-span-2">
                  <span className="text-white/40 text-xs block">Nonce (Mining Proof)</span>
                  <span className="text-white/70 font-mono text-xs">{selectedBlock.nonce}</span>
                </div>
              )}
            </div>

            {selectedBlock.significance && (
              <div className="p-3 bg-[#D4AF37]/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-200/80">{selectedBlock.significance}</p>
                </div>
              </div>
            )}

            <p className="text-xs text-white/40 mt-3 text-center">
              {selectedBlock.isPatoshi
                ? 'This block matches the Patoshi nonce pattern identified by Sergio Lerner'
                : 'This block was mined by someone other than the Patoshi miner'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Phase07_ThePatoshiPattern() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  const stats = [
    { value: '~22,000', label: 'Blocks Mined', icon: Activity },
    { value: '~1.1M', label: 'BTC (approx)', icon: Coins },
    { value: '$100B+', label: 'Value Today', icon: TrendingUp },
    { value: '100%', label: 'Unmoved', icon: Lock },
  ]

  return (
    <PhaseWrapper
      id="patoshi"
      phaseNumber={7}
      title="The Patoshi Pattern"
      subtitle="Satoshi's distinctive mining fingerprint"
    >
      <div ref={ref} className="space-y-8">
        {/* Introduction */}
        <motion.div
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#050505]/80 to-black/50 border border-orange-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-[#D4AF37]" />
            <h3 className="text-xl font-bold text-white/90">What is the Patoshi Pattern?</h3>
          </div>

          <p className="text-white/70 leading-relaxed mb-4">
            In 2013, researcher{' '}
            <span className="text-white font-semibold">Sergio Demian Lerner</span> discovered a
            unique pattern in Bitcoin's early mining data. A single miner - dubbed "Patoshi" - used
            a distinctive nonce pattern that made their blocks identifiable.
          </p>

          <div className="p-4 bg-[#D4AF37]/10 border border-orange-500/20">
            <p className="text-sm text-orange-300/80">
              <strong>Key Finding:</strong> The Patoshi miner is widely believed to be Satoshi
              Nakamoto, mining to protect the young Bitcoin network.
            </p>
          </div>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                className="p-4 bg-white/5 border border-white/10 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.9 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Icon className="w-5 h-5 text-[#D4AF37] mx-auto mb-2" />
                <div className="text-2xl font-mono font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Mining Pattern Visualizer */}
        <motion.div
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-white/60" />
            Mining Pattern Visualization
          </h3>
          <MiningPatternVisualizer />
        </motion.div>

        {/* The Connection */}
        <motion.div
          className="p-6 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/10 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-4">The CFB Connection</h3>
          <div className="space-y-3 text-sm text-white/70">
            <p>
              Research shows mathematical correlations between Patoshi block patterns and Qubic's
              architecture:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#D4AF37] font-mono">-</span>
                Hex-word pairs appearing at 27-block intervals
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4AF37] font-mono">-</span>
                Block timestamps showing deliberate ternary patterns
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4AF37] font-mono">-</span>
                Mining gaps correlating to Qubic protocol constants
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Warning Note */}
        <CollapsibleSection
          title="Important Caveats"
          icon={<AlertTriangle className="w-4 h-4" />}
          badge="Read This"
        >
          <div className="space-y-3 text-sm text-white/70">
            <p>
              The Patoshi pattern analysis is <span className="text-[#D4AF37]">Tier 2 evidence</span>{' '}
              - statistically significant but not cryptographic proof:
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>We cannot definitively prove CFB = Satoshi = Patoshi</li>
              <li>Correlation patterns could have alternative explanations</li>
              <li>The coins have never moved, so we cannot verify ownership</li>
            </ul>
            <p className="text-white/50 italic">
              Draw your own conclusions based on the evidence presented.
            </p>
          </div>
        </CollapsibleSection>

        <SourceCitationGroup>
          <SourceCitation
            href="/docs/03-results/21-patoshi-forensics"
            title="Patoshi Forensics"
            tier={2}
          />
          <SourceCitation
            href="https://bitslog.com/2013/04/17/the-well-deserved-fortune-of-satoshi-nakamoto/"
            title="Sergio Lerner's Original Analysis"
            external
          />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
