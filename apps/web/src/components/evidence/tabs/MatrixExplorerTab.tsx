'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const N = 128
const SCALE = 8 // canvas pixels per cell
type Matrix = number[][]
type Cell = { r: number; c: number }
type MapId = 'raw' | 'clean'

const MAPS: { id: MapId; label: string; src: string }[] = [
  { id: 'raw', label: 'As transcribed', src: '/data/anna-matrix.json' },
  {
    id: 'clean',
    label: 'Corrected (candidate)',
    src: '/data/anna-matrix-clean.json',
  },
]

const at = (m: Matrix, r: number, c: number) => m[r]?.[c] ?? 0
const breaksRule = (m: Matrix, r: number, c: number) =>
  at(m, r, c) + at(m, N - 1 - r, N - 1 - c) !== -1

function collect(pred: (r: number, c: number) => boolean) {
  const out: Cell[] = []
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) if (pred(r, c)) out.push({ r, c })
  return out
}

// Resolve any CSS colour (including theme custom properties) to RGB via a 1x1 canvas.
function tokenRgb(name: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx || !value) return [128, 128, 128]
  ctx.fillStyle = value
  ctx.fillRect(0, 0, 1, 1)
  const [r = 128, g = 128, b = 128] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

const mix = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + ((b[i] ?? v) - v) * t)).join(',')})`

const validCoord = (s: string) => {
  const v = Number(s)
  return s.trim() !== '' && Number.isInteger(v) && v >= -64 && v <= 63
}

function sign(v: number) {
  return v > 0 ? '+' : v < 0 ? '−' : '0'
}

function CellInfo({ m, cell }: { m: Matrix; cell: Cell }) {
  const { r, c } = cell
  const x = c - 64
  const y = 63 - r
  const v = at(m, r, c)
  const mr = N - 1 - r
  const mc = N - 1 - c
  const mv = at(m, mr, mc)
  const ok = v + mv === -1
  const rows: [string, string][] = [
    ['Cell', `row ${r}, col ${c}`],
    ['Query', `x = ${x}, y = ${y}`],
    ['Value', String(v)],
    ['x + y', String(x + y)],
    [
      'Sign of value vs x + y',
      Math.sign(v) === Math.sign(x + y)
        ? `match (${sign(v)})`
        : `differ (${sign(v)} vs ${sign(x + y)})`,
    ],
    [
      'Mirror cell',
      `row ${mr}, col ${mc} (x = ${mc - 64}, y = ${63 - mr}) = ${mv}`,
    ],
    [
      'Mirror rule',
      ok ? `holds (${v} + ${mv} = −1)` : `broken (${v} + ${mv} = ${v + mv})`,
    ],
  ]
  return (
    <dl className="grid grid-cols-1 gap-y-2 text-sm">
      {rows.map(([k, val]) => (
        <div className="flex flex-col" key={k}>
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="font-mono tabular-nums text-foreground">{val}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function MatrixExplorerTab() {
  const [maps, setMaps] = useState<Record<MapId, Matrix> | null>(null)
  const [failed, setFailed] = useState(false)
  const [mapId, setMapId] = useState<MapId>('raw')
  const [showBreaks, setShowBreaks] = useState(false)
  const [showCorrected, setShowCorrected] = useState(false)
  const [hover, setHover] = useState<Cell | null>(null)
  const [selected, setSelected] = useState<Cell | null>(null)
  const [qx, setQx] = useState('')
  const [qy, setQy] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    let alive = true
    Promise.all(
      MAPS.map(m =>
        fetch(m.src).then(r => r.json() as Promise<{ matrix: Matrix }>)
      )
    )
      .then(([raw, clean]) => {
        if (alive && raw && clean)
          setMaps({ raw: raw.matrix, clean: clean.matrix })
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [])

  const m = maps?.[mapId]
  const breaks = useMemo(
    () => (m ? collect((r, c) => breaksRule(m, r, c)) : []),
    [m]
  )
  const corrected = useMemo(
    () =>
      maps
        ? collect((r, c) => at(maps.raw, r, c) !== at(maps.clean, r, c))
        : [],
    [maps]
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: resolvedTheme is read indirectly via CSS tokens and must trigger a repaint
  useEffect(() => {
    // Paint in the next frame: next-themes applies the theme class in its own
    // effect, which runs after this one, so tokens must be read afterwards.
    const frame = requestAnimationFrame(() => {
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx || !m) return
      const neg = tokenRgb('--signal')
      const mid = tokenRgb('--muted')
      const pos = tokenRgb('--gold')
      const fg =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--foreground')
          .trim() || 'white'
      const highlighting = showBreaks || showCorrected

      ctx.clearRect(0, 0, N * SCALE, N * SCALE)
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const v = at(m, r, c)
          ctx.fillStyle =
            v < 0 ? mix(mid, neg, -v / 128) : mix(mid, pos, v / 127)
          ctx.fillRect(c * SCALE, r * SCALE, SCALE, SCALE)
        }
      }
      if (highlighting) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, 0, N * SCALE, N * SCALE)
      }
      const outline = (cells: Cell[], width: number, dash: number[]) => {
        ctx.strokeStyle = fg
        ctx.lineWidth = width
        ctx.setLineDash(dash)
        for (const { r, c } of cells) {
          if (highlighting) {
            const v = at(m, r, c)
            ctx.fillStyle =
              v < 0 ? mix(mid, neg, -v / 128) : mix(mid, pos, v / 127)
            ctx.fillRect(c * SCALE, r * SCALE, SCALE, SCALE)
          }
          ctx.strokeRect(
            c * SCALE + width / 2,
            r * SCALE + width / 2,
            SCALE - width,
            SCALE - width
          )
        }
      }
      if (showCorrected) outline(corrected, 2, [2, 2])
      if (showBreaks) outline(breaks, 2, [])
      const sel = selected
      if (sel) {
        outline([{ r: N - 1 - sel.r, c: N - 1 - sel.c }], 1, [])
        ctx.setLineDash([])
        ctx.lineWidth = 3
        ctx.strokeStyle = fg
        ctx.strokeRect(
          sel.c * SCALE - 2,
          sel.r * SCALE - 2,
          SCALE + 4,
          SCALE + 4
        )
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [m, breaks, corrected, showBreaks, showCorrected, selected, resolvedTheme])

  const cellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): Cell => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clamp = (v: number) => Math.min(N - 1, Math.max(0, Math.floor(v)))
    return {
      c: clamp(((e.clientX - rect.left) / rect.width) * N),
      r: clamp(((e.clientY - rect.top) / rect.height) * N),
    }
  }

  const select = (cell: Cell) => {
    setSelected(cell)
    setQx(String(cell.c - 64))
    setQy(String(63 - cell.r))
  }

  const ask = (xs: string, ys: string) => {
    setQx(xs)
    setQy(ys)
    if (validCoord(xs) && validCoord(ys))
      setSelected({ r: 63 - Number(ys), c: Number(xs) + 64 })
  }

  if (failed) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        The matrix files could not be loaded.
      </p>
    )
  }
  if (!m) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        Loading the matrix…
      </p>
    )
  }

  const shown = hover ?? selected
  const invalidQuery = [qx, qy].some(s => s.trim() !== '' && !validCoord(s))

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <fieldset className="inline-flex border border-border">
            <legend className="sr-only">Which map</legend>
            {MAPS.map(opt => (
              <button
                aria-pressed={mapId === opt.id}
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                  mapId === opt.id
                    ? 'bg-gold/10 text-gold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                key={opt.id}
                onClick={() => setMapId(opt.id)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </fieldset>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              checked={showBreaks}
              className="accent-gold"
              onChange={e => setShowBreaks(e.target.checked)}
              type="checkbox"
            />
            Show mirror-rule breaks
            <span className="font-mono tabular-nums text-foreground">
              ({breaks.length})
            </span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              checked={showCorrected}
              className="accent-gold"
              onChange={e => setShowCorrected(e.target.checked)}
              type="checkbox"
            />
            Show corrected cells
            <span className="font-mono tabular-nums text-foreground">
              ({corrected.length})
            </span>
          </label>
        </div>

        <canvas
          aria-label={`Heatmap of the 128 by 128 Anna Matrix, ${MAPS.find(o => o.id === mapId)?.label.toLowerCase()}. ${breaks.length} cells break the mirror rule. Use the x and y inputs to inspect a cell.`}
          className="aspect-square w-full cursor-crosshair border border-border"
          height={N * SCALE}
          onClick={e => select(cellFromEvent(e))}
          onPointerLeave={() => setHover(null)}
          onPointerMove={e =>
            e.pointerType === 'mouse' && setHover(cellFromEvent(e))
          }
          ref={canvasRef}
          role="img"
          width={N * SCALE}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
            <span>−128</span>
            <span
              aria-hidden
              className="h-2 flex-1 bg-linear-to-r from-(--signal) via-muted to-gold"
            />
            <span>127</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Each cell is the bot&apos;s answer to x + y. Values are signed
            bytes, so large sums wrap around.
          </p>
          {mapId === 'clean' && (
            <p className="text-sm text-muted-foreground">
              In the corrected candidate, the {corrected.length} corrected cells
              were set from their mirror cells.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Row = 63 − y, column = x + 64. Solid outlines mark mirror-rule
            breaks, dashed outlines mark corrected cells.
          </p>
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3 border border-border p-4">
          <legend className="px-1 font-serif text-lg font-semibold">
            Ask the map
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['x', qx, (v: string) => ask(v, qy)],
                ['y', qy, (v: string) => ask(qx, v)],
              ] as const
            ).map(([name, val, set]) => (
              <label
                className="flex flex-col gap-1 text-xs text-muted-foreground"
                key={name}
              >
                {name} (−64 to 63)
                <input
                  aria-describedby={invalidQuery ? 'query-error' : undefined}
                  aria-invalid={val.trim() !== '' && !validCoord(val)}
                  className="border border-border bg-background px-3 py-2 font-mono text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  max={63}
                  min={-64}
                  onChange={e => set(e.target.value)}
                  step={1}
                  type="number"
                  value={val}
                />
              </label>
            ))}
          </div>
          {invalidQuery && (
            <p className="text-xs text-foreground" id="query-error">
              x and y must be whole numbers from −64 to 63
            </p>
          )}
        </fieldset>

        <section
          aria-label="Cell details"
          aria-live="polite"
          className="border border-border p-4"
        >
          {shown ? (
            <CellInfo cell={shown} m={m} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Hover or tap a cell, or enter x and y above.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
