'use client'

import dynamic from 'next/dynamic'
import { AlertTriangle } from 'lucide-react'

const ParticleLifeSimulation = dynamic(
  () => import('../../particle-life/ParticleLifeSimulation'),
  {
    loading: () => (
      <div className="w-full h-[600px] bg-[#050505] border border-white/[0.04] flex items-center justify-center">
        <span className="text-white/55 text-sm">Loading visual metaphor…</span>
      </div>
    ),
    ssr: false,
  },
)

export function VisualMetaphor() {
  return (
    <div className="flex flex-col gap-4">
      <div className="px-4 py-3 border border-amber-500/30 bg-amber-500/[0.04] flex gap-2 items-start">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-300 leading-relaxed">
          <strong>This was an exploratory metaphor — not the correct experimental setup.</strong>
          <br />
          Anna is not a foraging-agent&apos;s brain. Anna IS a candidate matrix in an evolutionary AI training loop.
          The correct setup is the <em>HyperIdentity Evolution</em> module above. This Particle Life simulation is
          kept for visual continuity with chapter 25 references and historical context.
        </div>
      </div>
      <ParticleLifeSimulation />
    </div>
  )
}
