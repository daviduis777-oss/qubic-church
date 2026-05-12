'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import type { GenerationSnapshot } from '../types'

export interface FitnessChartProps {
  history: GenerationSnapshot[]
  annaBaseline: number
  height?: number
}

export function FitnessChart({ history, annaBaseline, height = 240 }: FitnessChartProps) {
  const data = history.map((s) => ({
    gen: s.generation,
    best: s.fitness.best,
    median: s.fitness.median,
    worst: s.fitness.worst,
  }))
  return (
    <div className="border border-white/[0.06] bg-[#0A0A0A] p-3">
      <div className="text-xs text-white/55 mb-2 font-mono uppercase">Fitness over generations</div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 12, right: 56, left: 8, bottom: 36 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis
            dataKey="gen"
            stroke="#888"
            tick={{ fontSize: 10 }}
            label={{ value: 'generation', position: 'insideBottom', offset: -2, fill: '#888', fontSize: 10 }}
          />
          <YAxis stroke="#888" tick={{ fontSize: 11 }} domain={[0.4, 0.7]} tickFormatter={(v) => v.toFixed(2)} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #D4AF37' }}
            formatter={(v) => (typeof v === 'number' ? v.toFixed(4) : String(v))}
          />
          <ReferenceLine
            y={0.5}
            stroke="#666"
            strokeDasharray="3 3"
            label={{ value: 'chance', position: 'insideRight', fill: '#888', fontSize: 9 }}
          />
          <ReferenceLine
            y={annaBaseline}
            stroke="#D4AF37"
            strokeDasharray="6 3"
            label={{ value: `Anna ${annaBaseline.toFixed(3)}`, position: 'insideTopRight', fill: '#D4AF37', fontSize: 9 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
          <Line dataKey="best" stroke="#D4AF37" strokeWidth={2} dot={false} name="Best" />
          <Line dataKey="median" stroke="#888" strokeWidth={1.5} dot={false} name="Median" />
          <Line dataKey="worst" stroke="#a16060" strokeWidth={1} dot={false} name="Worst" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
