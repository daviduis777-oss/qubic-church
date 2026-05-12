'use client'

import { useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const TASKS = ['identity_a', 'max', 'and', 'or', 'parity', 'addition_low'] as const
type TaskName = (typeof TASKS)[number]

export interface ParetoScatterProps {
  /** Per-matrix multi-task fitness vector, length 6 each */
  fitnessVectors: number[][]
  /** Anna's reference vector (length 6) */
  annaVector: number[]
  height?: number
}

export function ParetoScatter({ fitnessVectors, annaVector, height = 280 }: ParetoScatterProps) {
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
    <div className="border border-white/[0.06] bg-[#0A0A0A] p-3">
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="text-white/55 font-mono uppercase">Multi-task fitness landscape</span>
        <div className="flex gap-1 items-center">
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value as TaskName)}
            className="bg-black/30 border border-white/10 text-white/85 text-xs px-1.5 py-0.5 font-mono"
          >
            {TASKS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="text-white/40">×</span>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value as TaskName)}
            className="bg-black/30 border border-white/10 text-white/85 text-xs px-1.5 py-0.5 font-mono"
          >
            {TASKS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 8, right: 16, left: 24, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis
            dataKey="x"
            type="number"
            stroke="#888"
            tick={{ fontSize: 11 }}
            domain={[0.4, 1]}
            ticks={[0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
            label={{ value: xAxis, position: 'insideBottom', offset: -16, fill: '#888', fontSize: 10 }}
          />
          <YAxis
            dataKey="y"
            type="number"
            stroke="#888"
            tick={{ fontSize: 11 }}
            domain={[0.4, 1]}
            ticks={[0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
            label={{ value: yAxis, angle: -90, position: 'insideLeft', offset: -2, fill: '#888', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #D4AF37' }}
            formatter={(v) => (typeof v === 'number' ? v.toFixed(3) : String(v))}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Scatter data={data} fill="#7f7f7f" name="evolved candidates" />
          <Scatter data={[{ x: annaX, y: annaY, matrix: -1 }]} fill="#D4AF37" name="Anna" shape="cross" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
