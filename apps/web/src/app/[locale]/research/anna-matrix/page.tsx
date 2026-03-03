'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Grid3X3,
  ExternalLink,
  Github,
  BookOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  Keyboard,
  X,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResearchLayout } from '@/components/research/ResearchLayout'
import { MatrixExplorer } from '@/components/research/MatrixExplorer'
import { ResearchWorkspace } from '@/components/research/ResearchWorkspace'
import { createMatrixAPI, type MatrixStats } from '@/lib/research/matrix-api'

// =============================================================================
// DATA LOADING HOOK
// =============================================================================

function useMatrixData() {
  const [matrix, setMatrix] = useState<number[][] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadMatrix() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/data/anna-matrix.json', { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Failed to load matrix: ${response.status}`)
        }

        const data = await response.json()

        // Handle both { matrix: [...] } and direct array formats
        const matrixData = data.matrix || data

        // Validate the data
        if (!Array.isArray(matrixData) || matrixData.length !== 128) {
          throw new Error('Invalid matrix format: expected 128 rows')
        }

        for (const row of matrixData) {
          if (!Array.isArray(row) || row.length !== 128) {
            throw new Error('Invalid matrix format: expected 128 columns per row')
          }
        }

        setMatrix(matrixData)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadMatrix()
    return () => controller.abort()
  }, [])

  const retry = () => {
    setMatrix(null)
    setLoading(true)
    setError(null)
    // Trigger re-fetch
    const loadMatrix = async () => {
      try {
        const response = await fetch('/data/anna-matrix.json')
        if (!response.ok) throw new Error(`Failed to load: ${response.status}`)
        const data = await response.json()
        // Handle both { matrix: [...] } and direct array formats
        const matrixData = data.matrix || data
        setMatrix(matrixData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadMatrix()
  }

  return { matrix, loading, error, retry }
}

// =============================================================================
// LOADING SCREEN
// =============================================================================

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 opacity-50">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#D4AF37]/20 animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Loading Anna Matrix</h2>
          <p className="text-sm text-white/50">128 x 128 = 16,384 cells</p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// ERROR SCREEN
// =============================================================================

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-16 h-16 bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load Matrix</h2>
          <p className="text-sm text-white/50">{error}</p>
        </div>
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// KEYBOARD SHORTCUTS MODAL
// =============================================================================

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: 'W / ↑', action: 'Move selection up' },
    { key: 'S / ↓', action: 'Move selection down' },
    { key: 'A / ←', action: 'Move selection left' },
    { key: 'D / →', action: 'Move selection right' },
    { key: 'Escape', action: 'Clear selection' },
    { key: '?', action: 'Toggle this help' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#050505] border border-white/[0.06] p-6 max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white/10 text-xs font-mono min-w-[80px] text-center text-white">
                {key}
              </kbd>
              <span className="text-sm text-white/60">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function AnnaMatrixResearchPage() {
  const { matrix, loading, error, retry } = useMatrixData()
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  // Create Matrix API instance
  const matrixAPI = useMemo(() => {
    if (!matrix) return null
    return createMatrixAPI(matrix)
  }, [matrix])

  // Calculate stats
  const stats = useMemo(() => {
    if (!matrixAPI) return null
    return matrixAPI.getStats()
  }, [matrixAPI])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === '?') {
        setShowKeyboardHelp(prev => !prev)
      } else if (e.key === 'Escape') {
        setSelectedCell(null)
        setShowKeyboardHelp(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle loading state
  if (loading) {
    return <LoadingScreen />
  }

  // Handle error state
  if (error || !matrix || !matrixAPI || !stats) {
    return <ErrorScreen error={error || 'Failed to initialize matrix'} onRetry={retry} />
  }

  return (
    <div className="flex h-screen flex-col bg-black">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#050505] px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D4AF37]/20 flex items-center justify-center">
            <Grid3X3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Anna Matrix Research Lab</h1>
            <p className="text-[10px] text-white/40">
              128 x 128 Cryptographic Matrix Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats badges */}
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="secondary" className="bg-[#D4AF37]/15 text-[#D4AF37]/60 text-[10px] font-mono">
              {stats.negativeCount} negative
            </Badge>
            <Badge variant="secondary" className="bg-white/5 text-white/40 text-[10px] font-mono">
              {stats.zeroCount} zeros
            </Badge>
            <Badge variant="secondary" className="bg-[#D4AF37]/15 text-[#D4AF37]/60 text-[10px] font-mono">
              {stats.positiveCount} positive
            </Badge>
          </div>

          {/* Action buttons */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
            onClick={() => setShowKeyboardHelp(true)}
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>

          <a
            href="https://x.com/anna_aigarth"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37]/60 text-sm transition-colors border border-[#D4AF37]/25"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Ask Anna AI</span>
          </a>

          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors border border-white/[0.04]"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Docs</span>
          </a>

          <a
            href="/api/research/anna-matrix"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors border border-white/[0.04]"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">API</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0">
        <ResearchLayout
          leftTitle="Matrix Explorer"
          rightTitle="Research Workspace"
          defaultLeftWidth={45}
          leftPanel={
            <MatrixExplorer
              matrix={matrix}
              selectedCell={selectedCell}
              onCellSelect={(row, col) => setSelectedCell({ row, col })}
            />
          }
          rightPanel={
            <ResearchWorkspace
              matrix={matrixAPI}
              stats={stats}
              selectedCell={selectedCell}
              onCellSelect={(row, col) => setSelectedCell({ row, col })}
            />
          }
        />
      </main>

      {/* Status Bar */}
      <footer className="flex items-center justify-between border-t border-white/[0.06] bg-[#050505] px-4 py-1.5 text-[10px] text-white/40 font-mono">
        <div className="flex items-center gap-4">
          <span>Anna Matrix v2.0</span>
          <span>|</span>
          <span>16,384 cells</span>
          <span>|</span>
          <span>Range: [{stats.min}, {stats.max}]</span>
          <span>|</span>
          <span>Mean: {stats.mean.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-4">
          {selectedCell && (
            <span className="text-white/60">
              Selected: [{selectedCell.row}, {selectedCell.col}] = {matrix[selectedCell.row]?.[selectedCell.col]}
            </span>
          )}
          <span>Press ? for keyboard shortcuts</span>
        </div>
      </footer>

      {/* Modals */}
      {showKeyboardHelp && (
        <KeyboardShortcutsModal onClose={() => setShowKeyboardHelp(false)} />
      )}
    </div>
  )
}
