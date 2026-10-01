'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { StructuralFingerprint } from '../types'

const FUNCTIONAL_AXES = [
  {
    key: 'antipodalAntisymmetryPct' as const,
    label: 'antipodal\nantisymmetry',
  },
  { key: 'spectralDominancePct' as const, label: 'spectral\ndominance' },
  { key: 'rowSymmetryOffset32' as const, label: 'row-32\nsimilarity' },
  { key: 'kernelReconstructionAcc' as const, label: 'kernel\nreconstruction' },
  { key: 'outputSparsityPct' as const, label: 'tick-1\nsparsity' },
]

const IDENTITY_AXES = [
  {
    key: 'hasKeySignature' as const,
    label: 'Byte triple\n[8,74]',
    boolean: true,
    max: 1,
  },
  {
    key: 'compressionRate' as const,
    label: 'compression\nrate → 24 %',
    boolean: false,
    max: 0.3,
  },
]

export interface StructuralRadarProps {
  evolved: StructuralFingerprint | null
  anna: StructuralFingerprint
  random: StructuralFingerprint | null
}

interface RadarPoint {
  axis: string
  Anna: number
  Evolved: number
  Random: number
  isIdentity: boolean
}

function valOf(
  fp: StructuralFingerprint | null,
  key: keyof StructuralFingerprint,
  max: number
): number {
  if (!fp) return 0
  const raw = fp[key]
  if (typeof raw === 'boolean') return raw ? 1 : 0
  return Math.min(1, raw / max)
}

export function StructuralRadar({
  evolved,
  anna,
  random,
}: StructuralRadarProps) {
  const data: RadarPoint[] = [
    ...FUNCTIONAL_AXES.map(axis => ({
      axis: axis.label,
      Anna: valOf(anna, axis.key, 1),
      Evolved: valOf(evolved, axis.key, 1),
      Random: valOf(random, axis.key, 1),
      isIdentity: false,
    })),
    ...IDENTITY_AXES.map(axis => ({
      axis: axis.label,
      Anna: valOf(anna, axis.key, axis.max),
      Evolved: valOf(evolved, axis.key, axis.max),
      Random: valOf(random, axis.key, axis.max),
      isIdentity: true,
    })),
  ]

  return (
    <div className="border border-border bg-[#0A0A0A] p-3">
      <div className="text-xs text-white/55 mb-2 font-mono uppercase">
        7-axis structural fingerprint
      </div>
      <div className="text-xs text-muted-foreground mb-2 flex flex-wrap gap-x-4 gap-y-1">
        <span>
          <span className="inline-block w-2 h-2 bg-gold mr-1 align-middle" />5
          functional (selection-recoverable)
        </span>
        <span>
          <span className="inline-block w-2 h-2 bg-rose-500 mr-1 align-middle" />
          2 matrix-specific (not reproduced by selection)
        </span>
      </div>
      <div className="w-full aspect-[16/11] sm:aspect-[16/9] min-h-[300px] max-h-[420px]">
        <ResponsiveContainer height="100%" width="100%">
          <RadarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <PolarGrid stroke="#222" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
            />
            <PolarRadiusAxis
              axisLine={false}
              domain={[0, 1]}
              tick={false}
              tickCount={5}
            />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Radar
              dataKey="Anna"
              fill="#D4AF37"
              fillOpacity={0.32}
              stroke="#D4AF37"
            />
            <Radar
              dataKey="Evolved"
              fill="#10b981"
              fillOpacity={0.25}
              stroke="#10b981"
            />
            <Radar
              dataKey="Random"
              fill="#6b7280"
              fillOpacity={0.15}
              stroke="#6b7280"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-muted-foreground italic mt-2 leading-snug">
        Reading: each axis is normalised to [0, 1] (Anna&apos;s reference value
        or natural max). Anna&apos;s polygon fills the functional axes; the
        evolved-best should grow toward it on those 5 but stay flat on the 2
        identity axes.
      </div>
    </div>
  )
}
