'use client'

import { useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const TASKS = [
  'identity_a',
  'max',
  'and',
  'or',
  'parity',
  'addition_low',
] as const
type TaskName = (typeof TASKS)[number]

export interface ParetoScatterProps {
  /** Per-matrix multi-task fitness vector, length 6 each */
  fitnessVectors: number[][]
  /** Anna's reference vector (length 6) */
  annaVector: number[]
  height?: number
}

export function ParetoScatter({
  fitnessVectors,
  annaVector,
  height = 280,
}: ParetoScatterProps) {
  const [xAxis, setXAxis] = useState<TaskName>('identity_a')
  const [yAxis, setYAxis] = useState<TaskName>('max')

  const xIdx = TASKS.indexOf(xAxis)
  const yIdx = TASKS.indexOf(yAxis)

  const data = fitnessVectors.map((v, i) => ({
    x: v[xIdx] ?? 0,
    y: v[yIdx] ?? 0,
    matrix: i,
  }))
  const annaX = annaVector[xIdx] ?? 0
  const annaY = annaVector[yIdx] ?? 0

  return (
    <div className="border border-border bg-[#0A0A0A] p-3">
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="text-white/55 font-mono uppercase">
          Multi-task fitness landscape
        </span>
        <div className="flex gap-1 items-center">
          <select
            className="bg-black/30 border border-white/10 text-white/85 text-xs px-1.5 py-0.5 font-mono"
            onChange={e => setXAxis(e.target.value as TaskName)}
            value={xAxis}
          >
            {TASKS.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground">×</span>
          <select
            className="bg-black/30 border border-white/10 text-white/85 text-xs px-1.5 py-0.5 font-mono"
            onChange={e => setYAxis(e.target.value as TaskName)}
            value={yAxis}
          >
            {TASKS.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ResponsiveContainer height={height} width="100%">
        <ScatterChart margin={{ top: 8, right: 16, left: 24, bottom: 32 }}>
          <CartesianGrid stroke="#222" strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            domain={[0.4, 1]}
            label={{
              value: xAxis,
              position: 'insideBottom',
              offset: -16,
              fill: '#888',
              fontSize: 10,
            }}
            stroke="#888"
            tick={{ fontSize: 11 }}
            ticks={[0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
            type="number"
          />
          <YAxis
            dataKey="y"
            domain={[0.4, 1]}
            label={{
              value: yAxis,
              angle: -90,
              position: 'insideLeft',
              offset: -2,
              fill: '#888',
              fontSize: 10,
            }}
            stroke="#888"
            tick={{ fontSize: 11 }}
            ticks={[0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
            type="number"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0A0A0A',
              border: '1px solid #D4AF37',
            }}
            formatter={v => (typeof v === 'number' ? v.toFixed(3) : String(v))}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Scatter data={data} fill="#7f7f7f" name="evolved candidates" />
          <Scatter
            data={[{ x: annaX, y: annaY, matrix: -1 }]}
            fill="#D4AF37"
            name="Anna"
            shape="cross"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
