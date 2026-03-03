'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Wallet,
  RefreshCw,
  Activity,
  Clock,
  Server,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import { useQubicNetwork } from '../hooks/useQubicNetwork'

// Default sender address for monitoring (from environment or hardcoded for demo)
const DEFAULT_SENDER_ID = process.env.NEXT_PUBLIC_QUBIC_SENDER_ID || ''

export function QubicNetworkPanel() {
  const {
    isConnected,
    isLoading,
    error,
    epoch,
    networkStatus,
    balance,
    lastUpdate,
    refresh,
    fetchBalance
  } = useQubicNetwork(DEFAULT_SENDER_ID)

  const [customAddress, setCustomAddress] = useState('')
  const [customBalance, setCustomBalance] = useState<bigint | null>(null)
  const [isLoadingCustom, setIsLoadingCustom] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCheckBalance = async () => {
    if (!customAddress.trim() || customAddress.length !== 60) return
    setIsLoadingCustom(true)
    try {
      const bal = await fetchBalance(customAddress)
      setCustomBalance(bal)
    } catch {
      setCustomBalance(null)
    } finally {
      setIsLoadingCustom(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatBalance = (bal: bigint): string => {
    const num = Number(bal)
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts)
    return date.toLocaleTimeString()
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 ${
            isConnected ? 'bg-[#D4AF37] animate-pulse' : 'bg-red-500'
          }`} />
          <span className="font-semibold text-white">
            {isConnected ? 'Connected to Qubic Network' : 'Disconnected'}
          </span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="border-white/[0.04] hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Network Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Current Tick */}
        <div className="bg-[#050505] border border-white/[0.04] p-4 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Activity className="w-4 h-4" />
            <span>Current Tick</span>
          </div>
          <div className="text-2xl font-bold text-[#D4AF37] font-mono">
            {networkStatus?.tick !== undefined ? networkStatus.tick.toLocaleString() : '---'}
          </div>
        </div>

        {/* Current Epoch */}
        <div className="bg-[#050505] border border-white/[0.04] p-4 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Clock className="w-4 h-4" />
            <span>Epoch</span>
          </div>
          <div className="text-2xl font-bold text-[#D4AF37]/80 font-mono">
            {epoch?.epoch !== undefined && !Number.isNaN(epoch.epoch) ? epoch.epoch : '---'}
          </div>
        </div>

        {/* Network Health */}
        <div className="bg-[#050505] border border-white/[0.04] p-4 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Server className="w-4 h-4" />
            <span>Network Health</span>
          </div>
          <Badge
            variant="outline"
            className={`text-sm ${
              networkStatus?.health === 'excellent' ? 'text-[#D4AF37] border-[#D4AF37]/50' :
              networkStatus?.health === 'good' ? 'text-[#D4AF37]/70 border-[#D4AF37]/30' :
              networkStatus?.health === 'fair' ? 'text-[#D4AF37]/50 border-[#D4AF37]/20' :
              'text-red-400 border-red-400/50'
            }`}
          >
            {networkStatus?.health?.toUpperCase() ?? '---'}
          </Badge>
        </div>

        {/* Last Update */}
        <div className="bg-[#050505] border border-white/[0.04] p-4 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Last Update</span>
          </div>
          <div className="text-lg font-semibold text-zinc-300">
            {lastUpdate ? formatTimestamp(lastUpdate) : '---'}
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configured Wallet */}
        {DEFAULT_SENDER_ID && (
          <div className="bg-[#050505] border border-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-[#D4AF37]" />
              <h4 className="font-semibold text-white">Configured Wallet</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs text-[#D4AF37] bg-[#0a0a0a] border border-white/[0.04] p-2 overflow-x-auto">
                    {DEFAULT_SENDER_ID.slice(0, 20)}...{DEFAULT_SENDER_ID.slice(-10)}
                  </code>
                  <button
                    onClick={() => handleCopy(DEFAULT_SENDER_ID)}
                    className="p-1 hover:bg-[#0a0a0a] border border-transparent hover:border-white/[0.04]"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">Balance</label>
                <div className="text-2xl font-bold text-[#D4AF37] font-mono">
                  {balance !== null ? (
                    <>
                      {formatBalance(balance)} <span className="text-sm text-zinc-500">QUBIC</span>
                    </>
                  ) : '---'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Check Any Address */}
        <div className="bg-[#050505] border border-white/[0.04] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-[#D4AF37]" />
            <h4 className="font-semibold text-white">Check Any Address</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono mb-1 block">
                Qubic Address (60 characters)
              </label>
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value.toUpperCase())}
                placeholder="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                className="w-full bg-[#050505] border border-white/[0.04] px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all"
                maxLength={60}
              />
            </div>

            <Button
              onClick={handleCheckBalance}
              disabled={isLoadingCustom || customAddress.length !== 60}
              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black font-semibold"
            >
              {isLoadingCustom ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              Check Balance
            </Button>

            {customBalance !== null && (
              <div className="p-3 bg-[#0a0a0a] border border-white/[0.04]">
                <span className="text-sm text-zinc-400">Balance: </span>
                <span className="text-lg font-bold text-[#D4AF37] font-mono">
                  {formatBalance(customBalance)} QUBIC
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Info Footer */}
      <div className="bg-[#050505] border border-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            <span className="font-semibold text-white">Qubic Network</span> -- Decentralized AI Computation
          </div>
          <a
            href="https://qubic.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-[#D4AF37] hover:text-[#D4AF37]/80"
          >
            <span>qubic.org</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
