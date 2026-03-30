'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Square,
  Activity,
  Dna,
  Zap,
  MessageCircle,
  Sun,
  Snowflake,
  Mountain,
  RefreshCw,
  Eye,
  BarChart3,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

// ============================================================================
// Types
// ============================================================================

interface SimStats {
  tick: number
  pop: number
  births: number
  deaths: number
  max_gen: number
  avg_e: number
  avg_t: number
  friendly: number
  aggro: number
  idle: number
  rest: number
  shared: number
  coop: number
  beh_h: number
  circ: number
  tps: number
  gdiv?: number
  s_ent?: number
  perm_div?: number
  avg_fit?: number
  sig_h?: number
  sig_d?: number
  te?: number
  kc?: number
  nov?: number
  cvar?: number
}

interface SnapshotAgent {
  x: number
  y: number
  energy: number
  generation: number
  behavior: number
  signal: number
  age_frac: number
}

interface WorldSnapshot {
  tick: number
  n_agents: number
  world_size: number
  terrain: number[]
  agents: SnapshotAgent[]
}

interface SimConfig {
  seed: number
  ticks: number
  signals: boolean
  seasons: boolean
  catastrophes: boolean
}

// ============================================================================
// World Canvas Renderer
// ============================================================================

function WorldCanvas({
  snapshot,
  width = 512,
  height = 512,
  overlay = 'behavior',
}: {
  snapshot: WorldSnapshot | null
  width?: number
  height?: number
  overlay?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !snapshot) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = snapshot.world_size
    const scale = width / W

    // Clear
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, width, height)

    // Draw terrain
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        const t = snapshot.terrain[y * W + x]
        if (t === 0) ctx.fillStyle = '#0c1929' // Sea
        else if (t === 1) ctx.fillStyle = '#0f1f0f' // Land
        else ctx.fillStyle = '#1a1a1a' // Rock
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }

    // Draw agents
    for (const agent of snapshot.agents) {
      const px = agent.x * scale
      const py = agent.y * scale

      if (overlay === 'behavior') {
        // Color by behavior
        const b = agent.behavior
        if (b === 1) ctx.fillStyle = '#22c55e'       // Friendly (green)
        else if (b === -1) ctx.fillStyle = '#ef4444'  // Aggressive (red)
        else if (b === 2) ctx.fillStyle = '#3b82f6'   // Resting (blue)
        else ctx.fillStyle = '#a3a3a3'                 // Idle (gray)
      } else if (overlay === 'energy') {
        // Color by energy (brightness)
        const e = Math.min(255, agent.energy)
        ctx.fillStyle = `rgb(${e}, ${Math.floor(e * 0.8)}, ${Math.floor(e * 0.3)})`
      } else if (overlay === 'signal') {
        // Color by signal pattern
        const s = agent.signal
        const r = (s & 4) ? 255 : 80
        const g = (s & 2) ? 255 : 80
        const b = (s & 1) ? 255 : 80
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      } else if (overlay === 'generation') {
        // Color by generation (hue rotation)
        const hue = (agent.generation * 7) % 360
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`
      }

      const r = Math.max(1.5, scale * 0.4)
      ctx.beginPath()
      ctx.arc(px + scale / 2, py + scale / 2, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [snapshot, width, height, overlay])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg border border-zinc-800"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

// ============================================================================
// Metric Chart
// ============================================================================

function MetricChart({
  data,
  dataKey,
  color,
  label,
  domain,
}: {
  data: SimStats[]
  dataKey: string
  color: string
  label: string
  domain?: [number, number]
}) {
  return (
    <div className="h-24">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="tick" tick={false} />
          <YAxis domain={domain} tick={{ fontSize: 10, fill: '#666' }} width={40} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: 11 }}
            labelFormatter={(v) => `Tick ${v}`}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            dot={false}
            strokeWidth={1.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================================
// Control Panel
// ============================================================================

function ControlPanel({
  config,
  setConfig,
  running,
  onStart,
  onStop,
}: {
  config: SimConfig
  setConfig: (c: SimConfig) => void
  running: boolean
  onStart: () => void
  onStop: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {!running ? (
          <Button onClick={onStart} size="sm" className="gap-1">
            <Play className="h-3 w-3" /> Start
          </Button>
        ) : (
          <Button onClick={onStop} size="sm" variant="destructive" className="gap-1">
            <Square className="h-3 w-3" /> Stop
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="text-zinc-500">
          Seed
          <input
            type="number"
            value={config.seed}
            onChange={(e) => setConfig({ ...config, seed: Number(e.target.value) })}
            disabled={running}
            className="mt-0.5 w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-white"
          />
        </label>
        <label className="text-zinc-500">
          Ticks
          <input
            type="number"
            value={config.ticks}
            onChange={(e) => setConfig({ ...config, ticks: Number(e.target.value) })}
            disabled={running}
            className="mt-0.5 w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-white"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant={config.signals ? 'default' : 'outline'}
          className="cursor-pointer text-xs"
          onClick={() => !running && setConfig({ ...config, signals: !config.signals })}
        >
          <MessageCircle className="h-3 w-3 mr-1" /> Signals
        </Badge>
        <Badge
          variant={config.seasons ? 'default' : 'outline'}
          className="cursor-pointer text-xs"
          onClick={() => !running && setConfig({ ...config, seasons: !config.seasons })}
        >
          <Sun className="h-3 w-3 mr-1" /> Seasons
        </Badge>
        <Badge
          variant={config.catastrophes ? 'default' : 'outline'}
          className="cursor-pointer text-xs"
          onClick={() => !running && setConfig({ ...config, catastrophes: !config.catastrophes })}
        >
          <Mountain className="h-3 w-3 mr-1" /> Catastrophes
        </Badge>
      </div>
    </div>
  )
}

// ============================================================================
// Stats Summary Bar
// ============================================================================

function StatsSummary({ stats }: { stats: SimStats | null }) {
  if (!stats) return <div className="text-xs text-zinc-600">No data</div>

  return (
    <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-xs">
      <div>
        <span className="text-zinc-500">Tick</span>{' '}
        <span className="text-white font-mono">{stats.tick.toLocaleString()}</span>
      </div>
      <div>
        <span className="text-zinc-500">Pop</span>{' '}
        <span className="text-white font-mono">{stats.pop}</span>
      </div>
      <div>
        <span className="text-zinc-500">Gen</span>{' '}
        <span className="text-white font-mono">{stats.max_gen}</span>
      </div>
      <div>
        <span className="text-zinc-500">Speed</span>{' '}
        <span className="text-white font-mono">{stats.tps.toFixed(0)} t/s</span>
      </div>
      <div>
        <span className="text-green-500">F:{stats.friendly}</span>{' '}
        <span className="text-red-500">A:{stats.aggro}</span>{' '}
        <span className="text-blue-500">R:{stats.rest}</span>
      </div>
      <div>
        <span className="text-zinc-500">Coop</span>{' '}
        <span className="text-emerald-400 font-mono">{(stats.coop * 100).toFixed(1)}%</span>
      </div>
      <div>
        <span className="text-zinc-500">Energy</span>{' '}
        <span className="text-amber-400 font-mono">{stats.avg_e.toFixed(0)}</span>
      </div>
      <div>
        <span className="text-zinc-500">Shared</span>{' '}
        <span className="text-cyan-400 font-mono">{stats.shared}</span>
      </div>
    </div>
  )
}

// ============================================================================
// File Browser
// ============================================================================

function FileBrowser({
  onSelect,
}: {
  onSelect: (file: string) => void
}) {
  const [experiments, setExperiments] = useState<{
    root_files: string[]
    experiments: { name: string; seeds: number; files: string[] }[]
  } | null>(null)

  useEffect(() => {
    fetch('/api/genesis?action=experiments')
      .then((r) => r.json())
      .then(setExperiments)
      .catch(() => {})
  }, [])

  if (!experiments) return <div className="text-xs text-zinc-600">Loading...</div>

  return (
    <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
      {experiments.root_files.map((f) => (
        <button
          key={f}
          onClick={() => onSelect(f)}
          className="block w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-zinc-300"
        >
          {f}
        </button>
      ))}
      {experiments.experiments.map((exp) => (
        <div key={exp.name} className="border-t border-zinc-800 pt-1">
          <div className="text-zinc-500 font-medium">{exp.name}/</div>
          {exp.files.map((f) => (
            <button
              key={f}
              onClick={() => onSelect(`${exp.name}/${f}`)}
              className="block w-full text-left px-3 py-0.5 rounded hover:bg-zinc-800 text-zinc-400"
            >
              {f}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function GenesisLabPage() {
  const [config, setConfig] = useState<SimConfig>({
    seed: 42,
    ticks: 100000,
    signals: true,
    seasons: true,
    catastrophes: false,
  })
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState<SimStats[]>([])
  const [snapshot, setSnapshot] = useState<WorldSnapshot | null>(null)
  const [overlay, setOverlay] = useState('behavior')
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [tab, setTab] = useState<'live' | 'browse'>('live')
  const eventSourceRef = useRef<EventSource | null>(null)

  const latestStats: SimStats | null = stats.length > 0 ? stats[stats.length - 1]! : null

  // Load snapshot periodically when running
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      fetch('/api/genesis?action=snapshot&file=live_snapshot.bin')
        .then((r) => r.json())
        .then((data) => {
          if (data.tick !== undefined) setSnapshot(data)
        })
        .catch(() => {})
    }, 2000)
    return () => clearInterval(interval)
  }, [running])

  // SSE connection for live stats
  const connectSSE = useCallback((file: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    const es = new EventSource(`/api/genesis/stream?file=${encodeURIComponent(file)}`)
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SimStats
        setStats((prev) => {
          const next = [...prev, data]
          return next.length > 500 ? next.slice(-500) : next
        })
      } catch { /* ignore */ }
    }
    es.onerror = () => {
      // Will auto-reconnect
    }
    eventSourceRef.current = es
  }, [])

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const handleStart = async () => {
    setStats([])
    setSnapshot(null)

    const res = await fetch('/api/genesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        ...config,
        snapshot_interval: 500,
        stats_interval: 500,
      }),
    })

    const data = await res.json()
    if (data.started) {
      setRunning(true)
      setActiveFile('live_run.jsonl')
      // Give it a moment to start writing
      setTimeout(() => connectSSE('live_run.jsonl'), 1000)
    }
  }

  const handleStop = async () => {
    await fetch('/api/genesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    })
    setRunning(false)
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const handleBrowseFile = (file: string) => {
    setActiveFile(file)
    setStats([])
    // Load all stats from file
    fetch(`/api/genesis?action=stats&file=${encodeURIComponent(file)}&tail=500`)
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats)
      })
      .catch(() => {})
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Dna className="h-6 w-6 text-emerald-400" />
        <h1 className="text-xl font-bold tracking-tight">Genesis Lab</h1>
        <Badge variant="outline" className="text-xs text-zinc-500">
          Anna Matrix ALife
        </Badge>
        {running && (
          <Badge className="bg-emerald-900 text-emerald-300 text-xs animate-pulse">
            <Activity className="h-3 w-3 mr-1" /> Running
          </Badge>
        )}
        {activeFile && (
          <span className="text-xs text-zinc-600 ml-auto font-mono">{activeFile}</span>
        )}
      </div>

      {/* Stats Summary */}
      <div className="mb-4 p-3 rounded-lg border border-zinc-800 bg-zinc-950">
        <StatsSummary stats={latestStats} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        {/* Left: World View + Controls */}
        <div className="space-y-3">
          {/* Overlay controls */}
          <div className="flex items-center gap-1.5">
            <Eye className="h-3 w-3 text-zinc-500" />
            {['behavior', 'energy', 'signal', 'generation'].map((o) => (
              <button
                key={o}
                onClick={() => setOverlay(o)}
                className={`px-2 py-0.5 rounded text-xs ${
                  overlay === o
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {o}
              </button>
            ))}
          </div>

          {/* Canvas */}
          <WorldCanvas snapshot={snapshot} overlay={overlay} />

          {/* Control Panel */}
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-medium">Controls</span>
            </div>
            <ControlPanel
              config={config}
              setConfig={setConfig}
              running={running}
              onStart={handleStart}
              onStop={handleStop}
            />
          </div>
        </div>

        {/* Right: Metrics + History */}
        <div className="space-y-3">
          {/* Tab Selector */}
          <div className="flex gap-1">
            <button
              onClick={() => setTab('live')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs ${
                tab === 'live' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <BarChart3 className="h-3 w-3" /> Live Metrics
            </button>
            <button
              onClick={() => setTab('browse')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs ${
                tab === 'browse' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Layers className="h-3 w-3" /> Browse Experiments
            </button>
          </div>

          {tab === 'live' ? (
            <div className="space-y-2">
              <MetricChart data={stats} dataKey="pop" color="#22c55e" label="Population" />
              <MetricChart
                data={stats}
                dataKey="coop"
                color="#3b82f6"
                label="Cooperation Ratio"
                domain={[0, 1]}
              />
              <MetricChart data={stats} dataKey="beh_h" color="#eab308" label="Behavior Entropy" />
              <MetricChart data={stats} dataKey="avg_e" color="#f97316" label="Avg Energy" />

              {/* Deep stats charts (when available) */}
              {stats.some((s) => s.gdiv !== undefined) && (
                <>
                  <MetricChart
                    data={stats.filter((s) => s.gdiv !== undefined)}
                    dataKey="gdiv"
                    color="#a855f7"
                    label="Genome Diversity"
                    domain={[0, 1]}
                  />
                  <MetricChart
                    data={stats.filter((s) => s.sig_h !== undefined)}
                    dataKey="sig_h"
                    color="#06b6d4"
                    label="Signal Entropy"
                  />
                </>
              )}

              {/* Emergence metrics */}
              {stats.some((s) => s.kc !== undefined) && (
                <>
                  <MetricChart
                    data={stats.filter((s) => s.kc !== undefined)}
                    dataKey="kc"
                    color="#f43f5e"
                    label="Kolmogorov Complexity (compression ratio)"
                    domain={[0, 0.5]}
                  />
                  <MetricChart
                    data={stats.filter((s) => s.nov !== undefined)}
                    dataKey="nov"
                    color="#10b981"
                    label="Novelty Index"
                    domain={[0, 1]}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950">
              <div className="mb-2 text-sm font-medium">Experiment Files</div>
              <FileBrowser onSelect={handleBrowseFile} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
