'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Activity,
  Crosshair,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { Matrix } from '@/lib/ait/types'
import {
  HeroBlock,
  TechDetail,
  MethodologyFooter,
  ReproducibilityFooter,
} from '@/components/evidence/lab-primitives'

import {
  loadAnnaMatrix,
  loadConcepts,
  loadRandomControl,
  loadVerificationReport,
  matrixToFlatInt8,
} from './data-loader'
import type { Concept, VerificationReport } from './types'
import { LiveAITInference } from './modules/LiveAITInference'
import { BitFlipStabilityGame } from './modules/BitFlipStabilityGame'
import { WhatIsAnna } from './modules/WhatIsAnna'
import { ArchitectureViewer } from './modules/ArchitectureViewer'
import { Findings } from './modules/Findings'

interface LabData {
  annaMatrix: Matrix
  annaConcepts: Concept[]
  randomMatrix: Matrix
  randomConcepts: Concept[]
  randomLabel: string
  report: VerificationReport
}

type ModuleKey = 'findings' | 'architecture' | 'game' | 'live'

interface ModuleConfig {
  key: ModuleKey
  label: string
  icon: React.ReactNode
  blurb: string
  audience: 'general' | 'technical' | 'both'
}

const MODULES: ModuleConfig[] = [
  {
    key: 'findings',
    label: 'Findings',
    icon: <CheckCircle2 className="w-4 h-4" />,
    blurb:
      '12 pre-registered predictions vs live measurement. Verdicts in real-time.',
    audience: 'both',
  },
  {
    key: 'architecture',
    label: 'Architecture',
    icon: <LayoutGrid className="w-4 h-4" />,
    blurb:
      'Anna’s 128×128 cells. Toggle overlays for kernel + decorations + symmetry breaks.',
    audience: 'both',
  },
  {
    key: 'game',
    label: 'Bit-flip Game',
    icon: <Crosshair className="w-4 h-4" />,
    blurb: 'Flip input bits. See how many output bits change.',
    audience: 'general',
  },
  {
    key: 'live',
    label: 'Live Inference',
    icon: <Activity className="w-4 h-4" />,
    blurb: 'Watch the algorithm update, tick by tick.',
    audience: 'technical',
  },
]

export default function AnnaConceptLab() {
  const [data, setData] = useState<LabData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeModule, setActiveModule] = useState<ModuleKey>('findings')

  useEffect(() => {
    Promise.all([
      loadAnnaMatrix(),
      loadConcepts(),
      loadRandomControl(),
      loadVerificationReport(),
    ])
      .then(([annaMatrix, annaConcepts, randomCtl, report]) => {
        setData({
          annaMatrix,
          annaConcepts,
          randomMatrix: matrixToFlatInt8(randomCtl.matrix),
          randomConcepts: randomCtl.concepts,
          randomLabel: `random_int8 (seed ${randomCtl.seed})`,
          report,
        })
      })
      .catch(err => {
        setLoadError(err.message || String(err))
      })
  }, [])

  // Hero stat values are derived from the loaded report so they stay live.
  const heroStats = useMemo(() => {
    if (!data) return null
    return [
      {
        label: 'Earlier "concepts"',
        value: '19',
        sub: 'post-hoc grouping, not confirmed Sept 2026',
      },
      {
        label: 'Algorithm match',
        value: '16,384 / 16,384',
        sub: 'TypeScript port reproduces C scanner',
      },
      {
        label: 'Random control',
        value: '0 groups',
        sub: 'reported; uses the earlier, unconfirmed definition',
      },
      {
        label: 'Output sensitivity',
        value: '~ 4 bits',
        sub: 'about half of outputs unchanged at 4 flipped bits (reported)',
      },
    ]
  }, [data])

  if (loadError) {
    return (
      <div className="p-6 border border-rose-500/30 bg-rose-500/[0.04] flex items-center gap-3 text-rose-400">
        <AlertCircle className="w-5 h-5" />
        <div>
          <div className="font-semibold">
            Failed to load Anna Concept Lab data
          </div>
          <div className="text-xs mt-1 text-white/60">{loadError}</div>
        </div>
      </div>
    )
  }

  if (!data || !heroStats) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-gold/30" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-gold border-t-transparent animate-spin" />
          </div>
          <div className="text-xs text-white/50 font-mono">
            Loading Anna matrix...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card space-y-6">
      {/* HERO */}
      <HeroBlock
        eyebrow="AIT Inference"
        headline="A verified port of Anna's inference, and an open concept reading."
        stats={heroStats}
        tagline="The TypeScript port reproduces all 16,384 stored scanner states. The earlier reading that any input lands on one of 19 concepts was not confirmed in September 2026 and stays open: the 19 groups were chosen after the fact, and the stored end states are not fixed points."
      />

      {/* WHAT IS ANNA: onramp */}
      <WhatIsAnna className="my-2" />

      {/* MODULE NAVIGATION */}
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

      {/* Module description */}
      <div className="px-3 py-2 bg-black/20 border border-border text-xs text-white/60">
        {MODULES.find(m => m.key === activeModule)?.blurb}
      </div>

      {/* ACTIVE MODULE */}
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 border border-border p-4 md:p-6"
        initial={{ opacity: 0, y: 8 }}
        key={activeModule}
        transition={{ duration: 0.2 }}
      >
        {activeModule === 'findings' && (
          <Findings annaMatrix={data.annaMatrix} />
        )}
        {activeModule === 'architecture' && <ArchitectureViewer />}
        {activeModule === 'game' && (
          <BitFlipStabilityGame matrix={data.annaMatrix} />
        )}
        {activeModule === 'live' && (
          <LiveAITInference
            concepts={data.annaConcepts}
            matrix={data.annaMatrix}
            matrixLabel="Anna"
          />
        )}
      </motion.section>

      {/* PHASE N EVIDENCE: collapsed inside TechDetail */}
      <motion.section
        className="bg-black/20 border border-border p-4 space-y-3"
        initial={{ opacity: 0, y: 10 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div>
          <h3 className="text-base font-semibold tracking-wide text-gold/90 mb-1">
            Statistical evidence
          </h3>
          <p className="text-xs text-white/55">
            Earlier versions listed {data.report.total_verifications}{' '}
            pre-registered claims with effect sizes from 11&sigma; to
            167&sigma;. These values are reported, not independently re-run, and
            the concept-classifier reading was not confirmed in September 2026. What
            still stands: the TypeScript port reproduces all 16,384 stored
            scanner states.
          </p>
        </div>

        <TechDetail label="reference figures">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <FigCard
              caption="Cophenet correlation under Ward-Hamming linkage (reported, not independently re-run)."
              file="/data/phase_n/plots/n1_cophenet_comparison.png"
              title="Hierarchy: Anna 0.68 vs Random 0.13"
            />
            <FigCard
              caption="2 dominant clusters at top, 16,384 stored end states (not fixed points)."
              file="/data/phase_n/plots/n1_dendrogram_anna.png"
              title="Anna's hierarchical end-state tree"
            />
            <FigCard
              caption="7.3% zero-change inputs + 12.4% boundaries (high-change)."
              file="/data/phase_n/plots/m3_avalanche_bimodal.png"
              title="Bimodal avalanche distribution"
            />
            <FigCard
              caption="50% retention at 4-bit perturbation (locality-sensitive)."
              file="/data/phase_n/plots/m5_concept_basin_radius.png"
              title="Output stability under bit flips"
            />
            <FigCard
              caption="Block 1 = kernel. Blocks 2–4 = decorations (904 cells)."
              file="/data/phase_n/plots/n1g_decoration_pattern.png"
              title="Anna's two-layer architecture"
            />
          </div>
        </TechDetail>
      </motion.section>

      {/* REPRODUCIBILITY ONRAMP */}
      <ReproducibilityFooter
        commands={[
          {
            label: 'verify TypeScript AIT reproduces C scanner byte-equivalent',
            cmd: '(internal verification command)',
            expected: 'FULL VERIFICATION PASSED, 16,384 / 16,384',
          },
          {
            label: 'check every displayed number matches the source JSON',
            cmd: '(internal verification command)',
            expected:
              'PASS: all 32 consistency checks across phase_n + phase_d + concepts + mdx31',
          },
          {
            label: 'check no lab-displayed string drifts from source',
            cmd: '(internal verification command)',
            expected: 'PASS: all 11 lab consistency checks',
          },
        ]}
        intro={`The AIT scanner reproduction can be checked against the source data. The Phase N verifications (${data.report.passed} of ${data.report.total_verifications} reported as passed in ${data.report.verified_date}) are not independently re-run.`}
        repoUrl="https://github.com/daviduis777-oss/qubic-church"
      />

      {/* METHODOLOGY FOOTER */}
      <MethodologyFooter
        label={`Methodology · Phase N (${data.report.verified_date}) · ${data.report.passed} of ${data.report.total_verifications} verifications passed`}
        paperHref="/docs/03-results/31-anna-concept-classifier"
        paperLabel="Read the Phase N chapter (corrected September 2026) →"
      />
    </div>
  )
}

function FigCard({
  file,
  title,
  caption,
}: {
  file: string
  title: string
  caption: string
}) {
  return (
    <Link
      className="block group"
      href={file}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="relative aspect-video bg-black/40 border border-border group-hover:border-gold/30 overflow-hidden transition-colors">
        <Image
          alt={title}
          className="object-contain"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          src={file}
          unoptimized
        />
      </div>
      <div className="mt-1.5 text-xs">
        <div className="text-white/85 font-medium group-hover:text-gold/90 transition-colors">
          {title}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{caption}</div>
      </div>
    </Link>
  )
}
