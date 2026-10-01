'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/navigation'

type Run = {
  regime: string
  seed: number
  d: number
  d_own?: number
  best_ternary?: number
}
type Fingerprint = {
  note: string
  near_threshold: number
  anna: { best_ternary: number }
  regimes: Record<string, string>
  runs: Run[]
}

const OWN_TARGET = new Set(['sub/E', 'sub/S'])
const BIN = 0.01

const AXIS_TICK = {
  fill: 'var(--muted-foreground)',
  fontSize: 11,
  fontFamily: 'var(--font-mono, monospace)',
}
const TOOLTIP_STYLE = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 0,
  fontSize: 12,
  color: 'var(--popover-foreground)',
}

const distance = (r: Run) => (OWN_TARGET.has(r.regime) ? (r.d_own ?? r.d) : r.d)

// Deterministic vertical jitter so dots in one row do not sit on top of each other.
const jitter = (seed: number) => (((seed * 7919) % 97) / 97 - 0.5) * 0.5

function ChartFrame({
  title,
  caption,
  children,
}: {
  title: string
  caption: string
  children: React.ReactNode
}) {
  return (
    <figure className="flex flex-col gap-3 border border-border p-4 md:p-6">
      <figcaption className="flex flex-col gap-1">
        <span className="font-serif text-lg font-semibold">{title}</span>
        <span className="text-sm text-muted-foreground">{caption}</span>
      </figcaption>
      {children}
    </figure>
  )
}

export default function OriginTab() {
  const [data, setData] = useState<Fingerprint | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/data/itu-fingerprint.json')
      .then(r => r.json() as Promise<Fingerprint>)
      .then(j => alive && setData(j))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [])

  const derived = useMemo(() => {
    if (!data) return null
    const regimes = Object.keys(data.regimes)
    const rows = regimes.map(regime => {
      const runs = data.runs.filter(r => r.regime === regime)
      return {
        regime,
        label: data.regimes[regime] ?? regime,
        ownTarget: OWN_TARGET.has(regime),
        total: runs.length,
        near: runs.filter(r => distance(r) <= data.near_threshold).length,
      }
    })
    const dots = data.runs.map(r => ({
      x: distance(r),
      y: regimes.indexOf(r.regime) + jitter(r.seed),
      regime: r.regime,
      seed: r.seed,
    }))

    const trained = data.runs.filter(
      r => r.regime !== 'walk' && typeof r.best_ternary === 'number'
    )
    const values = trained.map(r => r.best_ternary as number)
    const anna = data.anna.best_ternary
    const lo = Math.floor(Math.min(...values) / BIN) * BIN
    const hi = Math.max(...values, anna)
    const bins = Array.from(
      { length: Math.floor((hi - lo) / BIN + 1e-9) + 1 },
      (_, i) => ({
        bin: (lo + i * BIN).toFixed(2),
        below: 0,
        reach: 0,
      })
    )
    for (const v of values) {
      const b = bins[Math.floor((v - lo) / BIN + 1e-9)]
      if (b) b[v >= anna ? 'reach' : 'below'] += 1
    }
    const annaBin = bins[Math.floor((anna - lo) / BIN + 1e-9)]?.bin
    const reach = values.filter(v => v >= anna).length

    return { regimes, rows, dots, bins, annaBin, reach, m: values.length, anna }
  }, [data])

  if (failed)
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        The fingerprint data could not be loaded.
      </p>
    )
  if (!data || !derived)
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
    )

  const { regimes, rows, dots, bins, annaBin, reach, m, anna } = derived
  const threshold = data.near_threshold

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-3xl">
        <h3 className="font-serif text-2xl font-semibold mb-2">
          Which kind of unit produces a map like Anna&apos;s?
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each dot is one public Aigarth unit, trained or mutated, compared with
          the corrected Anna map. Further left means closer.
        </p>
      </div>

      <ChartFrame
        caption={`d = largest difference over six map statistics. The line marks d = ${threshold}. For the x − y controls the dots show d on their own target.`}
        title="Distance to Anna by training regime"
      >
        <div className="h-80 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis
                dataKey="x"
                domain={[0, 'auto']}
                label={{
                  value: 'd',
                  position: 'insideBottom',
                  offset: -12,
                  fill: 'var(--muted-foreground)',
                  fontSize: 11,
                }}
                stroke="var(--border)"
                tick={AXIS_TICK}
                type="number"
              />
              <YAxis
                dataKey="y"
                domain={[-0.5, regimes.length - 0.5]}
                reversed
                stroke="var(--border)"
                tick={AXIS_TICK}
                tickFormatter={(i: number) => regimes[i] ?? ''}
                ticks={regimes.map((_, i) => i)}
                type="number"
                width={64}
              />
              <Tooltip
                content={({ payload }) => {
                  const p = payload?.[0]?.payload as
                    | (typeof dots)[number]
                    | undefined
                  if (!p) return null
                  return (
                    <div className="border border-border bg-popover px-3 py-2 font-mono text-xs text-popover-foreground">
                      {p.regime}, seed {p.seed}:{' '}
                      {OWN_TARGET.has(p.regime) ? 'd_own' : 'd'} ={' '}
                      {p.x.toFixed(3)}
                    </div>
                  )
                }}
                contentStyle={TOOLTIP_STYLE}
                cursor={false}
              />
              <ReferenceLine
                label={{
                  value: String(threshold),
                  position: 'top',
                  fill: 'var(--gold)',
                  fontSize: 11,
                }}
                stroke="var(--gold)"
                strokeDasharray="4 3"
                x={threshold}
              />
              <Scatter
                data={dots}
                isAnimationActive={false}
                shape={(props: {
                  cx?: number
                  cy?: number
                  payload?: { x: number }
                }) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    fill={
                      (props.payload?.x ?? 1) <= threshold
                        ? 'var(--gold)'
                        : 'var(--muted-foreground)'
                    }
                    fillOpacity={
                      (props.payload?.x ?? 1) <= threshold ? 1 : 0.45
                    }
                    r={4}
                    stroke="var(--card)"
                    strokeWidth={1}
                  />
                )}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4 font-normal">Regime</th>
                <th className="py-2 pr-4 font-normal">Setup</th>
                <th className="py-2 pr-4 font-normal text-right">Runs</th>
                <th className="py-2 font-normal text-right">d ≤ {threshold}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr className="border-b border-border/50" key={row.regime}>
                  <td className="py-2 pr-4 font-mono">{row.regime}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {row.label}
                    {row.ownTarget && (
                      <span className="block text-xs">
                        x − y, on its own target
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono tabular-nums">
                    {row.total}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums text-foreground">
                    {row.near}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartFrame>

      <ChartFrame
        caption={`best_ternary across ${m} trained units (random-mutation runs excluded). ${reach} of ${m} reach Anna's value of ${anna}.`}
        title="How much one ternary threshold per bit explains"
      >
        <p className="font-mono text-3xl font-semibold tabular-nums text-gold">
          {reach}{' '}
          <span className="text-base text-muted-foreground">
            of {m} reach Anna
          </span>
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              barCategoryGap={2}
              data={bins}
              margin={{ top: 20, right: 16, bottom: 24, left: 0 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis
                dataKey="bin"
                interval="preserveStartEnd"
                label={{
                  value: 'best_ternary (bin start)',
                  position: 'insideBottom',
                  offset: -12,
                  fill: 'var(--muted-foreground)',
                  fontSize: 11,
                }}
                stroke="var(--border)"
                tick={AXIS_TICK}
              />
              <YAxis
                allowDecimals={false}
                stroke="var(--border)"
                tick={AXIS_TICK}
                width={32}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                formatter={(v, name) => [
                  String(v),
                  name === 'reach' ? 'at or above Anna' : 'below Anna',
                ]}
                labelFormatter={l => `bin from ${String(l)}`}
              />
              {annaBin && (
                <ReferenceLine
                  label={{
                    value: `Anna ${anna}`,
                    position: 'top',
                    fill: 'var(--gold)',
                    fontSize: 11,
                  }}
                  stroke="var(--gold)"
                  strokeDasharray="4 3"
                  x={annaBin}
                />
              )}
              <Bar
                dataKey="below"
                fill="var(--muted-foreground)"
                fillOpacity={0.45}
                isAnimationActive={false}
                stackId="t"
              />
              <Bar
                dataKey="reach"
                fill="var(--gold)"
                isAnimationActive={false}
                stackId="t"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartFrame>

      <div className="flex flex-col gap-3 border-l-2 border-gold/40 pl-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Method note
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {data.note}
        </p>
        <Link
          className="inline-flex items-center gap-1.5 text-sm text-gold/80 hover:text-gold hover:underline underline-offset-4"
          href="/docs/03-results/36-where-the-anna-matrix-comes-from"
        >
          Where the Anna Matrix comes from (chapter 36)
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
