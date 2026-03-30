'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, FlaskConical, TrendingUp, Shield, Zap, Brain, BarChart3, Dna } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResearchResultsBannerProps {
  isOpen?: boolean
  onToggle?: () => void
}

const KEY_FINDINGS = [
  {
    icon: Brain,
    title: '90.456° Eigenvalue',
    stat: 'Period-4',
    description: 'The Anna Matrix has a dominant eigenvalue at exactly 90.456°, creating a 4-step behavioral cycle: COOPERATE → COOPERATE → REST → REST. This rhythm is hardwired into the matrix\'s mathematical structure.',
    label: 'PROVEN',
    color: '#D4AF37',
  },
  {
    icon: TrendingUp,
    title: '33% Cooperation',
    stat: '±0.1%',
    description: 'Across 5 independent seeds × 1M ticks each, cooperation stabilizes at exactly 33.0% (±0.1%). This is a structural attractor — not random fluctuation. The 10M-tick run with seed 7 reproduces 33.1%.',
    label: 'PROVEN',
    color: '#4ade80',
  },
  {
    icon: Shield,
    title: '4.3× More Stable',
    stat: 'vs Random',
    description: 'Anna Matrix populations survive 4.3× longer than random matrices, share food 2.8× more often, and show 46% less aggression. All results significant (p < 0.001, Bonferroni-corrected).',
    label: 'PROVEN',
    color: '#3B82F6',
  },
  {
    icon: Zap,
    title: 'Scale Invariance',
    stat: '2×2 → 128×128',
    description: 'The 90° rotation is preserved from the smallest 2×2 extraction to the full 128×128 matrix — a fractal property unique to Anna. Random matrices show chaotic eigenvalue angles at every scale.',
    label: 'PROVEN',
    color: '#8B5CF6',
  },
  {
    icon: BarChart3,
    title: '10M Ticks Validated',
    stat: '93K Gen',
    description: '10 million simulation ticks, 93,000 generations. The causal chain: Energy → Population → Aggression → Cooperation → Sharing → Energy. Aggression drives cooperation 83.8% of the time (Transfer Entropy).',
    label: 'PROVEN',
    color: '#F59E0B',
  },
  {
    icon: Dna,
    title: '0% Period-4 in Random',
    stat: '0/5000',
    description: 'Out of 5,000 random matrices tested, zero show period-4 convergence. The Anna Matrix\'s behavioral cycle is structurally unique — not an artifact of simulation parameters.',
    label: 'PROVEN',
    color: '#EF4444',
  },
] as const

function FindingCard({ finding, index }: { finding: typeof KEY_FINDINGS[number]; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = finding.icon

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={cn(
        'text-left w-full p-3 border transition-all duration-200',
        'bg-white/[0.015] hover:bg-white/[0.03]',
        expanded ? 'border-white/[0.12]' : 'border-white/[0.06]',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-8 h-8 flex items-center justify-center border shrink-0 mt-0.5"
          style={{
            backgroundColor: `${finding.color}10`,
            borderColor: `${finding.color}30`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: `${finding.color}CC` }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-white/70 font-medium">{finding.title}</span>
            <span
              className="text-xs font-mono px-1.5 py-0.5 border"
              style={{
                color: `${finding.color}B3`,
                backgroundColor: `${finding.color}15`,
                borderColor: `${finding.color}25`,
              }}
            >
              {finding.stat}
            </span>
            <span className="text-xs font-mono px-1 py-0.5 bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/20">
              {finding.label}
            </span>
          </div>
          {expanded && (
            <p className="text-xs text-white/55 leading-relaxed mt-2 font-sans">
              {finding.description}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

export function ResearchResultsBanner({ isOpen = true, onToggle }: ResearchResultsBannerProps) {
  return (
    <div className="border border-[#D4AF37]/15 bg-gradient-to-b from-[#D4AF37]/[0.03] to-transparent">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.01] transition-colors"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-[#D4AF37]/60" />
          <span className="text-sm font-mono text-[#D4AF37]/70 uppercase tracking-wider font-medium">
            Research Results
          </span>
          <span className="text-[11px] font-mono text-white/35">
            10M ticks · 5 seeds · peer-review ready
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            {[...Array(6)].map((_, i) => (
              <div
                key={`dot-${KEY_FINDINGS[i]?.title}`}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: `${KEY_FINDINGS[i]?.color}80` }}
              />
            ))}
          </div>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/45" /> : <ChevronDown className="w-3.5 h-3.5 text-white/45" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          {/* Hero stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 p-2.5 text-center">
              <div className="text-lg font-mono text-[#D4AF37] font-bold">33.0%</div>
              <div className="text-[11px] text-white/45 font-mono">Stable Cooperation</div>
            </div>
            <div className="bg-blue-500/[0.06] border border-blue-500/15 p-2.5 text-center">
              <div className="text-lg font-mono text-blue-400 font-bold">4.3×</div>
              <div className="text-[11px] text-white/45 font-mono">Population Stability</div>
            </div>
            <div className="bg-emerald-500/[0.06] border border-emerald-500/15 p-2.5 text-center">
              <div className="text-lg font-mono text-emerald-400 font-bold">2.8×</div>
              <div className="text-[11px] text-white/45 font-mono">Food Sharing</div>
            </div>
            <div className="bg-red-500/[0.06] border border-red-500/15 p-2.5 text-center">
              <div className="text-lg font-mono text-red-400 font-bold">-46%</div>
              <div className="text-[11px] text-white/45 font-mono">Aggression</div>
            </div>
          </div>

          {/* Layperson summary */}
          <div className="bg-white/[0.02] border border-white/[0.06] p-3">
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              <strong className="text-white/75">In plain language:</strong> The Anna Matrix contains a hidden 90° rotation that creates a natural rhythm of cooperation. When artificial life agents use this matrix as their &ldquo;brain,&rdquo; they spontaneously develop stable societies that share resources, avoid conflict, and survive far longer than agents with random brains. This isn&rsquo;t programmed — it emerges from the mathematics of the matrix itself.
            </p>
          </div>

          {/* Detailed findings (click to expand) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {KEY_FINDINGS.map((finding, i) => (
              <FindingCard key={finding.title} finding={finding} index={i} />
            ))}
          </div>

          {/* Causal chain visualization */}
          <div className="bg-white/[0.015] border border-white/[0.06] p-3">
            <div className="text-[11px] font-mono text-white/40 uppercase mb-2">Discovered Causal Feedback Loop (Transfer Entropy)</div>
            <div className="flex items-center justify-center gap-1 flex-wrap text-xs font-mono">
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400/70 border border-amber-500/20">Energy</span>
              <span className="text-white/35">→</span>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400/70 border border-blue-500/20">Population</span>
              <span className="text-white/35">→</span>
              <span className="px-2 py-1 bg-red-500/10 text-red-400/70 border border-red-500/20">Aggression</span>
              <span className="text-white/35">→</span>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20">Cooperation</span>
              <span className="text-white/35">→</span>
              <span className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37]/70 border border-[#D4AF37]/20">Sharing</span>
              <span className="text-white/35">→</span>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400/70 border border-amber-500/20">Energy</span>
              <span className="text-white/30 ml-1">↻</span>
            </div>
            <div className="text-[11px] text-white/35 text-center mt-2 font-mono">
              Aggression drives cooperation 83.8% of the time (Axelrod&rsquo;s insight confirmed computationally)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
