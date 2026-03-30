'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
  Copy,
  ExternalLink,
  Layers,
  Plus,
  Trash2,
  Eye,
  Clock,
  Zap,
  Calculator,
  Check,
  Flame,
  Search,
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface NetworkData {
  price: { usd: number; market_cap: number; volume_24h: number; change_24h: number }
  network: {
    tick: number
    epoch: number
    initial_tick: number
    ticks_in_epoch: number
    empty_ticks: number
    tick_quality: number
    circulating_supply: string
    active_addresses: number
    burned_qus: string
  }
  timestamp: number
}

interface WatchedAddress {
  address: string
  label: string
  balance: string
  lastUpdate: number
}

// =============================================================================
// HOOKS
// =============================================================================

function useMarketData() {
  const [data, setData] = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    // Abort any in-flight request before starting a new one
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const res = await fetch('/api/mining-stats?type=all', { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) throw new Error('API error')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Only show timeout error if we timed out (not unmount abort)
        if (!controller.signal.aborted) return
        setError('Request timed out')
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => {
      clearInterval(interval)
      abortRef.current?.abort()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatNumber = (n: number, decimals = 0) => {
  if (n >= 1e12) return `${(n / 1e12).toFixed(decimals)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`
  return n.toLocaleString()
}

const formatPrice = (p: number) => {
  if (p === 0) return '$0.00'
  if (p < 0.000001) return `$${p.toExponential(2)}`
  if (p < 0.01) return `$${p.toFixed(6)}`
  return `$${p.toFixed(4)}`
}

// =============================================================================
// SHARED UI PRIMITIVES
// =============================================================================

function HUDCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-[#050505] border border-white/[0.04] transition-all duration-500 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] group overflow-hidden ${className}`}>
      {/* Top accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 transition-colors duration-500" />
      {/* Corner dots */}
      <div className="absolute top-2 right-2 w-1 h-1 bg-white/0 group-hover:bg-[#D4AF37]/30 transition-colors duration-500" />
      <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/0 group-hover:bg-white/10 transition-colors duration-500" />
      {children}
    </div>
  )
}

function SectionHeader({ number, label }: { number: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-3 mb-8">
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
      <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
        {number} &mdash; {label}
      </span>
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
    </div>
  )
}

// =============================================================================
// COMPONENTS
// =============================================================================

// Network Health Indicator
function NetworkHealth({ tickQuality, loading }: { tickQuality: number; loading: boolean }) {
  const status = tickQuality > 95 ? 'optimal' : tickQuality > 90 ? 'degraded' : 'critical'
  const statusColor = {
    optimal: 'text-[#D4AF37]/80',
    degraded: 'text-yellow-400/70',
    critical: 'text-red-400/70',
  }[status]
  const statusBg = {
    optimal: 'bg-[#D4AF37]/10',
    degraded: 'bg-yellow-400/10',
    critical: 'bg-red-400/10',
  }[status]
  const statusLabel = {
    optimal: 'OPTIMAL',
    degraded: 'DEGRADED',
    critical: 'CRITICAL',
  }[status]

  return (
    <HUDCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[#D4AF37]/30" />
        <span className="text-[#D4AF37]/30 text-[10px] uppercase tracking-[0.4em] font-mono">
          // network.health()
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 ${statusBg}`}>
              <span className={`w-2 h-2 ${statusColor} ${status === 'optimal' ? '' : 'animate-pulse'}`}>
                <span className="block w-full h-full bg-current" />
              </span>
              <span className={`text-xs font-mono font-bold ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Tick Quality</span>
              <span className={`text-sm font-mono font-bold ${statusColor}`}>{tickQuality.toFixed(2)}%</span>
            </div>
            <div className="h-1 bg-white/[0.04] overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  status === 'optimal' ? 'bg-[#D4AF37]/50' : status === 'degraded' ? 'bg-yellow-400/50' : 'bg-red-400/50'
                }`}
                style={{ width: `${tickQuality}%` }}
              />
            </div>
          </div>

          <code className="text-[10px] text-[#D4AF37]/20 font-mono">
            $ health.check --quality {tickQuality.toFixed(2)}
          </code>
        </>
      )}
    </HUDCard>
  )
}

// Live Tick Counter
function LiveTickCounter({ tick, epoch, loading }: { tick: number; epoch: number; loading: boolean }) {
  return (
    <HUDCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-[#D4AF37]/30" />
        <span className="text-[#D4AF37]/30 text-[10px] uppercase tracking-[0.4em] font-mono">
          // tick.current()
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
        </div>
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={tick}
              className="text-3xl md:text-4xl font-bold font-mono text-white tracking-tight tabular-nums mb-1"
              initial={{ y: -4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 4, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {tick.toLocaleString()}
            </motion.div>
          </AnimatePresence>
          <div className="text-[10px] text-white/20 uppercase tracking-wider font-mono">
            Epoch {epoch}
          </div>
        </>
      )}
    </HUDCard>
  )
}

// Metric Card
function MetricCard({ label, value, subValue, change, loading, terminal }: {
  label: string
  value: string | number
  subValue?: string
  change?: number
  loading?: boolean
  terminal?: string
}) {
  return (
    <HUDCard className="p-4">
      <div className="text-[10px] text-white/30 mb-1.5 uppercase tracking-wider font-mono">{label}</div>
      {loading ? (
        <div className="h-7 flex items-center">
          <Loader2 className="w-4 h-4 animate-spin text-white/20" />
        </div>
      ) : (
        <>
          <div className="text-xl font-mono font-semibold text-white tabular-nums">{value}</div>
          <div className="flex items-center gap-2 mt-1">
            {subValue && <span className="text-[10px] text-white/20 font-mono">{subValue}</span>}
            {change !== undefined && (
              <span className={`text-[10px] font-mono font-medium flex items-center gap-0.5 ${
                change >= 0 ? 'text-[#D4AF37]/60' : 'text-red-400/60'
              }`}>
                {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change).toFixed(2)}%
              </span>
            )}
          </div>
          {terminal && (
            <code className="block text-[9px] text-[#D4AF37]/15 font-mono mt-2">$ {terminal}</code>
          )}
        </>
      )}
    </HUDCard>
  )
}

// Price Display
function PriceDisplay({ data, loading }: { data: NetworkData | null; loading: boolean }) {
  const change = data?.price.change_24h ?? 0
  const isPositive = change >= 0

  return (
    <HUDCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-mono">QUBIC / USD</span>
        <span className="text-[9px] text-[#D4AF37]/20 font-mono">CoinGecko</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
        </div>
      ) : (
        <>
          <div className="text-3xl font-mono font-bold text-white mb-3 tabular-nums">
            {formatPrice(data?.price.usd ?? 0)}
          </div>

          <div className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono font-medium ${
            isPositive ? 'bg-[#D4AF37]/10 text-[#D4AF37]/70' : 'bg-red-500/10 text-red-400/70'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(2)}% (24h)
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/[0.04]">
            <div>
              <div className="text-[10px] text-white/20 mb-0.5 font-mono uppercase tracking-wider">Mkt Cap</div>
              <div className="text-sm font-mono text-white/70 tabular-nums">
                ${formatNumber(data?.price.market_cap ?? 0, 1)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/20 mb-0.5 font-mono uppercase tracking-wider">24h Vol</div>
              <div className="text-sm font-mono text-white/70 tabular-nums">
                ${formatNumber(data?.price.volume_24h ?? 0, 1)}
              </div>
            </div>
          </div>
        </>
      )}
    </HUDCard>
  )
}

// Epoch Progress
function EpochProgress({ data, loading }: { data: NetworkData | null; loading: boolean }) {
  const EXPECTED_TICKS_PER_EPOCH = 604_800
  const ticksInEpoch = data?.network.ticks_in_epoch || 0
  const progress = Math.min((ticksInEpoch / EXPECTED_TICKS_PER_EPOCH) * 100, 100)
  const remaining = Math.max(EXPECTED_TICKS_PER_EPOCH - ticksInEpoch, 0)
  const hoursRemaining = remaining / 3600
  const daysRemaining = hoursRemaining / 24

  return (
    <HUDCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-[#D4AF37]/30" />
        <span className="text-[#D4AF37]/30 text-[10px] uppercase tracking-[0.4em] font-mono">
          // epoch.progress()
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-mono text-white/50">Epoch {data?.network.epoch ?? '—'}</span>
            <span className="text-[10px] text-[#D4AF37]/40 font-mono">{progress.toFixed(1)}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/[0.04] overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/60"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-white/20 mb-0.5 font-mono uppercase">Ticks</div>
              <div className="text-sm font-mono text-white/70 tabular-nums">{formatNumber(ticksInEpoch)}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/20 mb-0.5 font-mono uppercase">Remaining</div>
              <div className="text-sm font-mono text-white/70 tabular-nums">{formatNumber(remaining)}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/20 mb-0.5 font-mono uppercase">Est.</div>
              <div className="text-sm font-mono text-white/70 tabular-nums">
                {daysRemaining > 1 ? `~${daysRemaining.toFixed(1)}d` : `~${hoursRemaining.toFixed(0)}h`}
              </div>
            </div>
          </div>
        </>
      )}
    </HUDCard>
  )
}

// Supply & Burn Tracker
function SupplyBurnTracker({ data, loading }: { data: NetworkData | null; loading: boolean }) {
  const supply = Number(data?.network.circulating_supply || 0)
  const burned = Number(data?.network.burned_qus || 0)
  const burnRatio = supply > 0 ? (burned / (supply + burned)) * 100 : 0

  return (
    <HUDCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-[#D4AF37]/30" />
        <span className="text-[#D4AF37]/30 text-[10px] uppercase tracking-[0.4em] font-mono">
          // supply.burn()
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Circulating</span>
              <span className="text-sm font-mono text-white/70 tabular-nums">{formatNumber(supply)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Burned</span>
              <span className="text-sm font-mono text-[#D4AF37]/60 tabular-nums">{formatNumber(burned)}</span>
            </div>
          </div>

          {/* Burn ratio bar */}
          <div className="h-1 bg-white/[0.04] overflow-hidden mb-2">
            <div
              className="h-full bg-[#D4AF37]/40"
              style={{ width: `${Math.min(burnRatio, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-white/20 font-mono tabular-nums">
            {burnRatio.toFixed(4)}% burned
          </div>
        </>
      )}
    </HUDCard>
  )
}

// Profitability Calculator
function ProfitabilityCalculator({ price }: { price: number }) {
  const [hashrate, setHashrate] = useState('')
  const [result, setResult] = useState<{ daily: number; weekly: number; monthly: number } | null>(null)

  const calculate = useCallback(() => {
    const hr = parseFloat(hashrate)
    if (isNaN(hr) || hr <= 0 || price <= 0) {
      setResult(null)
      return
    }
    const DAILY_EMISSION = 1_000_000_000_000 / 7
    const NETWORK_HASHRATE = 500_000_000
    const yourShare = hr / NETWORK_HASHRATE
    const dailyQubic = DAILY_EMISSION * yourShare
    const dailyUsd = dailyQubic * price

    setResult({ daily: dailyUsd, weekly: dailyUsd * 7, monthly: dailyUsd * 30 })
  }, [hashrate, price])

  return (
    <HUDCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-[#D4AF37]/30" />
        <span className="text-[#D4AF37]/30 text-[10px] uppercase tracking-[0.4em] font-mono">
          // mining.estimate()
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="number"
          placeholder="Hashrate (It/s)"
          value={hashrate}
          onChange={(e) => setHashrate(e.target.value)}
          className="flex-1 px-3 py-2 bg-black border border-white/[0.06] text-white text-sm font-mono focus:border-[#D4AF37]/30 focus:outline-none transition-colors"
        />
        <button
          onClick={calculate}
          className="px-4 py-2 bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 text-[#D4AF37]/60 text-sm font-mono hover:bg-[#D4AF37]/[0.1] hover:border-[#D4AF37]/25 transition-all"
        >
          Calc
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-3 gap-[1px] bg-white/[0.04]">
          {[
            { label: 'Daily', value: result.daily },
            { label: 'Weekly', value: result.weekly },
            { label: 'Monthly', value: result.monthly },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 bg-[#050505]">
              <div className="text-[9px] text-white/20 uppercase font-mono mb-1">{item.label}</div>
              <div className="text-sm font-mono text-[#D4AF37]/60 tabular-nums">${item.value.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[9px] text-white/15 mt-3 font-mono">
        * Estimates only. Depends on network conditions and pool fees.
      </p>
    </HUDCard>
  )
}

// Address Lookup / Watchlist
function AddressLookup() {
  const [addresses, setAddresses] = useState<WatchedAddress[]>([])
  const [newAddress, setNewAddress] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('qubic-watchlist')
    if (saved) {
      try { setAddresses(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (addresses.length > 0) {
      localStorage.setItem('qubic-watchlist', JSON.stringify(addresses))
    } else {
      localStorage.removeItem('qubic-watchlist')
    }
  }, [addresses])

  const addAddress = async () => {
    if (!newAddress.trim() || newAddress.length < 50) return
    const addr = newAddress.trim().toUpperCase()
    if (addresses.some((a) => a.address === addr)) return

    setIsAdding(true)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(`https://rpc.qubic.org/v1/balances/${addr}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeout)
      const json = await res.json()
      const balance = json?.balance?.balance ?? '0'
      setAddresses((prev) => [...prev, {
        address: addr,
        label: `Wallet ${prev.length + 1}`,
        balance: String(balance),
        lastUpdate: Date.now(),
      }])
      setNewAddress('')
    } catch {
      // Still add with unknown balance
      setAddresses((prev) => [...prev, {
        address: addr,
        label: `Wallet ${prev.length + 1}`,
        balance: '—',
        lastUpdate: Date.now(),
      }])
      setNewAddress('')
    }
    setIsAdding(false)
  }

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    setCopied(addr)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <HUDCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#D4AF37]/30" />
          <span className="text-[#D4AF37]/30 text-[10px] uppercase tracking-[0.4em] font-mono">
            // address.lookup()
          </span>
        </div>
        <span className="text-[9px] text-white/15 font-mono">{addresses.length} tracked</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          placeholder="Qubic address..."
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && addAddress()}
          className="flex-1 px-3 py-2 bg-black border border-white/[0.06] text-white text-xs font-mono focus:border-[#D4AF37]/30 focus:outline-none transition-colors"
        />
        <button
          onClick={addAddress}
          disabled={isAdding}
          className="px-3 py-2 bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 text-[#D4AF37]/50 hover:bg-[#D4AF37]/[0.1] transition-all disabled:opacity-30"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      <div className="space-y-1 max-h-[220px] overflow-y-auto">
        {addresses.length === 0 ? (
          <div className="text-center py-6 text-white/15 text-[10px] font-mono uppercase tracking-wider">
            No addresses tracked
          </div>
        ) : (
          addresses.map((addr) => (
            <div key={addr.address} className="flex items-center gap-2 p-2 bg-black/50 border border-white/[0.02] group hover:border-white/[0.06] transition-colors">
              <div className="flex-1 min-w-0">
                <code className="text-[10px] text-white/40 font-mono block truncate">
                  {addr.address.slice(0, 15)}...{addr.address.slice(-8)}
                </code>
              </div>
              <div className="text-xs font-mono text-white/70 tabular-nums shrink-0">
                {addr.balance === '—' ? '—' : formatNumber(Number(addr.balance))}
              </div>
              <button
                onClick={() => copyAddress(addr.address)}
                className="p-1 text-white/0 group-hover:text-white/30 hover:text-white/50 transition-colors"
              >
                {copied === addr.address ? (
                  <Check className="w-3 h-3 text-[#D4AF37]/60" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => setAddresses((p) => p.filter((a) => a.address !== addr.address))}
                className="p-1 text-white/0 group-hover:text-white/30 hover:text-red-400/50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </HUDCard>
  )
}

// Quick Links
function QuickLinks() {
  const links = [
    { label: 'Qubic Explorer', url: 'https://explorer.qubic.org', terminal: 'explorer.open()' },
    { label: 'Qubic.li Stats', url: 'https://app.qubic.li', terminal: 'pool.stats()' },
    { label: 'Official Wallet', url: 'https://wallet.qubic.org', terminal: 'wallet.connect()' },
    { label: 'CoinGecko', url: 'https://www.coingecko.com/en/coins/qubic-network', terminal: 'price.source()' },
  ]

  return (
    <HUDCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <ExternalLink className="w-4 h-4 text-[#D4AF37]/30" />
        <span className="text-[#D4AF37]/30 text-[10px] uppercase tracking-[0.4em] font-mono">
          // links.external()
        </span>
      </div>

      <div className="space-y-1">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 bg-black/30 border border-white/[0.02] hover:border-[#D4AF37]/15 hover:bg-[#0a0a0a] transition-all group/link"
          >
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#D4AF37]/20 font-mono group-hover/link:text-[#D4AF37]/40 transition-colors">&gt;_</span>
              <span className="text-sm text-white/40 group-hover/link:text-white/70 transition-colors font-mono">{link.label}</span>
            </div>
            <ExternalLink className="w-3 h-3 text-white/10 group-hover/link:text-[#D4AF37]/40 transition-colors" />
          </a>
        ))}
      </div>
    </HUDCard>
  )
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function MonitoringPage() {
  const { data: marketData, loading: marketLoading, error, refresh: refreshMarket } = useMarketData()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-40px' })

  const handleRefresh = async () => {
    await refreshMarket()
    setLastUpdate(new Date())
  }

  useEffect(() => {
    if (marketData) setLastUpdate(new Date())
  }, [marketData])

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      {/* Page Hero */}
      <section className="relative w-full py-16 md:py-24 overflow-hidden">
        {/* Watermark */}
        <div aria-hidden="true" className="absolute top-8 right-8 md:right-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.02] leading-none select-none pointer-events-none font-mono">
          NET
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <SectionHeader number="01" label="Network" />

            <h1
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white mb-5 tracking-wide md:tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Network{' '}
              <span className="text-[#D4AF37]/80">Monitor</span>
            </h1>

            <p className="text-lg text-white/35 max-w-2xl mx-auto leading-relaxed mb-8">
              Real-time Qubic network statistics, price data, and monitoring tools.
            </p>

            {/* Status bar */}
            <div className="inline-flex items-center gap-4 px-4 py-2 border border-white/[0.04] bg-[#050505]">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 ${error ? 'bg-red-400/70' : 'bg-[#D4AF37]/60'} ${!error && 'animate-pulse'}`} />
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                  {error ? 'Offline' : 'Connected'}
                </span>
              </div>

              {lastUpdate && (
                <span className="text-[10px] text-white/15 font-mono">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              )}

              <button
                onClick={handleRefresh}
                disabled={marketLoading}
                className="flex items-center gap-1.5 text-[10px] text-[#D4AF37]/30 hover:text-[#D4AF37]/60 font-mono uppercase tracking-wider transition-colors disabled:opacity-30"
              >
                <RefreshCw className={`w-3 h-3 ${marketLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div ref={sectionRef} className="container mx-auto px-6 max-w-6xl pb-20">
        {/* Error state */}
        {error && !marketData && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-4 border border-red-400/15 bg-red-400/[0.03]">
              <Activity className="w-5 h-5 text-red-400/50" />
              <span className="text-sm text-red-400/60 font-mono">
                Failed to connect: {error}
              </span>
            </div>
            <p className="text-[10px] text-white/20 font-mono mt-4">
              $ retry --interval 30s // auto-refreshing
            </p>
          </motion.div>
        )}

        {/* Stats Grid - Primary metrics */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
            <MetricCard
              label="Current Tick"
              value={marketData?.network.tick?.toLocaleString() ?? '—'}
              subValue="Live"
              loading={marketLoading}
              terminal="tick.get()"
            />
            <MetricCard
              label="Epoch"
              value={marketData?.network.epoch ?? '—'}
              subValue={marketData?.network.initial_tick ? `Start: ${marketData.network.initial_tick.toLocaleString()}` : undefined}
              loading={marketLoading}
              terminal="epoch.current()"
            />
            <MetricCard
              label="Active Addresses"
              value={marketData?.network.active_addresses ? formatNumber(marketData.network.active_addresses) : '—'}
              loading={marketLoading}
              terminal="addr.active()"
            />
            <MetricCard
              label="Supply"
              value={marketData?.network.circulating_supply ? formatNumber(Number(marketData.network.circulating_supply)) : '—'}
              subValue="QUBIC"
              loading={marketLoading}
              terminal="supply.get()"
            />
          </div>
        </motion.section>

        {/* Secondary stats row */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
            <MetricCard
              label="Ticks in Epoch"
              value={marketData?.network.ticks_in_epoch?.toLocaleString() ?? '—'}
              loading={marketLoading}
            />
            <MetricCard
              label="Empty Ticks"
              value={marketData?.network.empty_ticks?.toLocaleString() ?? '—'}
              subValue={`${((marketData?.network.empty_ticks ?? 0) / (marketData?.network.ticks_in_epoch || 1) * 100).toFixed(1)}% of epoch`}
              loading={marketLoading}
            />
            <MetricCard
              label="Tick Quality"
              value={`${(marketData?.network.tick_quality ?? 0).toFixed(2)}%`}
              loading={marketLoading}
            />
            <MetricCard
              label="Burned QUs"
              value={marketData?.network.burned_qus ? formatNumber(Number(marketData.network.burned_qus)) : '—'}
              subValue="Permanently removed"
              loading={marketLoading}
            />
          </div>
        </motion.section>

        {/* Main Grid - Tools */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-white/[0.04] mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Left Column */}
          <div className="space-y-[1px]">
            <PriceDisplay data={marketData} loading={marketLoading} />
            <EpochProgress data={marketData} loading={marketLoading} />
          </div>

          {/* Middle Column */}
          <div className="space-y-[1px]">
            <NetworkHealth tickQuality={marketData?.network.tick_quality ?? 0} loading={marketLoading} />
            <SupplyBurnTracker data={marketData} loading={marketLoading} />
            <LiveTickCounter
              tick={marketData?.network.tick ?? 0}
              epoch={marketData?.network.epoch ?? 0}
              loading={marketLoading}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-[1px]">
            <ProfitabilityCalculator price={marketData?.price.usd ?? 0} />
            <QuickLinks />
          </div>
        </motion.div>

        {/* Address Lookup - Full width */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <AddressLookup />
        </motion.section>

        {/* Terminal Footer */}
        <motion.footer
          className="px-4 py-3 border border-white/[0.04] bg-[#050505]"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <code className="text-[10px] text-white/15 font-mono">
              <span className="text-[#D4AF37]/20">$</span> sources: CoinGecko, Qubic RPC | refresh: 30s | data: client-side
            </code>
            <code className="text-[10px] text-white/10 font-mono">
              watchlist: localStorage
            </code>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}
