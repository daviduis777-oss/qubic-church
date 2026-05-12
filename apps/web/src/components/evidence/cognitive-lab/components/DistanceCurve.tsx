'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface DistanceCurveProps {
  history: { generation: number; distance: number }[]
  height?: number
}

export function DistanceCurve({ history, height = 180 }: DistanceCurveProps) {
  // Sample x-axis ticks every 20 gens to avoid label crowding
  const ticks: number[] = []
  if (history.length > 0) {
    const last = history[history.length - 1]!.generation
    for (let g = 0; g <= last; g += 20) ticks.push(g)
    if (ticks[ticks.length - 1] !== last) ticks.push(last)
  }

  return (
    <div className="border border-white/[0.06] bg-[#0A0A0A] p-3">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-white/55 font-mono uppercase">Sign-Hamming distance to Anna (best)</span>
        <span className="text-[10px] text-white/40">
          50% = random level · 0% = identical to Anna
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={history} margin={{ top: 8, right: 16, left: 8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="generation" stroke="#888" tick={{ fontSize: 10 }} ticks={ticks} />
          <YAxis stroke="#888" tick={{ fontSize: 11 }} domain={[0, 0.6]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #D4AF37' }}
            formatter={(v) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : String(v))}
          />
          <Line dataKey="distance" stroke="#10b981" strokeWidth={2} dot={false} name="Distance" />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 px-2 py-1.5 bg-amber-500/[0.04] border border-amber-500/20 text-[10px] text-amber-300/80 leading-relaxed">
        <strong className="text-amber-300">Note:</strong> distance typically stays near 50% (random level). Selection on HyperIdentity finds matrices that pass input-bits to output-bits — different solution than Anna's concept-classifier design. The flat line is itself the result: <em>this</em> selection target doesn't drive structural convergence to Anna.
      </div>
    </div>
  )
}
