'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

type Mode = 'discovery' | 'treasure'

interface Pattern {
  type: string
  confidence: number
  coordinates: Array<{ row: number; col: number; value: number }>
  discovery: string
  significance: string
  blockchainProof?: {
    source: string
    verified: boolean
    url?: string
    blockHeight?: number
  }
}

interface DiscoveryResult {
  id: string
  query: string
  timestamp: number
  durationMs: number
  patterns: Pattern[]
  aggregateResonance: number
  queryHash: string
  aiAnalysis: string
  aiModel: string
  aiTokens: number
  verification: {
    status: 'unverified' | 'partial' | 'verified' | 'breakthrough'
    proofCount: number
    proofs: string[]
    reproducible: boolean
  }
  value: {
    category: string
    significance: 'low' | 'medium' | 'high' | 'critical'
    actionable: boolean
    nextSteps: string[]
  }
  proof: {
    matrixChecksum: string
    inputHash: string
    timestamp: number
  }
}

interface DerivedAddress {
  address: string
  method: string
  confidence: number
  isValid: boolean
  matchesCFB: boolean
  matchesPatoshi?: { address: string; block: number; btc: number; note?: string }
  onChain?: { exists: boolean; balance: string; txCount: number }
}

interface TreasureResult {
  query: string
  queryHash: string
  coordinates: Array<{ row: number; col: number; value: number; region: { name: string; zone: string } }>
  statisticalAnalysis: { score: number; reasons: string[] }
  derivedAddresses: DerivedAddress[]
  seeds: Array<{ zone: string; region: string; hex: string; entropy: number; length: number }>
  summary: {
    totalDerived: number
    validAddresses: number
    patoshiMatches: number
    cfbMatches: number
    onChainWithBalance: number
    highestConfidence: number
    significance: 'LOW' | 'MEDIUM' | 'HIGH'
    verdict: string
  }
}

export default function AgentsPage() {
  const [mode, setMode] = useState<Mode>('discovery')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discoveries, setDiscoveries] = useState<DiscoveryResult[]>([])
  const [treasures, setTreasures] = useState<TreasureResult[]>([])
  const [verifyOnChain, setVerifyOnChain] = useState(true)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    resultsRef.current?.scrollTo({ top: resultsRef.current.scrollHeight, behavior: 'smooth' })
  }, [discoveries])

  const handleDiscover = useCallback(async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'discovery') {
        const response = await fetch('/api/agents/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Discovery failed')
        }

        setDiscoveries(prev => [...prev, data.data])
      } else {
        // Treasure mode
        const response = await fetch('/api/agents/treasure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input, verifyOnChain }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Treasure hunt failed')
        }

        setTreasures(prev => [...prev, data.data])
      }

      setInput('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, mode, verifyOnChain])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleDiscover()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleDiscover])

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(212, 175, 55, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212, 175, 55, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#D4AF37]/[0.06] border border-[#D4AF37]/20 text-[#D4AF37]/70 text-[11px] uppercase tracking-[0.4em] font-mono">
            <span className="w-2 h-2 bg-[#D4AF37]/60 animate-pulse" />
            RESONANCE ACTIVE
          </div>
          <h1 className="text-3xl md:text-4xl font-mono tracking-tight">
            <span className="text-[#D4AF37]">Discovery</span> Engine
          </h1>
          <p className="text-zinc-500 text-sm font-mono max-w-xl mx-auto">
            AI + Anna Matrix + Blockchain Verification = Verifiable Discoveries
          </p>
        </header>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setMode('discovery')}
            className={`px-6 py-2 border text-sm font-mono transition-all ${
              mode === 'discovery'
                ? 'border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                : 'border-white/[0.06] text-zinc-500 hover:border-white/[0.12] hover:bg-[#0a0a0a]'
            }`}
          >
            Pattern Discovery
          </button>
          <button
            type="button"
            onClick={() => setMode('treasure')}
            className={`px-6 py-2 border text-sm font-mono transition-all ${
              mode === 'treasure'
                ? 'border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                : 'border-white/[0.06] text-zinc-500 hover:border-white/[0.12] hover:bg-[#0a0a0a]'
            }`}
          >
            Treasure Hunter
          </button>
        </div>

        {/* Treasure Mode Options */}
        {mode === 'treasure' && (
          <div className="flex justify-center">
            <label className="flex items-center gap-2 text-sm font-mono text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={verifyOnChain}
                onChange={e => setVerifyOnChain(e.target.checked)}
                className="w-4 h-4 border-zinc-600 bg-zinc-800 text-[#D4AF37] focus:ring-[#D4AF37]"
              />
              Verify addresses on-chain (Blockstream API)
            </label>
          </div>
        )}

        {/* Input */}
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'discovery'
              ? "Enter query to discover hidden patterns..."
              : "Enter seed phrase to derive Bitcoin addresses..."
            }
            disabled={isLoading}
            className="w-full bg-[#050505] border border-white/[0.06] px-6 py-4
                       font-mono text-lg text-zinc-100 placeholder-zinc-600
                       focus:outline-none focus:ring-1 focus:border-[#D4AF37]/30 focus:ring-[#D4AF37]/20
                       transition-all"
          />
          <button
            type="button"
            onClick={handleDiscover}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2
                       bg-[#D4AF37]/[0.08] border border-[#D4AF37]/20 text-[#D4AF37]
                       text-sm font-mono font-bold
                       disabled:bg-zinc-900 disabled:border-white/[0.04] disabled:text-zinc-600
                       hover:bg-[#D4AF37]/[0.12] hover:border-[#D4AF37]/30
                       transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-zinc-600 border-t-[#D4AF37] animate-spin" />
                {mode === 'discovery' ? 'Discovering...' : 'Hunting...'}
              </span>
            ) : (
              mode === 'discovery' ? 'DISCOVER' : 'HUNT'
            )}
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm font-mono bg-red-500/10 border border-red-500/20 px-4 py-2">
            {error}
          </div>
        )}

        {/* Results */}
        <div
          ref={resultsRef}
          className="h-[500px] overflow-y-auto space-y-6 pr-2"
        >
          {mode === 'discovery' ? (
            discoveries.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="text-6xl opacity-30">&#9670;</div>
                <p className="text-zinc-600 font-mono">
                  Ask anything. The engine will find patterns in the Matrix
                  <br />
                  and verify them against blockchain data.
                </p>
                <div className="flex justify-center gap-4 text-xs font-mono text-zinc-700">
                  <span>Try: &quot;Is CFB Satoshi?&quot;</span>
                  <span>|</span>
                  <span>&quot;Bitcoin Genesis secrets&quot;</span>
                  <span>|</span>
                  <span>&quot;Qubic bridge connection&quot;</span>
                </div>
              </div>
            ) : (
              discoveries.map((discovery, i) => (
                <DiscoveryCard key={`${discovery.id}-${i}`} discovery={discovery} />
              ))
            )
          ) : (
            treasures.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="text-6xl opacity-30">&#9670;</div>
                <p className="text-zinc-600 font-mono">
                  Enter any phrase. The Matrix will derive Bitcoin addresses
                  <br />
                  and verify them on-chain via Blockstream API.
                </p>
                <div className="flex justify-center gap-4 text-xs font-mono text-zinc-700">
                  <span>Try: &quot;Satoshi Genesis Block 1&quot;</span>
                  <span>|</span>
                  <span>&quot;CFB private key&quot;</span>
                  <span>|</span>
                  <span>&quot;21 million&quot;</span>
                </div>
              </div>
            ) : (
              treasures.map((treasure, i) => (
                <TreasureCard key={`${treasure.queryHash}-${i}`} treasure={treasure} />
              ))
            )
          )}
        </div>

        {/* Footer Stats */}
        <div className="border-t border-white/[0.04] pt-4 flex justify-between text-xs font-mono text-zinc-600">
          <div className="flex gap-6">
            <span>Matrix: 128x128 = 16,384 cells</span>
            <span>Checksum: deterministic</span>
          </div>
          <div className="flex gap-6">
            <span>Discoveries: {discoveries.length}</span>
            <span>
              Verified: {discoveries.filter(d => d.verification.status !== 'unverified').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DiscoveryCard({ discovery }: { discovery: DiscoveryResult }) {
  const [expanded, setExpanded] = useState(false)

  const statusColors = {
    unverified: 'text-zinc-500 border-white/[0.06] bg-[#050505]',
    partial: 'text-[#D4AF37]/70 border-[#D4AF37]/30 bg-[#D4AF37]/[0.06]',
    verified: 'text-[#D4AF37] border-[#D4AF37]/40 bg-[#D4AF37]/[0.08]',
    breakthrough: 'text-[#D4AF37] border-[#D4AF37]/50 bg-[#D4AF37]/[0.12] animate-pulse',
  }

  const significanceColors = {
    low: 'text-zinc-500',
    medium: 'text-[#D4AF37]/60',
    high: 'text-[#D4AF37]/80',
    critical: 'text-[#D4AF37]',
  }

  return (
    <div className="bg-[#050505] border border-white/[0.04] overflow-hidden group relative">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 transition-all" />
      {/* Corner dot */}
      <div className="absolute top-2 right-2 w-1 h-1 bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/30 transition-all" />

      {/* Header */}
      <div className="p-4 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-mono border ${
              statusColors[discovery.verification.status]
            }`}
          >
            {discovery.verification.status.toUpperCase()}
          </span>
          <span className="text-zinc-400 font-mono text-sm">
            {discovery.query}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-600">
          <span>{discovery.durationMs}ms</span>
          <span>{discovery.patterns.length} patterns</span>
        </div>
      </div>

      {/* Resonance Meter */}
      <div className="px-4 py-3 bg-black/30">
        <div className="flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-[0.4em] font-mono text-[#D4AF37]/50 w-24">RESONANCE</span>
          <div className="flex-1 h-2 bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-[#D4AF37]/40 transition-all duration-1000"
              style={{ width: `${discovery.aggregateResonance * 100}%` }}
            />
          </div>
          <span className={`text-sm font-mono font-bold ${
            discovery.aggregateResonance > 0.7 ? 'text-[#D4AF37]' : 'text-zinc-400'
          }`}>
            {(discovery.aggregateResonance * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Patterns Grid */}
      <div className="p-4 space-y-3">
        <div className="text-[11px] font-mono text-[#D4AF37]/50 uppercase tracking-[0.4em]">
          Discovered Patterns
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {discovery.patterns.slice(0, expanded ? undefined : 4).map((pattern, i) => (
            <PatternBadge key={i} pattern={pattern} />
          ))}
        </div>
        {discovery.patterns.length > 4 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-mono text-[#D4AF37]/60 hover:text-[#D4AF37]"
          >
            {expanded ? '-- Show less' : `++ Show ${discovery.patterns.length - 4} more`}
          </button>
        )}
      </div>

      {/* AI Analysis */}
      {discovery.aiAnalysis && discovery.aiAnalysis !== 'AI analysis unavailable' && (
        <div className="p-4 border-t border-white/[0.04] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#D4AF37]/50 uppercase tracking-[0.4em]">
              AI Analysis
            </span>
            <span className="text-xs font-mono text-zinc-600">
              {discovery.aiModel} | {discovery.aiTokens} tokens
            </span>
          </div>
          <div className="text-sm font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {discovery.aiAnalysis}
          </div>
        </div>
      )}

      {/* Value Assessment */}
      <div className="p-4 border-t border-white/[0.04] bg-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono text-[#D4AF37]/50 uppercase tracking-[0.4em]">VALUE:</span>
            <span className={`text-sm font-mono font-bold uppercase ${
              significanceColors[discovery.value.significance]
            }`}>
              {discovery.value.significance}
            </span>
            <span className="text-xs font-mono text-zinc-600">
              Category: {discovery.value.category}
            </span>
          </div>
          {discovery.verification.proofCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#D4AF37]/70">
                {discovery.verification.proofCount} blockchain proofs
              </span>
            </div>
          )}
        </div>

        {/* Next Steps */}
        {discovery.value.nextSteps.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {discovery.value.nextSteps.map((step, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-[#050505] border border-white/[0.04] text-xs font-mono text-zinc-400"
              >
                &rarr; {step}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cryptographic Proof */}
      <div className="px-4 py-2 border-t border-white/[0.04] bg-black/40 flex items-center justify-between text-xs font-mono text-zinc-600">
        <span>Hash: {discovery.proof.inputHash.slice(0, 16)}...</span>
        <span>Matrix: {discovery.proof.matrixChecksum}...</span>
        <span className="text-[#D4AF37]/60">Reproducible</span>
      </div>
    </div>
  )
}

function PatternBadge({ pattern }: { pattern: Pattern }) {
  const typeIcons: Record<string, string> = {
    energy_peak: '///',
    fibonacci: '~',
    bitcoin_alignment: 'BTC',
    genesis_correlation: '>>',
    hash_fragment: '#',
    diagonal_alignment: '//',
  }

  return (
    <div className={`p-3 border ${
      pattern.blockchainProof?.verified
        ? 'border-[#D4AF37]/20 bg-[#D4AF37]/[0.04]'
        : 'border-white/[0.04] bg-[#050505]'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#D4AF37]/40">{typeIcons[pattern.type] || '+'}</span>
          <span className="text-xs font-mono text-zinc-400 uppercase">
            {pattern.type.replace('_', ' ')}
          </span>
        </div>
        <span className={`text-xs font-mono ${
          pattern.confidence > 0.8 ? 'text-[#D4AF37]' :
          pattern.confidence > 0.6 ? 'text-[#D4AF37]/60' : 'text-zinc-500'
        }`}>
          {(pattern.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <div className="mt-2 text-xs font-mono text-zinc-300">
        {pattern.discovery}
      </div>
      <div className="mt-1 text-xs font-mono text-zinc-500">
        {pattern.significance}
      </div>
      {pattern.blockchainProof?.verified && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[#D4AF37]/70 text-xs">Verified on-chain</span>
          {pattern.blockchainProof.url && (
            <a
              href={pattern.blockchainProof.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] underline"
            >
              View
            </a>
          )}
        </div>
      )}
      {pattern.coordinates.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {pattern.coordinates.slice(0, 3).map((c, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-[#050505] border border-white/[0.04] text-xs font-mono text-zinc-500">
              [{c.row},{c.col}]={c.value}
            </span>
          ))}
          {pattern.coordinates.length > 3 && (
            <span className="text-xs font-mono text-zinc-600">
              +{pattern.coordinates.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function TreasureCard({ treasure }: { treasure: TreasureResult }) {
  const [expanded, setExpanded] = useState(false)

  const hasPatoshi = treasure.summary.patoshiMatches > 0
  const hasCFB = treasure.summary.cfbMatches > 0
  const hasBalance = treasure.summary.onChainWithBalance > 0

  const significanceColors = {
    LOW: 'text-zinc-500',
    MEDIUM: 'text-[#D4AF37]/60',
    HIGH: 'text-[#D4AF37]',
  }

  return (
    <div className={`bg-[#050505] border overflow-hidden group relative ${
      hasPatoshi ? 'border-[#D4AF37]/40 shadow-[0_0_30px_rgba(212,175,55,0.08)]' :
      hasCFB ? 'border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.05)]' :
      hasBalance ? 'border-[#D4AF37]/20' : 'border-white/[0.04]'
    }`}>
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 transition-all" />

      {/* Header with Verdict */}
      <div className="p-4 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-mono border ${
            hasPatoshi ? 'border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] text-[#D4AF37] animate-pulse' :
            hasCFB ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] text-[#D4AF37]/80' :
            hasBalance ? 'border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] text-[#D4AF37]/70' :
            'border-white/[0.06] bg-[#050505] text-zinc-400'
          }`}>
            {treasure.summary.verdict}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-600">
          <span className={significanceColors[treasure.summary.significance]}>
            {treasure.summary.significance}
          </span>
          <span>{treasure.derivedAddresses.length} addresses</span>
        </div>
      </div>

      {/* Query */}
      <div className="px-4 py-2 bg-black/20">
        <span className="text-zinc-400 font-mono text-sm">{treasure.query}</span>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-black/30 grid grid-cols-5 gap-4 text-center">
        <div>
          <div className="text-2xl font-mono font-bold text-[#D4AF37]">
            {treasure.summary.totalDerived}
          </div>
          <div className="text-xs font-mono text-zinc-500">Derived</div>
        </div>
        <div>
          <div className={`text-2xl font-mono font-bold ${
            treasure.summary.validAddresses > 0 ? 'text-[#D4AF37]/80' : 'text-zinc-600'
          }`}>
            {treasure.summary.validAddresses}
          </div>
          <div className="text-xs font-mono text-zinc-500">Valid</div>
        </div>
        <div>
          <div className={`text-2xl font-mono font-bold ${
            treasure.summary.patoshiMatches > 0 ? 'text-[#D4AF37]' : 'text-zinc-600'
          }`}>
            {treasure.summary.patoshiMatches}
          </div>
          <div className="text-xs font-mono text-zinc-500">Patoshi</div>
        </div>
        <div>
          <div className={`text-2xl font-mono font-bold ${
            treasure.summary.cfbMatches > 0 ? 'text-[#D4AF37]/70' : 'text-zinc-600'
          }`}>
            {treasure.summary.cfbMatches}
          </div>
          <div className="text-xs font-mono text-zinc-500">CFB</div>
        </div>
        <div>
          <div className="text-2xl font-mono font-bold text-zinc-400">
            {(treasure.summary.highestConfidence * 100).toFixed(0)}%
          </div>
          <div className="text-xs font-mono text-zinc-500">Confidence</div>
        </div>
      </div>

      {/* Statistical Analysis */}
      {treasure.statisticalAnalysis.reasons.length > 0 && (
        <div className="px-4 py-2 bg-[#D4AF37]/[0.03] border-t border-[#D4AF37]/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#D4AF37]/60">Statistical:</span>
            <span className="text-xs font-mono text-zinc-400">
              {treasure.statisticalAnalysis.reasons.join(' | ')}
            </span>
            <span className="ml-auto text-xs font-mono text-[#D4AF37]/60">
              {(treasure.statisticalAnalysis.score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Derived Addresses */}
      <div className="p-4 space-y-2">
        <div className="text-[11px] font-mono text-[#D4AF37]/50 uppercase tracking-[0.4em]">
          Derived Bitcoin Addresses
        </div>
        <div className="space-y-2">
          {treasure.derivedAddresses.slice(0, expanded ? undefined : 3).map((addr, i) => (
            <div
              key={i}
              className={`p-3 border ${
                addr.matchesPatoshi
                  ? 'border-[#D4AF37]/40 bg-[#D4AF37]/[0.06]'
                  : addr.matchesCFB
                    ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.04]'
                    : addr.onChain?.exists && parseFloat(addr.onChain.balance) > 0
                      ? 'border-[#D4AF37]/20 bg-[#D4AF37]/[0.03]'
                      : addr.isValid
                        ? 'border-white/[0.04] bg-[#050505]'
                        : 'border-red-800/30 bg-red-900/5'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-[#D4AF37]/80 break-all">
                  {addr.address}
                </code>
                <span className={`text-xs font-mono ${
                  addr.confidence > 0.5 ? 'text-[#D4AF37]/70' : 'text-zinc-500'
                }`}>
                  {(addr.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-2 flex items-center flex-wrap gap-3 text-xs font-mono">
                <span className="text-zinc-500">{addr.method}</span>
                {!addr.isValid && <span className="text-red-400">Invalid format</span>}
                {addr.matchesCFB && <span className="text-[#D4AF37]/70">CFB Pattern</span>}
                {addr.onChain && (
                  <span className={parseFloat(addr.onChain.balance) > 0 ? 'text-[#D4AF37]' : 'text-zinc-600'}>
                    {parseFloat(addr.onChain.balance) > 0
                      ? `${addr.onChain.balance} BTC (${addr.onChain.txCount} tx)`
                      : addr.onChain.exists
                        ? 'On-chain (0 BTC)'
                        : 'Not found'
                    }
                  </span>
                )}
                {addr.matchesPatoshi && (
                  <span className="text-[#D4AF37]">
                    Block {addr.matchesPatoshi.block} ({addr.matchesPatoshi.btc} BTC)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {treasure.derivedAddresses.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-mono text-[#D4AF37]/60 hover:text-[#D4AF37]"
          >
            {expanded ? '-- Show less' : `++ Show ${treasure.derivedAddresses.length - 3} more addresses`}
          </button>
        )}
      </div>

      {/* Matrix Coordinates */}
      <div className="p-4 border-t border-white/[0.04] bg-black/20">
        <div className="text-[11px] font-mono text-[#D4AF37]/50 uppercase tracking-[0.4em] mb-2">
          Matrix Coordinates
        </div>
        <div className="flex flex-wrap gap-2">
          {treasure.coordinates.slice(0, 8).map((coord, i) => (
            <div key={i} className="px-2 py-1 bg-[#050505] border border-white/[0.04] text-xs font-mono">
              <span className="text-zinc-500">[{coord.row},{coord.col}]</span>
              <span className={`ml-1 ${coord.value > 0 ? 'text-[#D4AF37]/70' : coord.value < 0 ? 'text-red-400/60' : 'text-zinc-500'}`}>
                {coord.value > 0 ? '+' : ''}{coord.value}
              </span>
              <span className="ml-1 text-zinc-600">{coord.region.zone}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Seeds */}
      <div className="p-4 border-t border-white/[0.04]">
        <div className="text-[11px] font-mono text-[#D4AF37]/50 uppercase tracking-[0.4em] mb-2">
          Extracted Seeds (by Matrix Region)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {treasure.seeds.map((seed, i) => (
            <div key={i} className="p-2 bg-[#050505] border border-white/[0.04] text-xs font-mono">
              <div className="text-zinc-400 truncate">{seed.region}</div>
              <div className="text-zinc-600 truncate" title={seed.hex}>{seed.hex.slice(0, 12)}...</div>
              <div className={`flex items-center gap-1 ${seed.entropy > 0.5 ? 'text-[#D4AF37]/70' : 'text-zinc-500'}`}>
                <span>H:</span>
                <div className="flex-1 h-1 bg-zinc-900 overflow-hidden">
                  <div
                    className={`h-full ${seed.entropy > 0.5 ? 'bg-[#D4AF37]/40' : 'bg-zinc-600'}`}
                    style={{ width: `${seed.entropy * 100}%` }}
                  />
                </div>
                <span>{(seed.entropy * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/[0.04] bg-black/40 flex items-center justify-between text-xs font-mono text-zinc-600">
        <span>Hash: {treasure.queryHash.slice(0, 24)}...</span>
        <span className={
          hasPatoshi ? 'text-[#D4AF37]' :
          hasCFB ? 'text-[#D4AF37]/70' :
          hasBalance ? 'text-[#D4AF37]/60' : 'text-zinc-500'
        }>
          {treasure.summary.verdict}
        </span>
      </div>
    </div>
  )
}
