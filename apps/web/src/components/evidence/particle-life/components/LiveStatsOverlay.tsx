'use client'

import { cn } from '@/lib/utils'
import type { SimulationStats } from '../types'

interface LiveStatsOverlayProps {
  stats: SimulationStats
  tick: number
  fps: number
  mode: string
  className?: string
}

function CoopBar({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-mono text-white/45 w-[52px] text-right shrink-0">{label}</span>
      <div className="flex-1 h-[6px] bg-white/[0.04] overflow-hidden min-w-[40px]">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-mono w-[30px] shrink-0" style={{ color }}>{pct}%</span>
    </div>
  )
}

export function LiveStatsOverlay({ stats, tick, fps, mode, className }: LiveStatsOverlayProps) {
  const cooperation = stats.cooperation ?? 0
  const aggression = stats.aggression ?? 0
  const neutral = 1 - cooperation - aggression

  // Energy state classification
  let energyState: string
  let energyColor: string
  if (stats.energy < 0.1) {
    energyState = 'Frozen'
    energyColor = '#64748b'
  } else if (stats.energy < 0.5) {
    energyState = 'Calm'
    energyColor = '#3B82F6'
  } else if (stats.energy < 2) {
    energyState = 'Active'
    energyColor = '#10B981'
  } else if (stats.energy < 8) {
    energyState = 'Energetic'
    energyColor = '#F59E0B'
  } else {
    energyState = 'Chaotic'
    energyColor = '#EF4444'
  }

  // Clustering state
  const clusterCount = stats.clusterCount ?? 0
  let clusterState: string
  if (clusterCount <= 3) clusterState = 'Unified'
  else if (clusterCount <= 8) clusterState = 'Structured'
  else if (clusterCount <= 20) clusterState = 'Fragmented'
  else clusterState = 'Dispersed'

  return (
    <div className={cn(
      'absolute top-2 left-2 pointer-events-none select-none',
      'bg-black/60 backdrop-blur-sm border border-white/[0.08] p-2 space-y-1.5',
      'max-w-[200px]',
      className,
    )}>
      {/* Cooperation/Aggression bars */}
      <div className="space-y-0.5">
        <CoopBar value={cooperation} label="Cooperate" color="#4ade80" />
        <CoopBar value={aggression} label="Aggress" color="#f87171" />
        <CoopBar value={neutral} label="Neutral" color="#64748b" />
      </div>

      {/* State indicators */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: energyColor }} />
          <span className="text-[10px] font-mono" style={{ color: energyColor }}>{energyState}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span className="text-[10px] font-mono text-purple-400/70">{clusterState}</span>
        </div>
      </div>

      {/* Per-type cooperation (compact) */}
      {stats.perTypeCooperation && stats.perTypeCooperation.length > 0 && (
        <div className="pt-1 border-t border-white/[0.06]">
          <div className="text-[9px] font-mono text-white/35 mb-0.5">PER-TYPE COOPERATION</div>
          <div className="flex items-center gap-px">
            {stats.perTypeCooperation.map((pt, i) => {
              const coopPct = Math.round(pt.cooperation * 100)
              const hue = pt.cooperation > 0.5 ? 120 : pt.cooperation > 0.3 ? 60 : 0
              return (
                <div
                  key={`ptype-${i}`}
                  className="flex-1 h-2"
                  style={{
                    backgroundColor: `hsla(${hue}, 70%, 50%, ${0.2 + pt.cooperation * 0.6})`,
                  }}
                  title={`Type ${i}: ${coopPct}% cooperative`}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
