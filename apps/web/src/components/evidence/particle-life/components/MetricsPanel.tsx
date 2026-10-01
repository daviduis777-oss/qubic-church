'use client'

import { useMemo, useState } from 'react'
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts'
import { ChevronDown, ChevronUp, Download, TrendingUp, TrendingDown, Minus, BarChart3, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SimulationStats, VelocityBin } from '../types'
import { METRIC_INFO } from '../config'

interface PhaseTransitionMarker {
  tick: number
  metric: string
  magnitude: number
}

interface MetricsPanelProps {
  history: SimulationStats[]
  currentStats: SimulationStats
  isOpen: boolean
  onToggle: () => void
  onExport?: () => void
  phaseTransitions?: PhaseTransitionMarker[]
}

const EMPTY_TRANSITIONS: PhaseTransitionMarker[] = []

function MiniChart({ data, dataKey, color, height = 60, transitionTicks = [] }: {
  data: { tick: number; value: number }[]
  dataKey: string
  color: string
  height?: number
  transitionTicks?: number[]
}) {
  if (data.length < 2) return <div className="h-[60px] bg-white/[0.02]" />

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="tick" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#111',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 10,
            fontFamily: 'monospace',
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
          formatter={(value) => [typeof value === 'number' ? value.toFixed(4) : String(value), dataKey]}
          labelFormatter={(tick) => `Tick ${tick}`}
        />
        {transitionTicks.map((t) => (
          <ReferenceLine key={`pt-${t}`} x={t} stroke="rgba(239,68,68,0.5)" strokeDasharray="2 2" />
        ))}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function VelocityHistogram({ data, height = 80 }: {
  data: VelocityBin[]
  height?: number
}) {
  if (!data || data.length === 0) return <div className="h-[80px] bg-white/[0.02]" />

  const maxCount = Math.max(...data.map((d) => d.count))
  // Compute mean speed for reference line
  const totalParticles = data.reduce((s, d) => s + d.count, 0)
  const meanSpeed = totalParticles > 0
    ? data.reduce((s, d) => s + d.speed * d.count, 0) / totalParticles
    : 0

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="speed" hide />
        <YAxis hide domain={[0, 'auto']} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#111',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 10,
            fontFamily: 'monospace',
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
          formatter={(value) => [String(value), 'particles']}
          labelFormatter={(speed) => `Speed ${typeof speed === 'number' ? speed.toFixed(2) : speed}`}
        />
        <ReferenceLine x={meanSpeed} stroke="rgba(212,175,55,0.5)" strokeDasharray="3 3" label="" />
        <Bar dataKey="count" isAnimationActive={false}>
          {data.map((entry) => {
            const intensity = maxCount > 0 ? entry.count / maxCount : 0
            return (
              <Cell
                key={`speed-${entry.speed.toFixed(4)}`}
                fill={`rgba(212, 175, 55, ${0.15 + intensity * 0.65})`}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function Trend({ current, prev }: { current: number; prev: number }) {
  const diff = current - prev
  const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0
  if (Math.abs(pct) < 1) return <Minus className="w-2.5 h-2.5 text-white/35" />
  return diff > 0
    ? <TrendingUp className="w-2.5 h-2.5 text-emerald-400/60" />
    : <TrendingDown className="w-2.5 h-2.5 text-red-400/60" />
}

function StatBadge({ metricKey, value, history }: {
  metricKey: string
  value: number
  history: SimulationStats[]
}) {
  const info = METRIC_INFO[metricKey]
  if (!info) return null

  const prevValue = history.length > 20
    ? (history[history.length - 20] as SimulationStats)?.[metricKey as keyof SimulationStats] as number ?? value
    : value

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.02] border border-white/[0.04]" title={info.description}>
      <span className="text-[11px] font-mono text-white/45 uppercase">{info.label}</span>
      <span className="text-xs font-mono text-white/70">
        {Number.isInteger(value) ? value.toLocaleString() : value.toFixed(3)}
      </span>
      <Trend current={value} prev={prevValue} />
    </div>
  )
}

export function MetricsPanel({ history, currentStats, isOpen, onToggle, onExport, phaseTransitions = EMPTY_TRANSITIONS }: MetricsPanelProps) {
  const [showVelocity, setShowVelocity] = useState(true)

  const chartData = useMemo(() => {
    const metrics: Record<string, { tick: number; value: number }[]> = {
      energy: [],
      segregation: [],
      spatialEntropy: [],
      moransI: [],
      msd: [],
      clusterCount: [],
      largestCluster: [],
      cooperation: [],
      aggression: [],
    }

    // Sample for performance (max 200 points)
    const step = Math.max(1, Math.floor(history.length / 200))
    for (let i = 0; i < history.length; i += step) {
      const s = history[i]!
      metrics.energy!.push({ tick: s.tick, value: s.energy })
      metrics.segregation!.push({ tick: s.tick, value: s.segregation })
      metrics.spatialEntropy!.push({ tick: s.tick, value: s.spatialEntropy })
      metrics.moransI!.push({ tick: s.tick, value: s.moransI })
      metrics.msd!.push({ tick: s.tick, value: s.msd })
      metrics.clusterCount!.push({ tick: s.tick, value: s.clusterCount ?? 0 })
      metrics.largestCluster!.push({ tick: s.tick, value: s.largestCluster ?? 0 })
      metrics.cooperation!.push({ tick: s.tick, value: s.cooperation ?? 0 })
      metrics.aggression!.push({ tick: s.tick, value: s.aggression ?? 0 })
    }
    return metrics
  }, [history])

  return (
    <div className="border border-white/[0.06] bg-[#050505]">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <span className="text-xs font-mono text-white/55 uppercase tracking-wider">
          Scientific Metrics
        </span>
        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={(e) => { e.stopPropagation(); onExport() }}
              className="p-1 text-white/35 hover:text-white/65 transition-colors"
              title="Export data"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/45" /> : <ChevronDown className="w-3.5 h-3.5 text-white/45" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-2 sm:p-3 pt-0 space-y-3">
          {/* Live stat badges */}
          <div className="flex flex-wrap gap-1.5">
            <StatBadge metricKey="cooperation" value={currentStats.cooperation ?? 0} history={history} />
            <StatBadge metricKey="aggression" value={currentStats.aggression ?? 0} history={history} />
            <StatBadge metricKey="energy" value={currentStats.energy} history={history} />
            <StatBadge metricKey="segregation" value={currentStats.segregation} history={history} />
            <StatBadge metricKey="spatialEntropy" value={currentStats.spatialEntropy} history={history} />
            <StatBadge metricKey="moransI" value={currentStats.moransI} history={history} />
            <StatBadge metricKey="msd" value={currentStats.msd} history={history} />
            <StatBadge metricKey="clusterCount" value={currentStats.clusterCount ?? 0} history={history} />
            <StatBadge metricKey="largestCluster" value={currentStats.largestCluster ?? 0} history={history} />
          </div>

          {/* Mini charts */}
          {history.length > 5 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {([
                { key: 'cooperation', color: '#4ade80' },
                { key: 'aggression', color: '#f87171' },
                { key: 'energy', color: '#D4AF37' },
                { key: 'segregation', color: '#3B82F6' },
                { key: 'spatialEntropy', color: '#10B981' },
                { key: 'moransI', color: '#8B5CF6' },
                { key: 'msd', color: '#F59E0B' },
                { key: 'clusterCount', color: '#EF4444' },
                { key: 'largestCluster', color: '#EC4899' },
              ] as const).map(({ key, color }) => {
                const transitions = phaseTransitions
                  .filter((t) => t.metric === key)
                  .map((t) => t.tick)
                return (
                  <div key={key} className="border border-white/[0.04] bg-white/[0.01] p-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[11px] font-mono text-white/40 uppercase">
                        {METRIC_INFO[key]?.label ?? key}
                      </div>
                      {transitions.length > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] font-mono text-red-400/50">
                          <Activity className="w-2 h-2" />
                          {transitions.length}
                        </div>
                      )}
                    </div>
                    <MiniChart
                      data={chartData[key] || []}
                      dataKey={key}
                      color={color}
                      height={50}
                      transitionTicks={transitions}
                    />
                  </div>
                )
              })}

              {/* Velocity Distribution Histogram */}
              <div className="border border-white/[0.04] bg-white/[0.01] p-1.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[11px] font-mono text-white/40 uppercase flex items-center gap-1">
                    <BarChart3 className="w-2.5 h-2.5" />
                    Speed Distribution
                  </div>
                  <button
                    onClick={() => setShowVelocity(!showVelocity)}
                    className="text-[10px] font-mono text-white/30 hover:text-white/45"
                  >
                    {showVelocity ? 'hide' : 'show'}
                  </button>
                </div>
                {showVelocity && (
                  <VelocityHistogram data={currentStats.velocityDist ?? []} height={50} />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
