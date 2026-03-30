'use client'

import { useMemo, useState } from 'react'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { ChevronDown, ChevronUp, BarChart3, Table2, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SimulationStats } from '../types'
import { METRIC_INFO } from '../config'

interface ComparisonStatsProps {
  history1: SimulationStats[]
  history2: SimulationStats[]
  label1: string
  label2: string
  color1: string
  color2: string
}

const COMPARED_METRICS = ['energy', 'segregation', 'spatialEntropy', 'moransI', 'msd', 'clusterCount', 'cooperation', 'aggression'] as const

/** Welch's t-test for unequal variances */
function welchTTest(a: number[], b: number[]): { t: number; p: number; df: number } {
  const n1 = a.length, n2 = b.length
  if (n1 < 3 || n2 < 3) return { t: 0, p: 1, df: 0 }

  const mean1 = a.reduce((s, v) => s + v, 0) / n1
  const mean2 = b.reduce((s, v) => s + v, 0) / n2
  const var1 = a.reduce((s, v) => s + (v - mean1) ** 2, 0) / (n1 - 1)
  const var2 = b.reduce((s, v) => s + (v - mean2) ** 2, 0) / (n2 - 1)

  const se1 = var1 / n1, se2 = var2 / n2
  const se = Math.sqrt(se1 + se2)
  if (se === 0) return { t: 0, p: 1, df: n1 + n2 - 2 }

  const t = (mean1 - mean2) / se
  const df = (se1 + se2) ** 2 / ((se1 ** 2) / (n1 - 1) + (se2 ** 2) / (n2 - 1))

  const absT = Math.abs(t)
  const p = df > 30
    ? 2 * (1 - normalCDF(absT))
    : 2 * (1 - tCDF(absT, Math.max(1, Math.round(df))))

  return { t, p: Math.max(0, Math.min(1, p)), df }
}

function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429
  const p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.SQRT2
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1.0 + sign * y)
}

function tCDF(x: number, df: number): number {
  const t2 = x * x
  const z = x * (1 - 1 / (4 * df)) / Math.sqrt(1 + t2 / (2 * df))
  return normalCDF(z)
}

function cohensD(a: number[], b: number[]): number {
  const n1 = a.length, n2 = b.length
  if (n1 < 2 || n2 < 2) return 0
  const mean1 = a.reduce((s, v) => s + v, 0) / n1
  const mean2 = b.reduce((s, v) => s + v, 0) / n2
  const var1 = a.reduce((s, v) => s + (v - mean1) ** 2, 0) / (n1 - 1)
  const var2 = b.reduce((s, v) => s + (v - mean2) ** 2, 0) / (n2 - 1)
  const pooled = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
  return pooled > 0 ? (mean1 - mean2) / pooled : 0
}

function mean(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1))
}

function effectLabel(d: number): string {
  const abs = Math.abs(d)
  if (abs < 0.2) return 'negligible'
  if (abs < 0.5) return 'small'
  if (abs < 0.8) return 'medium'
  return 'large'
}

function pColor(p: number): string {
  if (p < 0.01) return 'text-[#D4AF37]'
  if (p < 0.05) return 'text-emerald-400'
  return 'text-white/45'
}

function pLabel(p: number): string {
  if (p < 0.001) return '***'
  if (p < 0.01) return '**'
  if (p < 0.05) return '*'
  return 'ns'
}

function ComparisonSparkline({ data, color1, color2, height = 50 }: {
  data: { tick: number; v1: number; v2: number }[]
  color1: string
  color2: string
  height?: number
}) {
  if (data.length < 3) return null
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
        <XAxis dataKey="tick" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9, fontFamily: 'monospace' }}
          labelFormatter={(t) => `Tick ${t}`}
          formatter={(value) => [typeof value === 'number' ? value.toFixed(3) : String(value), '']}
        />
        <Line type="monotone" dataKey="v1" stroke={color1} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="v2" stroke={color2} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function DifferenceBar({ mean1, mean2, color1, color2, metricKey }: {
  mean1: number; mean2: number; color1: string; color2: string; metricKey: string
}) {
  const maxVal = Math.max(Math.abs(mean1), Math.abs(mean2), 0.001)
  const w1 = Math.abs(mean1) / maxVal * 100
  const w2 = Math.abs(mean2) / maxVal * 100
  const winner = Math.abs(mean1) > Math.abs(mean2) ? 1 : Math.abs(mean2) > Math.abs(mean1) ? 2 : 0

  return (
    <div className="flex items-center gap-1 h-4">
      <div className="flex-1 flex justify-end">
        <div
          className="h-2.5 transition-all duration-300"
          style={{ width: `${w1}%`, backgroundColor: color1 + '80', borderRight: winner === 1 ? `2px solid ${color1}` : 'none' }}
        />
      </div>
      <div className="w-px h-3 bg-white/10 shrink-0" />
      <div className="flex-1">
        <div
          className="h-2.5 transition-all duration-300"
          style={{ width: `${w2}%`, backgroundColor: color2 + '80', borderLeft: winner === 2 ? `2px solid ${color2}` : 'none' }}
        />
      </div>
    </div>
  )
}

export function ComparisonStats({ history1, history2, label1, label2, color1, color2 }: ComparisonStatsProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual')

  const stats = useMemo(() => {
    if (history1.length < 10 || history2.length < 10) return null

    const skip1 = Math.floor(history1.length * 0.2)
    const skip2 = Math.floor(history2.length * 0.2)
    const h1 = history1.slice(skip1)
    const h2 = history2.slice(skip2)

    return COMPARED_METRICS.map((key) => {
      const a = h1.map((s) => (s[key as keyof SimulationStats] as number) ?? 0)
      const b = h2.map((s) => (s[key as keyof SimulationStats] as number) ?? 0)
      const test = welchTTest(a, b)
      const d = cohensD(a, b)
      return {
        key,
        label: METRIC_INFO[key]?.label ?? (key === 'cooperation' ? 'Cooperation' : key === 'aggression' ? 'Aggression' : key),
        mean1: mean(a),
        mean2: mean(b),
        sd1: stdDev(a),
        sd2: stdDev(b),
        diff: mean(a) - mean(b),
        pctDiff: mean(b) !== 0 ? ((mean(a) - mean(b)) / Math.abs(mean(b))) * 100 : 0,
        t: test.t,
        p: test.p,
        df: test.df,
        d,
        effectLabel: effectLabel(d),
      }
    })
  }, [history1, history2])

  // Sparkline data (sampled)
  const sparklineData = useMemo(() => {
    if (history1.length < 5 || history2.length < 5) return {}
    const result: Record<string, { tick: number; v1: number; v2: number }[]> = {}
    const len = Math.min(history1.length, history2.length)
    const step = Math.max(1, Math.floor(len / 100))

    for (const key of COMPARED_METRICS) {
      const data: { tick: number; v1: number; v2: number }[] = []
      for (let i = 0; i < len; i += step) {
        data.push({
          tick: history1[i]!.tick,
          v1: (history1[i]![key as keyof SimulationStats] as number) ?? 0,
          v2: (history2[i]![key as keyof SimulationStats] as number) ?? 0,
        })
      }
      result[key] = data
    }
    return result
  }, [history1, history2])

  if (!stats) {
    return (
      <div className="border border-white/[0.06] bg-[#050505] p-3">
        <div className="text-xs font-mono text-white/35 text-center">
          Collecting data... (need at least 10 samples per engine for comparison)
        </div>
      </div>
    )
  }

  const significantCount = stats.filter((s) => s.p < 0.05).length

  // Determine overall winner
  const wins1 = stats.filter((s) => s.p < 0.05 && s.mean1 > s.mean2).length
  const wins2 = stats.filter((s) => s.p < 0.05 && s.mean2 > s.mean1).length

  return (
    <div className="border border-white/[0.06] bg-[#050505] space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-0">
        <div className="flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-[#D4AF37]/40" />
          <span className="text-xs font-mono text-white/55 uppercase tracking-wider">
            A/B Comparison
          </span>
          <span className="text-[11px] font-mono text-white/35">
            {significantCount}/{stats.length} significant
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('visual')}
            className={cn('p-1 transition-colors', viewMode === 'visual' ? 'text-[#D4AF37]/60' : 'text-white/30 hover:text-white/45')}
            title="Visual comparison"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn('p-1 transition-colors', viewMode === 'table' ? 'text-[#D4AF37]/60' : 'text-white/30 hover:text-white/45')}
            title="Table view"
          >
            <Table2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5" style={{ backgroundColor: color1 }} />
          <span style={{ color: color1 }}>{label1}</span>
          {wins1 > wins2 && <Trophy className="w-2.5 h-2.5 text-[#D4AF37]/50" />}
        </div>
        <span className="text-white/30">vs</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5" style={{ backgroundColor: color2 }} />
          <span style={{ color: color2 }}>{label2}</span>
          {wins2 > wins1 && <Trophy className="w-2.5 h-2.5 text-[#D4AF37]/50" />}
        </div>
      </div>

      {viewMode === 'visual' ? (
        <div className="px-3 pb-3 space-y-2">
          {/* Visual metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.key} className="border border-white/[0.04] bg-white/[0.01] p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-white/45 uppercase">{s.label}</span>
                  <span className={cn('text-[10px] font-mono font-bold', pColor(s.p))}>{pLabel(s.p)}</span>
                </div>

                {/* Difference bar */}
                <DifferenceBar mean1={s.mean1} mean2={s.mean2} color1={color1} color2={color2} metricKey={s.key} />

                {/* Values */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span style={{ color: color1 }}>{s.mean1.toFixed(2)}</span>
                  <span className={cn(
                    s.pctDiff > 0 ? 'text-emerald-400/50' : s.pctDiff < 0 ? 'text-red-400/50' : 'text-white/35',
                  )}>
                    {s.pctDiff > 0 ? '+' : ''}{s.pctDiff.toFixed(0)}%
                  </span>
                  <span style={{ color: color2 }}>{s.mean2.toFixed(2)}</span>
                </div>

                {/* Sparkline */}
                {sparklineData[s.key] && (
                  <ComparisonSparkline data={sparklineData[s.key]!} color1={color1} color2={color2} height={35} />
                )}

                {/* Effect size */}
                <div className="text-[9px] font-mono text-white/30 text-center">
                  d={Math.abs(s.d).toFixed(2)} ({s.effectLabel})
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-3 pb-3">
          {/* Table view */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-white/35 border-b border-white/[0.04]">
                  <th className="text-left py-1 pr-2">Metric</th>
                  <th className="text-right py-1 px-1" style={{ color: color1 }}>Mean +/- SD</th>
                  <th className="text-right py-1 px-1" style={{ color: color2 }}>Mean +/- SD</th>
                  <th className="text-right py-1 px-1">Diff%</th>
                  <th className="text-right py-1 px-1">p-value</th>
                  <th className="text-right py-1 px-1">Cohen&apos;s d</th>
                  <th className="text-right py-1 pl-1">Sig.</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.key} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                    <td className="text-left py-1 pr-2 text-white/55">{s.label}</td>
                    <td className="text-right py-1 px-1 text-white/60">
                      {s.mean1.toFixed(2)} <span className="text-white/35">+/-{s.sd1.toFixed(2)}</span>
                    </td>
                    <td className="text-right py-1 px-1 text-white/60">
                      {s.mean2.toFixed(2)} <span className="text-white/35">+/-{s.sd2.toFixed(2)}</span>
                    </td>
                    <td className={cn('text-right py-1 px-1', s.pctDiff > 0 ? 'text-emerald-400/50' : 'text-red-400/50')}>
                      {s.pctDiff > 0 ? '+' : ''}{s.pctDiff.toFixed(1)}%
                    </td>
                    <td className={cn('text-right py-1 px-1', pColor(s.p))}>
                      {s.p < 0.001 ? '<0.001' : s.p.toFixed(3)}
                    </td>
                    <td className="text-right py-1 px-1 text-white/55">
                      {Math.abs(s.d).toFixed(2)} <span className="text-white/30">({s.effectLabel})</span>
                    </td>
                    <td className={cn('text-right py-1 pl-1 font-bold', pColor(s.p))}>
                      {pLabel(s.p)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 pb-2 text-[10px] font-mono text-white/30 space-y-0.5">
        <div>Welch&apos;s t-test (unequal variances). * p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001.</div>
        <div>First 20% excluded (transient startup). Cohen&apos;s d: small (&lt;0.5), medium (&lt;0.8), large (&ge;0.8).</div>
      </div>
    </div>
  )
}
