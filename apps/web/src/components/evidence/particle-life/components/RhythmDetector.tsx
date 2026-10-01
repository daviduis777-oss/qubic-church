'use client'

import { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { ChevronDown, ChevronUp, Waves, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SimulationStats } from '../types'

interface RhythmDetectorProps {
  history: SimulationStats[]
  isOpen: boolean
  onToggle: () => void
}

/** Simple autocorrelation for a time series at a given lag */
function autocorrelation(data: number[], lag: number): number {
  if (data.length < lag + 10) return 0
  const n = data.length
  const m = data.reduce((s, v) => s + v, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    den += (data[i]! - m) ** 2
    if (i + lag < n) {
      num += (data[i]! - m) * (data[i + lag]! - m)
    }
  }
  return den > 0 ? num / den : 0
}

/** Find dominant period via autocorrelation peak detection */
function findDominantPeriod(data: number[], maxLag: number = 50): { period: number; strength: number; acf: number[] } {
  const acf: number[] = []
  for (let lag = 0; lag <= maxLag; lag++) {
    acf.push(autocorrelation(data, lag))
  }

  // Find first significant peak after lag 2
  let bestLag = 0
  let bestVal = 0
  for (let i = 3; i < acf.length - 1; i++) {
    if (acf[i]! > acf[i - 1]! && acf[i]! > acf[i + 1]! && acf[i]! > bestVal) {
      bestVal = acf[i]!
      bestLag = i
    }
  }

  return { period: bestLag, strength: bestVal, acf }
}

/** Classify behavioral state based on metric patterns */
function classifyBehavior(stats: SimulationStats[]): {
  state: string
  color: string
  description: string
  confidence: number
} {
  if (stats.length < 20) {
    return { state: 'Initializing', color: '#64748b', description: 'Gathering initial data...', confidence: 0 }
  }

  const recent = stats.slice(-20)
  const avgEnergy = recent.reduce((s, st) => s + st.energy, 0) / recent.length
  const avgSegregation = recent.reduce((s, st) => s + st.segregation, 0) / recent.length
  const avgCoop = recent.reduce((s, st) => s + (st.cooperation ?? 0), 0) / recent.length
  const avgMorans = recent.reduce((s, st) => s + st.moransI, 0) / recent.length

  // Energy trend
  const firstHalf = stats.slice(-40, -20)
  const energyTrend = firstHalf.length > 0
    ? (avgEnergy - firstHalf.reduce((s, st) => s + st.energy, 0) / firstHalf.length)
    : 0

  if (avgEnergy < 0.1) {
    return { state: 'Equilibrium', color: '#64748b', description: 'System at rest. All forces balanced.', confidence: 0.95 }
  }
  if (avgEnergy > 8) {
    return { state: 'Chaos', color: '#EF4444', description: 'High energy turbulence. Emergent patterns may form as energy dissipates.', confidence: 0.9 }
  }
  if (avgCoop > 0.5 && avgSegregation < 0.4) {
    return { state: 'Cooperative Clustering', color: '#4ade80', description: 'Types forming stable cooperative groups. This is the Anna Matrix\'s signature behavior.', confidence: 0.85 }
  }
  if (avgMorans > 0.3) {
    return { state: 'Self-Organizing', color: '#3B82F6', description: 'Strong spatial autocorrelation. Same-type particles clustering together spontaneously.', confidence: 0.8 }
  }
  if (avgSegregation < 0.3) {
    return { state: 'Tribal Formation', color: '#8B5CF6', description: 'Each particle type establishing its own territory. Spatial segregation emerging.', confidence: 0.75 }
  }
  if (energyTrend < -0.5) {
    return { state: 'Settling', color: '#F59E0B', description: 'Energy decreasing. System transitioning from chaos toward structured patterns.', confidence: 0.7 }
  }
  return { state: 'Active Dynamics', color: '#D4AF37', description: 'Complex interaction patterns forming. Watch for emerging structures.', confidence: 0.6 }
}

export function RhythmDetector({ history, isOpen, onToggle }: RhythmDetectorProps) {
  const analysis = useMemo(() => {
    if (history.length < 30) return null

    const energyData = history.map((s) => s.energy)
    const segData = history.map((s) => s.segregation)
    const coopData = history.map((s) => s.cooperation ?? 0)

    const energyRhythm = findDominantPeriod(energyData)
    const segRhythm = findDominantPeriod(segData)
    const coopRhythm = findDominantPeriod(coopData)

    const behavior = classifyBehavior(history)

    return { energyRhythm, segRhythm, coopRhythm, behavior }
  }, [history])

  if (!analysis) return null

  const hasRhythm = analysis.energyRhythm.strength > 0.3 || analysis.segRhythm.strength > 0.3

  return (
    <div className="border border-white/[0.06] bg-[#050505]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Waves className="w-3.5 h-3.5 text-[#D4AF37]/40" />
          <span className="text-xs font-mono text-white/55 uppercase tracking-wider">
            Behavioral Rhythm Analysis
          </span>
          {hasRhythm && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400/50">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              rhythm detected
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/45" /> : <ChevronDown className="w-3.5 h-3.5 text-white/45" />}
      </button>

      {isOpen && (
        <div className="p-3 pt-0 space-y-3">
          {/* Current behavioral state */}
          <div
            className="p-3 border"
            style={{
              backgroundColor: `${analysis.behavior.color}08`,
              borderColor: `${analysis.behavior.color}25`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: analysis.behavior.color }} />
              <span className="text-sm font-mono font-medium" style={{ color: analysis.behavior.color }}>
                {analysis.behavior.state}
              </span>
              <span className="text-[10px] font-mono text-white/35">
                {Math.round(analysis.behavior.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-xs text-white/55 font-sans leading-relaxed">
              {analysis.behavior.description}
            </p>
          </div>

          {/* Rhythm indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { label: 'Energy', rhythm: analysis.energyRhythm, color: '#D4AF37' },
              { label: 'Segregation', rhythm: analysis.segRhythm, color: '#3B82F6' },
              { label: 'Cooperation', rhythm: analysis.coopRhythm, color: '#4ade80' },
            ].map(({ label, rhythm, color }) => (
              <div key={label} className="border border-white/[0.04] bg-white/[0.01] p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-white/40 uppercase">{label}</span>
                  {rhythm.strength > 0.3 && (
                    <span className="text-[10px] font-mono px-1 py-0.5 bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/20">
                      P={rhythm.period}
                    </span>
                  )}
                </div>

                {/* ACF plot */}
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart
                    data={rhythm.acf.map((v, i) => ({ lag: i, acf: v }))}
                    margin={{ top: 2, right: 2, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="lag" hide />
                    <YAxis hide domain={[-0.5, 1]} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" />
                    <ReferenceLine y={0.3} stroke="rgba(74,222,128,0.15)" strokeDasharray="2 2" />
                    <Line type="monotone" dataKey="acf" stroke={color} strokeWidth={1} dot={false} isAnimationActive={false} />
                    {rhythm.period > 0 && rhythm.strength > 0.3 && (
                      <ReferenceLine x={rhythm.period} stroke="rgba(212,175,55,0.4)" strokeDasharray="3 3" />
                    )}
                  </LineChart>
                </ResponsiveContainer>

                <div className="text-[10px] font-mono text-white/35 mt-0.5">
                  {rhythm.strength > 0.3
                    ? `Period ${rhythm.period} samples (r=${rhythm.strength.toFixed(2)})`
                    : 'No significant periodicity detected'
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="text-[11px] text-white/35 font-sans leading-relaxed">
            <strong className="text-white/45">How to read:</strong> Autocorrelation measures how similar the signal is to a delayed version of itself.
            A peak at lag N means the metric repeats every N measurement intervals.
            The green dashed line at 0.3 marks statistical significance.
            {hasRhythm && ' The Anna Matrix\'s 90° eigenvalue predicts period-4 behavioral rhythms.'}
          </div>
        </div>
      )}
    </div>
  )
}
