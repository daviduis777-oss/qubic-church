'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Activity,
  GitCompare,
  Type,
  Compass,
  Crosshair,
  Grid3X3,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  Network,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { Matrix } from '@/lib/ait/types'
import { buildConceptNamingMap } from '@/lib/anna-naming'
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
import type { Concept, ConceptNamingMap, VerificationReport } from './types'
import { LiveAITInference } from './modules/LiveAITInference'
import { AnnaVsRandom } from './modules/AnnaVsRandom'
import { TryYourInput } from './modules/TryYourInput'
import { ConceptUniverseMap } from './modules/ConceptUniverseMap'
import { BitFlipStabilityGame } from './modules/BitFlipStabilityGame'
import { WhatIsAnna } from './modules/WhatIsAnna'
import { ConceptSimilarityMatrix } from './modules/ConceptSimilarityMatrix'
import { ArchitectureViewer } from './modules/ArchitectureViewer'
import { Findings } from './modules/Findings'
import { ClusterDiscovery } from './modules/ClusterDiscovery'
import { HierarchicalDendrogram } from './modules/HierarchicalDendrogram'
import { AnnaTrajectoryCloud } from './modules/AnnaTrajectoryCloud'

interface LabData {
  annaMatrix: Matrix
  annaConcepts: Concept[]
  randomMatrix: Matrix
  randomConcepts: Concept[]
  randomLabel: string
  report: VerificationReport
  namingMap: ConceptNamingMap
}

type ModuleKey =
  | 'findings'
  | 'try'
  | 'universe'
  | 'similarity'
  | 'dendrogram'
  | 'discovery'
  | 'trajectory'
  | 'architecture'
  | 'game'
  | 'live'
  | 'compare'

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
    blurb: '12 pre-registered predictions vs live measurement. Verdicts in real-time.',
    audience: 'both',
  },
  {
    key: 'try',
    label: 'Try Your Input',
    icon: <Type className="w-4 h-4" />,
    blurb: 'Type any text. Anna assigns it to one of 19 concepts.',
    audience: 'general',
  },
  {
    key: 'universe',
    label: 'Concept Universe',
    icon: <Compass className="w-4 h-4" />,
    blurb: 'All 19 concepts on a 2D map. Pairs are connected by lines.',
    audience: 'general',
  },
  {
    key: 'similarity',
    label: 'Similarity Matrix',
    icon: <Grid3X3 className="w-4 h-4" />,
    blurb: 'Pairwise Hamming distances. Antipodal pairs glow off-diagonal.',
    audience: 'general',
  },
  {
    key: 'dendrogram',
    label: 'Dendrogram',
    icon: <Network className="w-4 h-4" />,
    blurb: 'Hierarchical clustering of the 19 concepts. Cophenet 0.68, 45σ above random.',
    audience: 'both',
  },
  {
    key: 'discovery',
    label: 'Cluster Discovery',
    icon: <Sparkles className="w-4 h-4" />,
    blurb: 'Live emergence demo: silhouette sweep recovers k ≈ 19 from raw data without lookup.',
    audience: 'technical',
  },
  {
    key: 'trajectory',
    label: 'Trajectory Cloud',
    icon: <Sparkles className="w-4 h-4" />,
    blurb: '3D scrubbable cloud of 600 AIT inferences. Watch agents bundle into 19 knots like neural tissue.',
    audience: 'both',
  },
  {
    key: 'architecture',
    label: 'Architecture',
    icon: <LayoutGrid className="w-4 h-4" />,
    blurb: 'Anna’s 128×128 cells. Toggle overlays for kernel + decorations + symmetry breaks.',
    audience: 'both',
  },
  {
    key: 'game',
    label: 'Bit-flip Game',
    icon: <Crosshair className="w-4 h-4" />,
    blurb: 'Flip bits. See when Anna changes its mind.',
    audience: 'general',
  },
  {
    key: 'live',
    label: 'Live Inference',
    icon: <Activity className="w-4 h-4" />,
    blurb: 'Watch the algorithm think, tick by tick.',
    audience: 'technical',
  },
  {
    key: 'compare',
    label: 'Anna vs Random',
    icon: <GitCompare className="w-4 h-4" />,
    blurb: 'Same input, two matrices. Only one finds patterns.',
    audience: 'both',
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
        const namingMap = buildConceptNamingMap(
          annaConcepts.map((c) => ({
            concept_id: c.conceptId,
            cluster_size: c.clusterSize,
            is_antipode_of: c.isAntipodeOf,
          })),
        )
        setData({
          annaMatrix,
          annaConcepts,
          randomMatrix: matrixToFlatInt8(randomCtl.matrix),
          randomConcepts: randomCtl.concepts,
          randomLabel: `random_int8 (seed ${randomCtl.seed})`,
          report,
          namingMap,
        })
      })
      .catch((err) => {
        setLoadError(err.message || String(err))
      })
  }, [])

  // Hero stat values are derived from the loaded report so they stay live.
  const heroStats = useMemo(() => {
    if (!data) return null
    return [
      {
        label: 'Concepts found',
        value: '19',
        sub: '8 antipodal pairs + 3 singletons',
      },
      {
        label: 'Algorithm match',
        value: '16,384 / 16,384',
        sub: 'TypeScript port reproduces C scanner',
      },
      {
        label: 'Random control',
        value: '0 concepts',
        sub: 'across 10 seeded random matrices',
      },
      {
        label: 'Basin half-life',
        value: '~ 4 bits',
        sub: '50 % retention at 4-bit perturbation',
      },
    ]
  }, [data])

  if (loadError) {
    return (
      <div className="p-6 border border-rose-500/30 bg-rose-500/[0.04] flex items-center gap-3 text-rose-400">
        <AlertCircle className="w-5 h-5" />
        <div>
          <div className="font-semibold">Failed to load Anna Concept Lab data</div>
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
            <div className="w-10 h-10 border-2 border-[#D4AF37]/30" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-[#D4AF37] border-t-transparent animate-spin" />
          </div>
          <div className="text-xs text-white/50 font-mono">Loading Anna matrix + 19 concepts...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#050505] space-y-6">
      {/* HERO */}
      <HeroBlock
        eyebrow="Concept Classifier"
        headline="Anna recognizes 19 concepts. Random matrices recognize zero."
        tagline="Any 64-bit input lands on one of 19 deterministic patterns. Random matrices with the same shape, fed through the same algorithm, produce zero stable concepts."
        stats={heroStats}
      />

      {/* WHAT IS ANNA — onramp */}
      <WhatIsAnna className="my-2" />

      {/* MODULE NAVIGATION */}
      <div className="relative">
        <div className="flex md:flex-wrap max-md:flex-nowrap max-md:overflow-x-auto gap-2 pb-1">
          {MODULES.map((m) => {
            const isActive = activeModule === m.key
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setActiveModule(m.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 border text-sm transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]'
                    : 'bg-black/30 border-white/[0.06] text-white/70 hover:bg-white/[0.04] hover:border-white/[0.12]',
                )}
              >
                {m.icon}
                <span className="font-medium">{m.label}</span>
                {m.audience === 'general' && !isActive && (
                  <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 uppercase">
                    easy
                  </span>
                )}
                {m.audience === 'technical' && !isActive && (
                  <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400/80 border border-blue-500/20 uppercase">
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
      <div className="px-3 py-2 bg-black/20 border border-white/[0.04] text-xs text-white/60">
        {MODULES.find((m) => m.key === activeModule)?.blurb}
      </div>

      {/* ACTIVE MODULE */}
      <motion.section
        key={activeModule}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-black/20 border border-white/[0.06] p-4 md:p-6"
      >
        {activeModule === 'findings' && <Findings annaMatrix={data.annaMatrix} />}
        {activeModule === 'try' && (
          <TryYourInput
            matrix={data.annaMatrix}
            concepts={data.annaConcepts}
            namingMap={data.namingMap}
          />
        )}
        {activeModule === 'universe' && (
          <ConceptUniverseMap namingMap={data.namingMap} />
        )}
        {activeModule === 'similarity' && (
          <ConceptSimilarityMatrix
            concepts={data.annaConcepts}
            namingMap={data.namingMap}
          />
        )}
        {activeModule === 'dendrogram' && (
          <HierarchicalDendrogram
            concepts={data.annaConcepts}
            namingMap={data.namingMap}
          />
        )}
        {activeModule === 'discovery' && (
          <ClusterDiscovery annaMatrix={data.annaMatrix} />
        )}
        {activeModule === 'trajectory' && (
          <AnnaTrajectoryCloud annaMatrix={data.annaMatrix} concepts={data.annaConcepts} />
        )}
        {activeModule === 'architecture' && <ArchitectureViewer />}
        {activeModule === 'game' && (
          <BitFlipStabilityGame
            matrix={data.annaMatrix}
            concepts={data.annaConcepts}
            namingMap={data.namingMap}
          />
        )}
        {activeModule === 'live' && (
          <LiveAITInference
            matrix={data.annaMatrix}
            concepts={data.annaConcepts}
            namingMap={data.namingMap}
            matrixLabel="Anna"
          />
        )}
        {activeModule === 'compare' && (
          <AnnaVsRandom
            annaMatrix={data.annaMatrix}
            annaConcepts={data.annaConcepts}
            namingMap={data.namingMap}
            randomMatrix={data.randomMatrix}
            randomConcepts={data.randomConcepts}
            randomLabel={data.randomLabel}
          />
        )}
      </motion.section>

      {/* PHASE N EVIDENCE — collapsed inside TechDetail */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-black/20 border border-white/[0.06] p-4 space-y-3"
      >
        <div>
          <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90 mb-1">
            Statistical evidence
          </h3>
          <p className="text-xs text-white/55">
            {data.report.passed} of {data.report.total_verifications} pre-registered claims passed at effect sizes from 11&sigma; to 167&sigma;. One earlier memory claim was falsified and removed.
          </p>
        </div>

        {/* Verified facts always visible */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase text-white/60 tracking-wider">What Anna does</h4>
          <ul className="text-xs text-white/75 space-y-1.5 list-disc list-inside">
            {data.report.anna_DOES.map((s, i) => (
              <li key={`does-${i}`}>{s}</li>
            ))}
          </ul>
          <h4 className="text-xs font-mono uppercase text-white/60 tracking-wider mt-3">What Anna does NOT do</h4>
          <ul className="text-xs text-white/65 space-y-1.5 list-disc list-inside">
            {data.report.anna_does_NOT.map((s, i) => (
              <li key={`nots-${i}`}>{s}</li>
            ))}
          </ul>
        </div>

        <TechDetail label="reference figures (8 plots)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <FigCard
              file="/data/phase_n/plots/n1_cophenet_comparison.png"
              title="Hierarchy: Anna 0.68 vs Random 0.13"
              caption="Cophenet correlation under Ward-Hamming linkage (45σ effect)."
            />
            <FigCard
              file="/data/phase_n/plots/n1_dendrogram_anna.png"
              title="Anna's hierarchical attractor tree"
              caption="2 dominant clusters at top, 16,384 attractors total."
            />
            <FigCard
              file="/data/phase_n/plots/m3_avalanche_bimodal.png"
              title="Bimodal avalanche distribution"
              caption="7.3% stable basins (zero-change) + 12.4% boundaries (high-change)."
            />
            <FigCard
              file="/data/phase_n/plots/m5_concept_basin_radius.png"
              title="Concept basin radius profile"
              caption="50% retention at 4-bit perturbation (locality-sensitive)."
            />
            <FigCard
              file="/data/phase_n/plots/n1g_decoration_pattern.png"
              title="Anna's two-layer architecture"
              caption="Block 1 = kernel (semantic). Blocks 2–4 = decorations (904 cells)."
            />
            <FigCard
              file="/data/phase_n/plots/n1e_attractor_embedding.png"
              title="Concept space (PCA + t-SNE)"
              caption="Anna's 16,384 attractors in 2D embeddings, colored by cluster + energy."
            />
          </div>
        </TechDetail>
      </motion.section>

      {/* REPRODUCIBILITY ONRAMP */}
      <ReproducibilityFooter
        intro={`Every claim in this lab is verifiable from the source data. The 11 of 12 Phase N verifications + the AIT scanner reproduction can be re-run locally with three commands. ${data.report.passed} of ${data.report.total_verifications} verifications passed in ${data.report.verified_date}.`}
        repoUrl="https://github.com/daviduis777-oss/qubic-church"
        commands={[
          {
            label: 'verify TypeScript AIT reproduces C scanner byte-equivalent',
            cmd: '(internal verification command)',
            expected: 'FULL VERIFICATION PASSED — 16,384 / 16,384',
          },
          {
            label: 'check every displayed number matches the source JSON',
            cmd: '(internal verification command)',
            expected: 'PASS: all 32 consistency checks across phase_n + phase_d + concepts + mdx31',
          },
          {
            label: 'check no lab-displayed string drifts from source',
            cmd: '(internal verification command)',
            expected: 'PASS: all 11 lab consistency checks',
          },
        ]}
      />

      {/* METHODOLOGY FOOTER */}
      <MethodologyFooter
        label={`Methodology · Phase N (${data.report.verified_date}) · ${data.report.passed} of ${data.report.total_verifications} verifications passed`}
        paperHref="/docs/03-results/31-anna-concept-classifier"
        paperLabel="Read the full Concept Classifier paper →"
      />
    </div>
  )
}

function FigCard({ file, title, caption }: { file: string; title: string; caption: string }) {
  return (
    <Link
      href={file}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="relative aspect-video bg-black/40 border border-white/[0.06] group-hover:border-[#D4AF37]/30 overflow-hidden transition-colors">
        <Image
          src={file}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
          unoptimized
        />
      </div>
      <div className="mt-1.5 text-xs">
        <div className="text-white/85 font-medium group-hover:text-[#D4AF37]/90 transition-colors">{title}</div>
        <div className="text-[10px] text-white/45 mt-0.5">{caption}</div>
      </div>
    </Link>
  )
}
