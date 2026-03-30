'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Zap, Info, ExternalLink, Sparkles, X, Loader2, BookOpen, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ParticleEngine } from './engine/ParticleEngine'
import { computeAllStats, detectPhaseTransitions } from './engine/metrics'
import { useAnnaMatrix, generateRandomMatrix } from './hooks/useAnnaMatrix'
import { SimulationCanvas, drawFrame } from './components/SimulationCanvas'
import { ControlBar } from './components/ControlBar'
import { ParameterPanel } from './components/ParameterPanel'
import { MetricsPanel } from './components/MetricsPanel'
import { MatrixExplorer } from './components/MatrixExplorer'
import { ComparisonStats } from './components/ComparisonStats'
import { OnboardingOverlay } from './components/OnboardingOverlay'
import { MatrixEditor } from './components/MatrixEditor'
import { MethodologyPanel } from './components/MethodologyPanel'
import { ResearchResultsBanner } from './components/ResearchResultsBanner'
import { LiveStatsOverlay } from './components/LiveStatsOverlay'
import { InteractionForceMap } from './components/InteractionForceMap'
import { RhythmDetector } from './components/RhythmDetector'
import { WhatAmISeeing } from './components/WhatAmISeeing'
import { exportMetricsCSV, downloadFile } from './engine/export'
import { DEFAULT_CONFIG, SPEED_OPTIONS, RESEARCH_PRESETS, KEYBOARD_SHORTCUTS } from './config'
import type { SimulationConfig, MatrixMode, SamplingStrategy, SimulationStats, ComparisonMode, VocabularyMode } from './types'

export default function ParticleLifeSimulation() {
  // --- Refs ---
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)
  const fpsRef = useRef({ lastTime: 0, frames: 0, fps: 0 })
  const tickRef = useRef(0)
  const engineRef = useRef<ParticleEngine | null>(null)
  const engine2Ref = useRef<ParticleEngine | null>(null)
  const rulesRef = useRef<number[][] | null>(null)
  const rules2Ref = useRef<number[][] | null>(null)

  // --- State ---
  const [isPlaying, setIsPlaying] = useState(false)
  const [mode, setMode] = useState<MatrixMode>('anna')
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('single')
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG)
  const [samplingStrategy, setSamplingStrategy] = useState<SamplingStrategy>('block-average')
  const [randomSeed, setRandomSeed] = useState(42)
  const [rules, setRules] = useState<number[][] | null>(null)
  const [rules2, setRules2] = useState<number[][] | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fps, setFps] = useState(0)
  const [tick, setTick] = useState(0)
  const [currentStats, setCurrentStats] = useState<SimulationStats>({
    tick: 0, energy: 0, segregation: 0, spatialEntropy: 0, moransI: 0, msd: 0, clusterCount: 0, largestCluster: 0, velocityDist: [],
  })
  const [currentStats2, setCurrentStats2] = useState<SimulationStats>(currentStats)
  const [metricHistory, setMetricHistory] = useState<SimulationStats[]>([])
  const [metricHistory2, setMetricHistory2] = useState<SimulationStats[]>([])
  const [autoStarted, setAutoStarted] = useState(false)
  const [activePreset, setActivePreset] = useState<string>('')

  // Panel state
  const [showParams, setShowParams] = useState(false)
  const [showMetrics, setShowMetrics] = useState(true) // (#21 - open by default)
  const [showMatrix, setShowMatrix] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [contextAnnotation, setContextAnnotation] = useState('')

  // Visual toggles (#22)
  const [showDensity, setShowDensity] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [highlightType, setHighlightType] = useState<number | null>(null)
  const [vocabularyMode, setVocabularyMode] = useState<VocabularyMode>('casual')
  const [phaseTransitions, setPhaseTransitions] = useState<{ tick: number; metric: string; magnitude: number }[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [showMethodology, setShowMethodology] = useState(false)
  const [showResearchResults, setShowResearchResults] = useState(true)
  const [showForceMap, setShowForceMap] = useState(false)
  const [showRhythm, setShowRhythm] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showLiveOverlay, setShowLiveOverlay] = useState(true)

  // Keep rules refs in sync for the animation loop
  useEffect(() => { rulesRef.current = rules }, [rules])
  useEffect(() => { rules2Ref.current = rules2 }, [rules2])

  // Load Anna Matrix
  const { matrix, isLoading, extractInteractionMatrix } = useAnnaMatrix()

  // --- URL State Persistence ---
  const [urlInitialized, setUrlInitialized] = useState(false)

  // Parse hash on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const hash = window.location.hash.slice(1)
      if (!hash) { setUrlInitialized(true); return }
      const params = new URLSearchParams(hash)

      // Check for preset first
      const presetId = params.get('preset')
      if (presetId) {
        const preset = RESEARCH_PRESETS.find((p) => p.id === presetId)
        if (preset) {
          setMode(preset.matrixMode)
          if (preset.randomSeed) setRandomSeed(preset.randomSeed)
          setConfig((c) => ({ ...c, ...preset.config }))
        }
        setUrlInitialized(true)
        return
      }

      // Parse individual params
      const m = params.get('mode')
      if (m === 'anna' || m === 'random') setMode(m)
      const types = parseInt(params.get('types') ?? '')
      if (types >= 2 && types <= 12) setConfig((c) => ({ ...c, numTypes: types }))
      const ppt = parseInt(params.get('ppt') ?? '')
      if (ppt >= 20 && ppt <= 200) setConfig((c) => ({ ...c, particlesPerType: ppt }))
      const radius = parseInt(params.get('radius') ?? '')
      if (radius >= 40 && radius <= 250) setConfig((c) => ({ ...c, radius }))
      const visc = parseFloat(params.get('viscosity') ?? '')
      if (visc >= 0.1 && visc <= 1.0) setConfig((c) => ({ ...c, viscosity: visc }))
      const s = params.get('sampling')
      if (s === 'block-average' || s === 'diagonal' || s === 'random' || s === 'energy-level') setSamplingStrategy(s)
      const seed = parseInt(params.get('seed') ?? '')
      if (!isNaN(seed)) setRandomSeed(seed)
      const boundary = params.get('boundary')
      if (boundary === 'bounce' || boundary === 'toroidal') setConfig((c) => ({ ...c, boundaryMode: boundary }))
      const vocab = params.get('vocab')
      if (vocab === 'technical' || vocab === 'casual') setVocabularyMode(vocab)
    } catch { /* ignore parse errors */ }
    setUrlInitialized(true)
  }, [])

  // Update hash on config change (debounced)
  const hashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!urlInitialized || typeof window === 'undefined') return
    if (hashTimeoutRef.current) clearTimeout(hashTimeoutRef.current)
    hashTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('mode', mode)
      params.set('types', String(config.numTypes))
      params.set('ppt', String(config.particlesPerType))
      params.set('radius', String(config.radius))
      params.set('viscosity', String(config.viscosity))
      params.set('sampling', samplingStrategy)
      params.set('seed', String(randomSeed))
      params.set('boundary', config.boundaryMode)
      if (vocabularyMode !== 'casual') params.set('vocab', vocabularyMode)
      window.history.replaceState(null, '', `#${params.toString()}`)
    }, 300)
    return () => { if (hashTimeoutRef.current) clearTimeout(hashTimeoutRef.current) }
  }, [mode, config.numTypes, config.particlesPerType, config.radius, config.viscosity, config.boundaryMode, samplingStrategy, randomSeed, vocabularyMode, urlInitialized])

  const handleCopyLink = useCallback(() => {
    if (typeof window === 'undefined') return
    navigator.clipboard.writeText(window.location.href).catch(() => {})
  }, [])

  const handleCustomRulesChange = useCallback((newRules: number[][]) => {
    setRules(newRules)
    setMode('custom')
    if (engineRef.current) {
      engineRef.current.setRules(newRules)
    }
  }, [])

  // Quick Demo: show Anna for 3s, then auto-switch to side-by-side
  const handleQuickDemo = useCallback(() => {
    setMode('anna')
    setComparisonMode('single')
    setIsPlaying(true)
    setTimeout(() => {
      setComparisonMode('side-by-side')
    }, 3000)
  }, [])

  // --- Init simulation ---
  const initSimulation = useCallback(
    (overrideMode?: MatrixMode, overrideConfig?: Partial<SimulationConfig>) => {
      const c = { ...config, ...overrideConfig }
      const m = overrideMode ?? mode

      let primaryRules: number[][]
      if (m === 'anna' && matrix) {
        primaryRules = extractInteractionMatrix(c.numTypes, samplingStrategy)
      } else {
        primaryRules = generateRandomMatrix(c.numTypes, randomSeed)
      }
      setRules(primaryRules)

      const engine = new ParticleEngine(c)
      const canvasEl = containerRef.current?.querySelector('canvas') as HTMLCanvasElement | null
      const w = canvasEl?.width ?? 800
      const h = canvasEl?.height ?? 400
      engine.init(w, h, primaryRules, 42)
      engineRef.current = engine

      // Comparison engine
      if (comparisonMode === 'side-by-side') {
        const compRules = m === 'anna'
          ? generateRandomMatrix(c.numTypes, randomSeed)
          : (matrix ? extractInteractionMatrix(c.numTypes, samplingStrategy) : generateRandomMatrix(c.numTypes, randomSeed + 1))
        setRules2(compRules)
        const engine2 = new ParticleEngine(c)
        const canvasEl2 = containerRef.current?.querySelectorAll('canvas')[1] as HTMLCanvasElement | null
        engine2.init(canvasEl2?.width ?? w, canvasEl2?.height ?? h, compRules, 42)
        engine2Ref.current = engine2
      }

      tickRef.current = 0
      setTick(0)
      setMetricHistory([])
      setMetricHistory2([])
      setPhaseTransitions([])

      // Draw initial frame
      if (canvasEl && engine) drawFrame(canvasEl, engine, c.trailLength, c.particleSize, { showDensity, showGrid, highlightType })
    },
    [matrix, config, mode, samplingStrategy, randomSeed, comparisonMode, extractInteractionMatrix, showDensity, showGrid, highlightType],
  )

  // Init when matrix loads
  useEffect(() => {
    if (matrix || mode === 'random') {
      initSimulation()
    }
  }, [matrix, config.numTypes, config.particlesPerType, comparisonMode])

  // (#23 - Auto-play on first load for immediate visual impact)
  useEffect(() => {
    if (!autoStarted && (matrix || mode === 'random') && engineRef.current) {
      setAutoStarted(true)
      setIsPlaying(true)
    }
  }, [matrix, autoStarted, mode])

  // --- Animation loop ---
  useEffect(() => {
    if (!isPlaying) return

    const loop = () => {
      const engine = engineRef.current
      const canvas = containerRef.current?.querySelector('canvas') as HTMLCanvasElement | null
      if (!engine || !canvas) return

      engine.step(config.speedMultiplier)
      tickRef.current += config.speedMultiplier
      drawFrame(canvas, engine, config.trailLength, config.particleSize, { showDensity, showGrid, highlightType })

      // Comparison engine
      if (comparisonMode === 'side-by-side' && engine2Ref.current) {
        const canvas2 = containerRef.current?.querySelectorAll('canvas')[1] as HTMLCanvasElement | null
        if (canvas2) {
          engine2Ref.current.step(config.speedMultiplier)
          drawFrame(canvas2, engine2Ref.current, config.trailLength, config.particleSize, { showDensity, showGrid, highlightType })
        }
      }

      // Stats every 500ms
      const now = performance.now()
      fpsRef.current.frames++
      if (now - fpsRef.current.lastTime > 500) {
        const currentFps = Math.round((fpsRef.current.frames * 1000) / (now - fpsRef.current.lastTime))
        fpsRef.current.frames = 0
        fpsRef.current.lastTime = now
        setFps(currentFps)
        setTick(tickRef.current)

        const stats = computeAllStats(engine.particles, engine.width, engine.height, config.numTypes, tickRef.current, config.radius, rulesRef.current)
        setCurrentStats(stats)
        setMetricHistory((prev) => {
          const next = [...prev, stats]
          return next.length > 500 ? next.slice(-500) : next
        })

        if (engine2Ref.current) {
          const stats2 = computeAllStats(engine2Ref.current.particles, engine2Ref.current.width, engine2Ref.current.height, config.numTypes, tickRef.current, config.radius, rules2Ref.current)
          setCurrentStats2(stats2)
          setMetricHistory2((prev) => {
            const next = [...prev, stats2]
            return next.length > 500 ? next.slice(-500) : next
          })
        }

        // Detect phase transitions
        const newHistory = [...metricHistory, stats].slice(-500)
        const transitions = detectPhaseTransitions(newHistory)
        if (transitions.length > 0) {
          setPhaseTransitions((prev) => [...prev, ...transitions].slice(-20))
        }

        updateAnnotation(stats)
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    fpsRef.current.lastTime = performance.now()
    fpsRef.current.frames = 0
    animFrameRef.current = requestAnimationFrame(loop)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [isPlaying, config.speedMultiplier, config.trailLength, config.particleSize, config.numTypes, comparisonMode, showDensity, showGrid, highlightType])

  // (#24 - Dual-mode contextual annotations: technical + casual)
  function updateAnnotation(stats: SimulationStats) {
    const isCasual = vocabularyMode === 'casual'

    if (stats.energy < 0.1) {
      setContextAnnotation(isCasual
        ? 'Everything has stopped moving — the particles found their resting places. Press R to shake things up again.'
        : 'Frozen equilibrium — all particles settled, zero net force. Press R to restart.')
    } else if (stats.energy < 0.5 && stats.segregation < 0.3) {
      setContextAnnotation(isCasual
        ? 'Beautiful! Same-colored particles grouped into crystal-like formations. This is self-organization in action.'
        : 'Crystallized clusters — low energy, high type-segregation. Self-organized stable structures.')
    } else if (stats.energy < 0.5) {
      setContextAnnotation(isCasual
        ? 'Particles have settled into calm, stable patterns with barely any movement.'
        : 'Low energy equilibrium — particles in stable configurations with minimal movement.')
    } else if (stats.moransI > 0.5) {
      setContextAnnotation(isCasual
        ? 'Same-colored particles are sticking together in tight groups — like flocking behavior!'
        : 'Strong spatial autocorrelation (Moran\'s I > 0.5) — same-type particles cluster tightly together.')
    } else if (stats.segregation < 0.2) {
      setContextAnnotation(isCasual
        ? 'The particles have sorted themselves into distinct tribes — each color has its own territory.'
        : 'Extreme clustering — segregation index < 0.2, particles forming tight type-specific colonies.')
    } else if (stats.segregation < 0.4) {
      setContextAnnotation(isCasual
        ? 'Colors are starting to group together — early signs of self-organization emerging.'
        : 'Moderate clustering — types self-organizing into distinct spatial groups.')
    } else if (stats.energy > 15) {
      setContextAnnotation(isCasual
        ? 'Chaos! Everything is flying around wildly. Watch for patterns to emerge as things calm down.'
        : 'High energy chaos — particles in rapid, turbulent motion. Emergent structures may form as energy dissipates.')
    } else if (stats.energy > 5 && stats.moransI < 0) {
      setContextAnnotation(isCasual
        ? 'Particles are pushing each other away — spreading out evenly across the space.'
        : 'Dispersed high energy — particles repelling strongly, uniform spatial distribution.')
    } else if (stats.msd > 50000) {
      setContextAnnotation(isCasual
        ? 'Particles have wandered far from where they started — high exploration of the space.'
        : 'High diffusion — particles traveling far from starting positions, exploring the full space.')
    } else if (stats.spatialEntropy > 5.5) {
      setContextAnnotation(isCasual
        ? 'Particles are spread evenly everywhere — no clear grouping pattern yet.'
        : 'Uniform distribution — high spatial entropy, particles spread evenly across the canvas.')
    } else if (stats.spatialEntropy < 3) {
      setContextAnnotation(isCasual
        ? 'Most particles have gathered in just a few spots — strong clustering happening.'
        : 'Concentrated — low spatial entropy, particles grouped in a few dense regions.')
    } else if ((stats.clusterCount ?? 0) > 0 && (stats.clusterCount ?? 999) <= config.numTypes * 2) {
      setContextAnnotation(isCasual
        ? `${stats.clusterCount} distinct groups formed — the matrix rules are creating organized structures.`
        : `${stats.clusterCount} clusters detected — self-organization producing distinct structural groups.`)
    } else {
      setContextAnnotation(isCasual
        ? 'Active and evolving — watch how the matrix rules create emergent patterns from simple interactions.'
        : 'Active dynamics — emergent interaction patterns forming through attraction and repulsion forces.')
    }
  }

  // --- Fullscreen ---
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) containerRef.current.requestFullscreen()
    else document.exitFullscreen()
  }, [])

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  // (#25 - Screenshot)
  const handleScreenshot = useCallback(() => {
    const canvas = containerRef.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `emergence-lab-${mode}-t${tick}.png`
    a.click()
  }, [mode, tick])

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault(); setIsPlaying((p) => !p); break
        case 's':
          if (!isPlaying && engineRef.current) {
            engineRef.current.step(1); tickRef.current++
            const canvas = containerRef.current?.querySelector('canvas') as HTMLCanvasElement
            if (canvas) drawFrame(canvas, engineRef.current, config.trailLength, config.particleSize, { showDensity, showGrid, highlightType })
            setTick(tickRef.current)
          }
          break
        case 'r': setIsPlaying(false); requestAnimationFrame(() => initSimulation()); break
        case 'f': toggleFullscreen(); break
        case 'm': setShowMatrix((v) => !v); break
        case 'c': setComparisonMode((m) => m === 'single' ? 'side-by-side' : 'single'); break
        case 'b': {
          const newBM = config.boundaryMode === 'bounce' ? 'toroidal' as const : 'bounce' as const
          setConfig((c) => ({ ...c, boundaryMode: newBM }))
          engineRef.current?.setConfig({ boundaryMode: newBM })
          break
        }
        case 'd': setShowDensity((v) => !v); break // (#26)
        case 'g': setShowGrid((v) => !v); break // (#27)
        case 'i': setShowInfo((v) => !v); break
        case '?': setShowShortcuts((v) => !v); break
        case 'escape': setShowInfo(false); setShowShortcuts(false); break
        case 'p': handleScreenshot(); break // (#28 - screenshot shortcut)
        case '1': case '2': case '3': case '4': case '5': case '6': {
          const idx = parseInt(e.key) - 1
          const speed = SPEED_OPTIONS[idx]
          if (speed !== undefined) setConfig((c) => ({ ...c, speedMultiplier: speed }))
          break
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, config.trailLength, config.particleSize, config.boundaryMode, toggleFullscreen, initSimulation, showDensity, showGrid, highlightType, handleScreenshot])

  // --- Handlers ---
  const handleModeSwitch = (newMode: MatrixMode) => {
    setMode(newMode)
    setIsPlaying(false)
    setActivePreset('')
    requestAnimationFrame(() => { initSimulation(newMode); setIsPlaying(true) })
  }

  const handleConfigChange = (update: Partial<SimulationConfig>) => {
    const needsReinit = 'numTypes' in update || 'particlesPerType' in update
    setConfig((c) => ({ ...c, ...update }))
    if (!needsReinit && engineRef.current) engineRef.current.setConfig(update)
  }

  const handleSamplingChange = (strategy: SamplingStrategy) => {
    setSamplingStrategy(strategy)
    setIsPlaying(false)
    requestAnimationFrame(() => { initSimulation(); setIsPlaying(true) })
  }

  const handlePreset = (presetId: string) => {
    const preset = RESEARCH_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setActivePreset(presetId)
    setIsPlaying(false)
    setMode(preset.matrixMode)
    if (preset.randomSeed !== undefined) setRandomSeed(preset.randomSeed)
    if (preset.samplingOverride) setSamplingStrategy(preset.samplingOverride)

    // Build the full config that initSimulation will use
    const fullConfig = { ...config, ...preset.config }
    setConfig(fullConfig)

    // Use requestAnimationFrame to ensure state is flushed before reinit
    requestAnimationFrame(() => {
      initSimulation(preset.matrixMode, preset.config)
      setIsPlaying(true)
    })
  }

  const handleExportMetrics = () => {
    const metadata = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      mode,
      samplingStrategy,
      config,
      seed: randomSeed,
      totalTicks: tick,
      totalParticles: config.numTypes * config.particlesPerType,
    }
    // JSON export
    const data = JSON.stringify({ ...metadata, rules, metrics: metricHistory }, null, 2)
    downloadFile(data, `emergence-lab-${mode}-${tick}.json`, 'application/json')
  }

  const handleExportCSV = () => {
    const metadata = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      mode,
      samplingStrategy,
      config,
      seed: randomSeed,
      totalTicks: tick,
      totalParticles: config.numTypes * config.particlesPerType,
    }
    const csv = exportMetricsCSV(metricHistory, metadata)
    downloadFile(csv, `emergence-lab-${mode}-${tick}.csv`, 'text/csv')
  }

  const handleDownloadMatrix = () => {
    if (!matrix) return
    const data = JSON.stringify(matrix)
    downloadFile(data, 'anna-matrix-128x128.json', 'application/json')
  }

  const totalParticles = config.numTypes * config.particlesPerType

  // (#29 - Loading state)
  if (isLoading && mode === 'anna') {
    return (
      <div className="w-full h-[400px] flex items-center justify-center border border-white/[0.04] bg-[#050505]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#D4AF37]/40 animate-spin" />
          <span className="text-sm text-white/45 font-mono">Loading Anna Matrix (128x128)...</span>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('w-full space-y-2', isFullscreen && 'bg-[#050505] p-4 overflow-auto')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold tracking-wider flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#D4AF37]" />
            Emergence Lab
          </h3>
          <Link
            href="/docs/03-results/25-aigarth-research-lab"
            className="text-xs font-mono text-[#D4AF37]/40 hover:text-[#D4AF37]/70 transition-colors flex items-center gap-1"
          >
            Research <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Preset selector (#30 - with categories, tracks active preset) */}
          <select
            onChange={(e) => handlePreset(e.target.value)}
            value={activePreset}
            className={cn(
              'bg-[#0a0a0a] border text-xs font-mono px-2 py-1 focus:outline-none focus:border-[#D4AF37]/30 max-w-[180px]',
              activePreset ? 'border-[#D4AF37]/20 text-[#D4AF37]/70' : 'border-white/[0.06] text-white/65',
            )}
          >
            <option value="">Presets...</option>
            <optgroup label="From Paper">
              {RESEARCH_PRESETS.filter((p) => p.category === 'research').map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.badge ? ` [${p.badge}]` : ''}</option>
              ))}
            </optgroup>
            <optgroup label="Experiments">
              {RESEARCH_PRESETS.filter((p) => p.category === 'experiments').map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
            <optgroup label="Random Baselines">
              {RESEARCH_PRESETS.filter((p) => p.category === 'seeds').map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          </select>

          {/* Mode toggle */}
          <div className="flex items-center gap-px bg-[#0a0a0a] border border-white/[0.06] p-px">
            <button onClick={() => handleModeSwitch('anna')} className={cn(
              'px-2 sm:px-3 py-1 text-xs sm:text-sm font-mono transition-all',
              mode === 'anna' ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-white/55 hover:text-white/60 border border-transparent',
            )}>Anna Matrix</button>
            <button onClick={() => handleModeSwitch('random')} className={cn(
              'px-2 sm:px-3 py-1 text-xs sm:text-sm font-mono transition-all',
              mode === 'random' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-white/55 hover:text-white/60 border border-transparent',
            )}>Random</button>
            <button onClick={() => { setMode('custom'); setShowEditor(true) }} className={cn(
              'px-2 sm:px-3 py-1 text-xs sm:text-sm font-mono transition-all',
              mode === 'custom' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-white/55 hover:text-white/60 border border-transparent',
            )}>Custom</button>
          </div>

          {/* A/B Comparison */}
          <button
            onClick={() => setComparisonMode((m) => m === 'single' ? 'side-by-side' : 'single')}
            className={cn(
              'px-2 py-1 text-xs font-mono border transition-all',
              comparisonMode === 'side-by-side' ? 'bg-[#D4AF37]/10 text-[#D4AF37]/70 border-[#D4AF37]/20' : 'text-white/45 border-white/[0.06] hover:text-white/65',
            )}
            title="Compare Anna vs Random (C)"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />A/B
          </button>

          {/* Quick Demo */}
          <button
            onClick={handleQuickDemo}
            className="px-2 py-1 text-[11px] font-mono text-[#D4AF37]/40 border border-[#D4AF37]/10 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]/70 transition-all hidden sm:flex items-center gap-1"
            title="Run a quick comparison demo"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Demo
          </button>

          {/* Vocabulary mode toggle */}
          <button
            onClick={() => setVocabularyMode((v) => v === 'casual' ? 'technical' : 'casual')}
            className={cn(
              'px-1.5 py-1 text-[11px] font-mono border transition-all flex items-center gap-1',
              vocabularyMode === 'technical'
                ? 'bg-purple-500/10 text-purple-400/70 border-purple-500/20'
                : 'text-white/45 border-white/[0.06] hover:text-white/65',
            )}
            title={vocabularyMode === 'casual' ? 'Switch to technical language' : 'Switch to plain language'}
          >
            {vocabularyMode === 'technical' ? <GraduationCap className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
            <span className="hidden sm:inline">{vocabularyMode === 'technical' ? 'Technical' : 'Simple'}</span>
          </button>

          {/* Live overlay toggle */}
          <button
            onClick={() => setShowLiveOverlay((v) => !v)}
            className={cn(
              'px-1.5 py-1 text-[11px] font-mono border transition-all flex items-center gap-1',
              showLiveOverlay
                ? 'bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20'
                : 'text-white/45 border-white/[0.06] hover:text-white/65',
            )}
            title="Toggle live cooperation/aggression overlay"
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">HUD</span>
          </button>

          <button onClick={() => setShowInfo(!showInfo)} className="p-1 text-white/40 hover:text-white/60 transition-colors" title="Info (I)">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Research Results Banner */}
      <ResearchResultsBanner isOpen={showResearchResults} onToggle={() => setShowResearchResults(!showResearchResults)} />

      {/* Canvas */}
      <div className={cn(
        'border border-white/[0.06] bg-[#050505] overflow-hidden relative',
        isPlaying && 'shadow-[0_0_30px_rgba(212,175,55,0.04)]',
      )}>
        {/* Onboarding overlay */}
        <OnboardingOverlay onComplete={() => {}} onQuickDemo={handleQuickDemo} />

        {/* Live stats overlay */}
        {showLiveOverlay && comparisonMode !== 'side-by-side' && (
          <LiveStatsOverlay stats={currentStats} tick={tick} fps={fps} mode={mode} />
        )}

        {comparisonMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04]">
            <SimulationCanvas
              engine={engineRef.current} trailLength={config.trailLength} particleSize={config.particleSize}
              label={mode === 'anna' ? 'ANNA MATRIX' : 'RANDOM'} labelColor={mode === 'anna' ? '#D4AF37' : '#3B82F6'}
              showDensity={showDensity} showGrid={showGrid}
              onPulse={(x, y, s) => engineRef.current?.applyPulse(x, y, s)}
              onResize={(w, h) => engineRef.current?.resize(w, h)}
            />
            <SimulationCanvas
              engine={engine2Ref.current} trailLength={config.trailLength} particleSize={config.particleSize}
              label={mode === 'anna' ? 'RANDOM CONTROL' : 'ANNA MATRIX'} labelColor={mode === 'anna' ? '#3B82F6' : '#D4AF37'}
              showDensity={showDensity} showGrid={showGrid}
              onPulse={(x, y, s) => engine2Ref.current?.applyPulse(x, y, s)}
              onResize={(w, h) => engine2Ref.current?.resize(w, h)}
            />
          </div>
        ) : (
          <SimulationCanvas
            engine={engineRef.current} trailLength={config.trailLength} particleSize={config.particleSize}
            label={mode === 'anna' ? 'ANNA MATRIX RULES' : mode === 'custom' ? 'CUSTOM RULES' : 'RANDOM RULES'} labelColor={mode === 'anna' ? '#D4AF37' : mode === 'custom' ? '#10B981' : '#3B82F6'}
            showDensity={showDensity} showGrid={showGrid}
            onPulse={(x, y, s) => engineRef.current?.applyPulse(x, y, s)}
            onResize={(w, h) => engineRef.current?.resize(w, h)}
          />
        )}

        {/* Context annotation */}
        {contextAnnotation && (
          <div className="px-3 py-1.5 border-t border-white/[0.04] bg-black/30 text-xs text-white/45 font-mono">
            {contextAnnotation}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border border-white/[0.06] bg-[#050505]">
        <ControlBar
          isPlaying={isPlaying} speedMultiplier={config.speedMultiplier} boundaryMode={config.boundaryMode}
          fps={fps} tick={tick} totalParticles={totalParticles * (comparisonMode === 'side-by-side' ? 2 : 1)}
          isFullscreen={isFullscreen} showDensity={showDensity} showGrid={showGrid}
          highlightType={highlightType} numTypes={config.numTypes}
          onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
          onReset={() => { setIsPlaying(false); requestAnimationFrame(() => { initSimulation(); setIsPlaying(true) }) }}
          onStep={() => {
            if (engineRef.current) {
              engineRef.current.step(1); tickRef.current++
              const c = containerRef.current?.querySelector('canvas') as HTMLCanvasElement
              if (c) drawFrame(c, engineRef.current, config.trailLength, config.particleSize, { showDensity, showGrid, highlightType })
              setTick(tickRef.current)
            }
          }}
          onSpeedChange={(s) => setConfig((c) => ({ ...c, speedMultiplier: s }))}
          onBoundaryToggle={() => {
            const newBM = config.boundaryMode === 'bounce' ? 'toroidal' as const : 'bounce' as const
            setConfig((c) => ({ ...c, boundaryMode: newBM })); engineRef.current?.setConfig({ boundaryMode: newBM })
          }}
          onFullscreen={toggleFullscreen} onScreenshot={handleScreenshot}
          onToggleDensity={() => setShowDensity(!showDensity)} onToggleGrid={() => setShowGrid(!showGrid)}
          onHighlightType={setHighlightType}
          onCopyLink={handleCopyLink}
        />
      </div>

      {/* Panels */}
      <MetricsPanel history={metricHistory} currentStats={currentStats} isOpen={showMetrics}
        onToggle={() => setShowMetrics(!showMetrics)} onExport={handleExportMetrics}
        phaseTransitions={phaseTransitions} />

      {/* Statistical comparison in side-by-side mode */}
      {comparisonMode === 'side-by-side' && metricHistory.length > 10 && metricHistory2.length > 10 && (
        <ComparisonStats
          history1={metricHistory}
          history2={metricHistory2}
          label1={mode === 'anna' ? 'Anna Matrix' : 'Random'}
          label2={mode === 'anna' ? 'Random Control' : 'Anna Matrix'}
          color1={mode === 'anna' ? '#D4AF37' : '#3B82F6'}
          color2={mode === 'anna' ? '#3B82F6' : '#D4AF37'}
        />
      )}

      <ParameterPanel config={config} mode={mode} samplingStrategy={samplingStrategy} randomSeed={randomSeed}
        rules={rules} isOpen={showParams} onToggle={() => setShowParams(!showParams)}
        onConfigChange={handleConfigChange} onSamplingChange={handleSamplingChange}
        onNewSeed={() => { setRandomSeed((s) => s + 1); setIsPlaying(false); requestAnimationFrame(() => { initSimulation('random'); setIsPlaying(true) }) }} />

      {/* Custom Matrix Editor */}
      <MatrixEditor
        rules={rules}
        numTypes={config.numTypes}
        isOpen={showEditor}
        onToggle={() => setShowEditor(!showEditor)}
        onRulesChange={handleCustomRulesChange}
      />

      <MatrixExplorer matrix={matrix} numTypes={config.numTypes} samplingStrategy={samplingStrategy}
        isOpen={showMatrix} onToggle={() => setShowMatrix(!showMatrix)} />

      {/* Interaction Force Map */}
      <InteractionForceMap
        rules={rules}
        numTypes={config.numTypes}
        isOpen={showForceMap}
        onToggle={() => setShowForceMap(!showForceMap)}
        perTypeStats={currentStats.perTypeCooperation}
      />

      {/* Behavioral Rhythm Analysis */}
      <RhythmDetector
        history={metricHistory}
        isOpen={showRhythm}
        onToggle={() => setShowRhythm(!showRhythm)}
      />

      {/* What Am I Seeing? — Beginner's Guide */}
      <WhatAmISeeing
        mode={mode}
        comparisonMode={comparisonMode}
        isOpen={showGuide}
        onToggle={() => setShowGuide(!showGuide)}
      />

      {/* Methodology & Transparency */}
      <MethodologyPanel
        isOpen={showMethodology}
        onToggle={() => setShowMethodology(!showMethodology)}
        samplingStrategy={samplingStrategy}
        numTypes={config.numTypes}
      />

      {/* Data Export Bar */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono">
        <button
          onClick={handleExportCSV}
          className="px-2 py-1 text-white/35 border border-white/[0.04] hover:bg-white/[0.02] hover:text-white/55 transition-colors"
          title="Export metrics as CSV"
        >
          Export CSV
        </button>
        <button
          onClick={handleExportMetrics}
          className="px-2 py-1 text-white/35 border border-white/[0.04] hover:bg-white/[0.02] hover:text-white/55 transition-colors"
          title="Export full state as JSON"
        >
          Export JSON
        </button>
        {matrix && (
          <button
            onClick={handleDownloadMatrix}
            className="px-2 py-1 text-white/35 border border-white/[0.04] hover:bg-white/[0.02] hover:text-white/55 transition-colors"
            title="Download raw 128x128 Anna Matrix"
          >
            Download Matrix
          </button>
        )}
        {rules && (
          <button
            onClick={() => {
              downloadFile(JSON.stringify(rules, null, 2), `rules-${config.numTypes}x${config.numTypes}-${mode}.json`, 'application/json')
            }}
            className="px-2 py-1 text-white/35 border border-white/[0.04] hover:bg-white/[0.02] hover:text-white/55 transition-colors"
            title="Download current NxN interaction rules"
          >
            Download Rules
          </button>
        )}
      </div>

      {/* Info modal */}
      {showInfo && (
        <div className="border border-white/[0.06] bg-[#050505] p-4 space-y-3 relative">
          <button onClick={() => setShowInfo(false)} className="absolute top-3 right-3 text-white/35 hover:text-white/65">
            <X className="w-4 h-4" />
          </button>
          <h4 className="text-base font-bold text-[#D4AF37] tracking-wider">Emergence Lab</h4>
          <div className="text-sm text-white/65 space-y-2 leading-relaxed">
            <p><strong className="text-white/70">Particle Life</strong> simulates emergent behavior through attraction/repulsion rules between particle types. No patterns are programmed — all structures self-organize from the interaction matrix.</p>
            <p><strong className="text-white/70">Anna Matrix:</strong> The 128x128 Anna Matrix from the Aigarth system is downsampled to create interaction rules. Its unique properties (8 symmetric energy levels, 99.58% point symmetry, rank-2 fixed point with all column sums = 42) produce fundamentally different emergence than random matrices.</p>
            <p><strong className="text-white/70">Proven in Paper:</strong> In controlled ablation studies (6 matrices, 5 seeds each, Bonferroni-corrected), the Anna Matrix produces <span className="text-[#D4AF37]">19% more cooperation</span>, <span className="text-[#D4AF37]">5.6x more aggression</span>, and dynamic boom-bust cycles. All significant metrics show Cliff's delta = 1.0 (zero distribution overlap).</p>
            <p><strong className="text-white/70">Interact:</strong> Click to attract, Shift+Click to repel. Drag to continuously attract. Use the type selector in the control bar to isolate specific particle types. Toggle density heatmap and spatial grid overlays.</p>
            <p><strong className="text-white/70">Scientific Metrics:</strong> Open the metrics panel to see real-time Kinetic Energy, Segregation Index, Spatial Entropy (Shannon), Moran's I (spatial autocorrelation), and Mean Squared Displacement with rolling charts.</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-white/[0.04]">
            {[
              { value: '128x128', label: 'Matrix' }, { value: '99.58%', label: 'Symmetry' },
              { value: '8', label: 'Energy Levels' }, { value: '42', label: 'Column Sums' },
              { value: '2342', label: 'Spectral Radius' }, { value: '68', label: 'Sym. Breaks' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-base font-mono text-[#D4AF37]/70">{value}</div>
                <div className="text-[11px] text-white/40">{label}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-white/35 font-mono pt-2 border-t border-white/[0.04] flex items-center justify-between">
            <span>Based on <a href="https://github.com/hunar4321/particle-life" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37]/40 hover:text-[#D4AF37]/70 underline">hunar4321/particle-life</a> (MIT)</span>
            <Link href="/docs/03-results/25-aigarth-research-lab" className="text-[#D4AF37]/40 hover:text-[#D4AF37]/70 underline flex items-center gap-1">
              Full Paper <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts */}
      {showShortcuts && (
        <div className="border border-white/[0.06] bg-[#050505] p-4 relative">
          <button onClick={() => setShowShortcuts(false)} className="absolute top-3 right-3 text-white/35 hover:text-white/65"><X className="w-4 h-4" /></button>
          <h4 className="text-base font-bold text-white/60 tracking-wider mb-3">Keyboard Shortcuts</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...KEYBOARD_SHORTCUTS, {
              name: 'Visual',
              shortcuts: [
                { key: 'd', label: 'D', description: 'Density heatmap' },
                { key: 'g', label: 'G', description: 'Spatial grid' },
                { key: 'p', label: 'P', description: 'Screenshot' },
              ],
            }].map((category) => (
              <div key={category.name}>
                <div className="text-xs font-mono text-[#D4AF37]/40 uppercase mb-1.5">{category.name}</div>
                <div className="space-y-1">
                  {category.shortcuts.map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <kbd className="min-w-[24px] text-center px-1 py-0.5 bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white/65">{s.label}</kbd>
                      <span className="text-xs text-white/45">{s.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-[11px] text-white/12 font-mono text-center">
        <kbd className="px-1 py-0.5 bg-white/[0.02] border border-white/[0.04]">?</kbd> shortcuts
        {' · '}Click = attract · Shift+Click = repel
        {' · '}
        <Link href="/docs/03-results/25-aigarth-research-lab" className="text-[#D4AF37]/25 hover:text-[#D4AF37]/50 transition-colors">qubic.church/research</Link>
      </div>
    </div>
  )
}
