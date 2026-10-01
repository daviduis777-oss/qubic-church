'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Brain, Network, Compass, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  HeroBlock,
  MethodologyFooter,
  ReproducibilityFooter,
} from '@/components/evidence/lab-primitives'
import { loadCognitiveLabData, type CognitiveLabData } from './data-loader'
import { HyperIdentityEvolution } from './modules/HyperIdentityEvolution'
import { MultiTaskEvolution } from './modules/MultiTaskEvolution'
import { StructuralConvergence } from './modules/StructuralConvergence'
import { CognitiveTrajectory } from './modules/CognitiveTrajectory'

type ModuleKey = 'evolution' | 'multitask' | 'structural' | 'trajectory'

interface ModuleConfig {
  key: ModuleKey
  label: string
  icon: React.ReactNode
  blurb: string
  audience: 'general' | 'technical' | 'both'
}

const MODULES: ModuleConfig[] = [
  {
    key: 'evolution',
    label: 'HyperIdentity Evolution',
    icon: <Network className="w-4 h-4" />,
    blurb:
      '64 random matrices, top-25% selection, sign-flip mutation. Watch fitness rise toward Anna over 200 generations.',
    audience: 'general',
  },
  {
    key: 'multitask',
    label: 'Multi-Task Pareto',
    icon: <Compass className="w-4 h-4" />,
    blurb:
      '6 bit-pattern tasks. Anna profile vs random matrices in 2D fitness space.',
    audience: 'general',
  },
  {
    key: 'structural',
    label: 'Structural Convergence',
    icon: <Brain className="w-4 h-4" />,
    blurb:
      '7-axis fingerprint. 5 functional axes are approached under selection; 2 matrix-specific axes (the exact byte triple at [8,74] to [10,76], the exact compression rate) stay at 0%.',
    audience: 'both',
  },
  {
    key: 'trajectory',
    label: 'Cognitive Trajectory',
    icon: <Activity className="w-4 h-4" />,
    blurb:
      'Iterated AIT inference traces. Anna vs evolved-best vs random control in input-clamped regime.',
    audience: 'technical',
  },
]

export default function CognitiveLab() {
  const [data, setData] = useState<CognitiveLabData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeModule, setActiveModule] = useState<ModuleKey>('evolution')
  const [evolvedBest, setEvolvedBest] = useState<Int8Array | null>(null)

  useEffect(() => {
    loadCognitiveLabData()
      .then(setData)
      .catch(err => setLoadError(err.message || String(err)))
  }, [])

  const onBestUpdate = useCallback((weights: Int8Array) => {
    // Worker transfers Int8Array, copy to keep ownership across re-renders
    setEvolvedBest(new Int8Array(weights))
  }, [])

  if (loadError) {
    return (
      <div className="p-6 border border-rose-500/30 bg-rose-500/[0.04] flex items-center gap-3 text-rose-400">
        <AlertCircle className="w-5 h-5" />
        <div>
          <div className="font-semibold">Failed to load Cognitive Lab data</div>
          <div className="text-xs mt-1 text-white/60">{loadError}</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-gold/30" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-gold border-t-transparent animate-spin" />
          </div>
          <div className="text-xs text-white/50 font-mono">
            Loading Anna matrix + reference data...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card space-y-6">
      <HeroBlock
        eyebrow="Cognitive Lab"
        headline="We measure how matrices change under selection."
        stats={[
          {
            label: 'Population',
            value: '64',
            sub: 'random sign-only matrices',
          },
          {
            label: 'Generations',
            value: '200',
            sub: 'top-25 % selection per gen',
          },
          {
            label: 'Anna baseline',
            value: data.annaBaseline.toFixed(3),
            sub: 'HyperIdentity reference fitness',
          },
          {
            label: 'Radar axes',
            value: '5 / 2',
            sub: 'functional / matrix-specific',
          },
        ]}
        tagline="64 random sign-only matrices evolve for 200 generations under HyperIdentity scoring with top-25 % selection and sign-flip mutation. We report: fitness rises toward Anna's baseline; functional structure (antipodal antisymmetry, kernel reconstruction, row-32 similarity) is approached; two matrix-specific details (the exact byte triple at [8,74] to [10,76], the exact compression rate) are not. Source data, scripts, and tests linked in the methodology footer."
      />

      <div className="relative">
        <div className="flex md:flex-wrap max-md:flex-nowrap max-md:overflow-x-auto gap-2 pb-1">
          {MODULES.map(m => {
            const isActive = activeModule === m.key
            return (
              <button
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 border text-sm transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-gold/15 border-gold/40 text-gold'
                    : 'bg-black/30 border-border text-white/70 hover:bg-white/[0.04] hover:border-white/[0.12]'
                )}
                key={m.key}
                onClick={() => setActiveModule(m.key)}
                type="button"
              >
                {m.icon}
                <span className="font-medium">{m.label}</span>
                {m.audience === 'general' && !isActive && (
                  <span className="ml-1 text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 uppercase">
                    easy
                  </span>
                )}
                {m.audience === 'technical' && !isActive && (
                  <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400/80 border border-blue-500/20 uppercase">
                    tech
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="md:hidden absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[#050505] pointer-events-none" />
      </div>

      <div className="px-3 py-2 bg-black/20 border border-border text-xs text-white/60">
        {MODULES.find(m => m.key === activeModule)?.blurb}
      </div>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 border border-border p-4 md:p-6"
        initial={{ opacity: 0, y: 8 }}
        key={activeModule}
        transition={{ duration: 0.2 }}
      >
        {activeModule === 'evolution' && (
          <HyperIdentityEvolution
            annaBaseline={data.annaBaseline}
            annaMatrix={data.annaMatrix}
            onBestUpdate={onBestUpdate}
          />
        )}
        {activeModule === 'multitask' && (
          <MultiTaskEvolution annaMatrix={data.annaMatrix} />
        )}
        {activeModule === 'structural' && (
          <StructuralConvergence
            annaMatrix={data.annaMatrix}
            evolvedBest={evolvedBest}
          />
        )}
        {activeModule === 'trajectory' && (
          <CognitiveTrajectory
            annaMatrix={data.annaMatrix}
            evolvedBest={evolvedBest}
          />
        )}
      </motion.section>

      <ReproducibilityFooter
        commands={[
          {
            label: 'clone + install (one-time)',
            cmd: 'git clone https://github.com/daviduis777-oss/qubic-church.git && cd qubic-church && pnpm install',
            expected: 'dependencies resolved',
          },
          {
            label: 'verify deterministic 20-gen evolution',
            cmd: 'node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/evolution.test.mjs',
            expected: 'PASS: deterministic 20-gen evolution: 0.531 -> 0.590',
          },
          {
            label:
              'verify all 7-axis structural fingerprint values match Phase N',
            cmd: 'node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/structural-metrics.test.mjs',
            expected: 'PASS: Anna fingerprint correct, all 7 axes verified',
          },
        ]}
        intro="The evolution loop runs entirely in your browser via a Web Worker. To reproduce the deterministic 0.531 → 0.590 fitness curve on your machine, clone the repo and run the 20-generation gate. The full 200-generation run uses the same code path."
        repoUrl="https://github.com/daviduis777-oss/qubic-church"
      />

      <MethodologyFooter
        label="Methodology · Live AI Evolution (2026-05-10) · 64 matrices × 200 generations × HyperIdentity scoring · sign-flip mutation"
        paperHref="/docs/03-results/31-anna-concept-classifier"
        paperLabel="Read the Phase N chapter (corrected September 2026) →"
      />
    </div>
  )
}
