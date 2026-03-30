'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, Eye, Atom, Brain, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WhatAmISeeingProps {
  mode: string
  comparisonMode: string
  isOpen: boolean
  onToggle: () => void
}

const CONCEPTS = [
  {
    icon: Atom,
    title: 'What is Particle Life?',
    content: 'Imagine hundreds of colored dots floating in space. Each color has rules for how it interacts with other colors — some attract, some repel, some are neutral. From these simple rules, complex patterns emerge: swarms, crystals, predator-prey chases, and cooperative clusters. No pattern is programmed — everything you see is emergent.',
    color: '#D4AF37',
  },
  {
    icon: Brain,
    title: 'What is the Anna Matrix?',
    content: 'The Anna Matrix is a 128×128 grid of numbers discovered in the Aigarth neural network system. It has remarkable mathematical properties: near-perfect symmetry (99.58%), exactly 8 energy levels, and a dominant eigenvalue at 90° that creates a natural rhythm of cooperation. When used as the "rules" for particle life, it produces fundamentally different behavior than random matrices.',
    color: '#8B5CF6',
  },
  {
    icon: Eye,
    title: 'What Should I Watch For?',
    content: 'Look for clusters forming (dots of the same color grouping together), cooperative structures (different colors living near each other peacefully), pursuit patterns (one color chasing another), and stable equilibria (everything settles into a calm pattern). The Anna Matrix tends to create stable, cooperative structures. Random matrices create chaos.',
    color: '#3B82F6',
  },
  {
    icon: Lightbulb,
    title: 'Why Does This Matter?',
    content: 'This demonstrates that mathematical structure can encode cooperation. The Anna Matrix doesn\'t "know" about cooperation — it\'s just numbers. But its 90° eigenvalue creates a period-4 cycle (cooperate, cooperate, rest, rest) that leads to stable societies. This is a potential bridge between mathematics, artificial life, and the emergence of social behavior.',
    color: '#4ade80',
  },
] as const

const METRIC_EXPLANATIONS = [
  { metric: 'Kinetic Energy', plain: 'How fast everything is moving. High = chaotic, Low = calm.', technical: 'E/N = avg(vx² + vy²)' },
  { metric: 'Segregation', plain: 'Are same-colored particles grouping together? Lower = more grouping.', technical: 'avg(dist_same) / avg(dist_other)' },
  { metric: 'Spatial Entropy', plain: 'Are particles spread evenly or clumped? High = even, Low = clumped.', technical: '-Σ pᵢ log₂(pᵢ) over 8×8 grid' },
  { metric: 'Moran\'s I', plain: 'Are similar particles near each other? +1 = clustered, -1 = dispersed.', technical: 'Spatial autocorrelation of particle types' },
  { metric: 'Cooperation', plain: 'What fraction of nearby particle pairs attract each other? Higher = more cooperation.', technical: 'Ratio of attractive to total pairwise forces within radius' },
  { metric: 'Aggression', plain: 'What fraction repel each other? Higher = more conflict.', technical: 'Ratio of repulsive to total pairwise forces within radius' },
  { metric: 'Clusters', plain: 'How many distinct groups have formed? Fewer = more organized.', technical: 'Union-Find with ε = interaction radius' },
] as const

function ConceptCard({ concept }: { concept: typeof CONCEPTS[number] }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = concept.icon

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={cn(
        'text-left w-full p-2.5 border transition-all duration-200',
        expanded ? 'bg-white/[0.03] border-white/[0.12]' : 'bg-white/[0.01] border-white/[0.06] hover:bg-white/[0.02]',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" style={{ color: `${concept.color}B3` }} />
        <span className="text-xs font-mono text-white/60 font-medium">{concept.title}</span>
        {expanded ? <ChevronUp className="w-3 h-3 text-white/35 ml-auto" /> : <ChevronDown className="w-3 h-3 text-white/35 ml-auto" />}
      </div>
      {expanded && (
        <p className="text-xs text-white/55 leading-relaxed mt-2 font-sans pl-6">
          {concept.content}
        </p>
      )}
    </button>
  )
}

export function WhatAmISeeing({ mode, comparisonMode, isOpen, onToggle }: WhatAmISeeingProps) {
  const [showMetricGuide, setShowMetricGuide] = useState(false)

  return (
    <div className="border border-white/[0.06] bg-[#050505]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]/40" />
          <span className="text-xs font-mono text-white/55 uppercase tracking-wider">
            What Am I Seeing?
          </span>
          <span className="text-[11px] font-mono text-white/30">
            Beginner&rsquo;s Guide
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/45" /> : <ChevronDown className="w-3.5 h-3.5 text-white/45" />}
      </button>

      {isOpen && (
        <div className="p-3 pt-0 space-y-3">
          {/* Quick context */}
          <div className="bg-[#D4AF37]/[0.04] border border-[#D4AF37]/[0.12] p-2.5">
            <p className="text-xs text-white/60 font-sans leading-relaxed">
              {mode === 'anna'
                ? 'You\'re watching particles interact using rules derived from the Anna Matrix. Watch how they self-organize into stable, cooperative structures.'
                : mode === 'random'
                  ? 'You\'re watching particles with random interaction rules. Compare this to the Anna Matrix to see the difference.'
                  : 'You\'re watching particles with custom rules you defined.'}
              {comparisonMode === 'side-by-side' && (
                <span className="text-[#D4AF37]/60"> Side-by-side comparison is active — watch how the two simulations diverge over time.</span>
              )}
            </p>
          </div>

          {/* Quick interaction guide */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { action: 'Click', effect: 'Attract particles', icon: 'attract' },
              { action: 'Shift+Click', effect: 'Repel particles', icon: 'repel' },
              { action: 'Drag', effect: 'Continuous force', icon: 'drag' },
              { action: 'Press C', effect: 'A/B comparison', icon: 'compare' },
            ].map((item) => (
              <div key={item.action} className="bg-white/[0.02] border border-white/[0.04] p-2 text-center">
                <div className="text-xs font-mono text-[#D4AF37]/40 mb-0.5">
                  {item.icon === 'attract' ? '+' : item.icon === 'repel' ? '–' : item.icon === 'drag' ? '~' : 'A|B'}
                </div>
                <div className="text-[11px] font-mono text-white/65">{item.action}</div>
                <div className="text-[10px] text-white/40">{item.effect}</div>
              </div>
            ))}
          </div>

          {/* Concept cards */}
          <div className="space-y-1">
            {CONCEPTS.map((concept) => (
              <ConceptCard key={concept.title} concept={concept} />
            ))}
          </div>

          {/* Metric guide toggle */}
          <button
            onClick={() => setShowMetricGuide(!showMetricGuide)}
            className="w-full flex items-center gap-2 p-2 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors text-left"
          >
            <ArrowRight className={cn('w-3 h-3 text-white/45 transition-transform', showMetricGuide && 'rotate-90')} />
            <span className="text-xs font-mono text-white/55">Metric Dictionary</span>
          </button>

          {showMetricGuide && (
            <div className="space-y-1">
              {METRIC_EXPLANATIONS.map((m) => (
                <div key={m.metric} className="flex items-start gap-2 p-2 bg-white/[0.01] border border-white/[0.03]">
                  <span className="text-[11px] font-mono text-white/65 w-[90px] shrink-0 font-medium">{m.metric}</span>
                  <div className="flex-1">
                    <div className="text-xs text-white/55 font-sans">{m.plain}</div>
                    <div className="text-[10px] font-mono text-white/30 mt-0.5">{m.technical}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
