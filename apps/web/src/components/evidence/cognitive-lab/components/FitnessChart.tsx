'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import type { GenerationSnapshot } from '../types'

export interface FitnessChartProps {
  history: GenerationSnapshot[]
  annaBaseline: number
  height?: number
}

export function FitnessChart({
  history,
  annaBaseline,
  height = 240,
}: FitnessChartProps) {
  const data = history.map(s => ({
    gen: s.generation,
    best: s.fitness.best,
    median: s.fitness.median,
    worst: s.fitness.worst,
  }))
  return (
    <div className="border border-border bg-[#0A0A0A] p-3">
      <div className="text-xs text-white/55 mb-2 font-mono uppercase">
        Fitness over generations
      </div>
      <ResponsiveContainer height={height} width="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 56, left: 8, bottom: 36 }}
        >
          <CartesianGrid stroke="#222" strokeDasharray="3 3" />
          <XAxis
            dataKey="gen"
            label={{
              value: 'generation',
              position: 'insideBottom',
              offset: -2,
              fill: '#888',
              fontSize: 10,
            }}
            stroke="#888"
            tick={{ fontSize: 10 }}
          />
          <YAxis
            domain={[0.4, 0.7]}
            stroke="#888"
            tick={{ fontSize: 11 }}
            tickFormatter={v => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0A0A0A',
              border: '1px solid #D4AF37',
            }}
            formatter={v => (typeof v === 'number' ? v.toFixed(4) : String(v))}
          />
          <ReferenceLine
            label={{
              value: 'chance',
              position: 'insideRight',
              fill: '#888',
              fontSize: 9,
            }}
            stroke="#666"
            strokeDasharray="3 3"
            y={0.5}
          />
          <ReferenceLine
            label={{
              value: `Anna ${annaBaseline.toFixed(3)}`,
              position: 'insideTopRight',
              fill: '#D4AF37',
              fontSize: 9,
            }}
            stroke="#D4AF37"
            strokeDasharray="6 3"
            y={annaBaseline}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
          <Line
            dataKey="best"
            dot={false}
            name="Best"
            stroke="#D4AF37"
            strokeWidth={2}
          />
          <Line
            dataKey="median"
            dot={false}
            name="Median"
            stroke="#888"
            strokeWidth={1.5}
          />
          <Line
            dataKey="worst"
            dot={false}
            name="Worst"
            stroke="#a16060"
            strokeWidth={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
