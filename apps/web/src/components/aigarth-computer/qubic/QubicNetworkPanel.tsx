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
    fetchBalance,
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
          <div
            className={`w-3 h-3 ${
              isConnected ? 'bg-gold animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="font-semibold text-white">
            {isConnected ? 'Connected to Qubic Network' : 'Disconnected'}
          </span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gold" />}
        </div>
        <Button
          className="border-border hover:bg-surface-2 "
          disabled={isLoading}
          onClick={refresh}
          size="sm"
          variant="outline"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
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
        <div className="bg-card border border-border p-4 hover:bg-surface-2 transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Activity className="w-4 h-4" />
            <span>Current Tick</span>
          </div>
          <div className="text-2xl font-bold text-gold font-mono">
            {networkStatus?.tick !== undefined
              ? networkStatus.tick.toLocaleString()
              : '---'}
          </div>
        </div>

        {/* Current Epoch */}
        <div className="bg-card border border-border p-4 hover:bg-surface-2 transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Clock className="w-4 h-4" />
            <span>Epoch</span>
          </div>
          <div className="text-2xl font-bold text-gold/80 font-mono">
            {epoch?.epoch !== undefined && !Number.isNaN(epoch.epoch)
              ? epoch.epoch
              : '---'}
          </div>
        </div>

        {/* Network Health */}
        <div className="bg-card border border-border p-4 hover:bg-surface-2 transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Server className="w-4 h-4" />
            <span>Network Health</span>
          </div>
          <Badge
            className={`text-sm ${
              networkStatus?.health === 'excellent'
                ? 'text-gold border-gold/50'
                : networkStatus?.health === 'good'
                  ? 'text-gold/70 border-gold/30'
                  : networkStatus?.health === 'fair'
                    ? 'text-gold/80 border-gold/20'
                    : 'text-red-400 border-red-400/50'
            }`}
            variant="outline"
          >
            {networkStatus?.health?.toUpperCase() ?? '---'}
          </Badge>
        </div>

        {/* Last Update */}
        <div className="bg-card border border-border p-4 hover:bg-surface-2 transition-all">
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
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-gold" />
              <h4 className="font-semibold text-white">Configured Wallet</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gold/80 text-xs uppercase tracking-widest font-mono">
                  Address
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs text-gold bg-surface-1 border border-border p-2 overflow-x-auto">
                    {DEFAULT_SENDER_ID.slice(0, 20)}...
                    {DEFAULT_SENDER_ID.slice(-10)}
                  </code>
                  <button
                    className="p-1 hover:bg-surface-2 border border-transparent hover:border-border"
                    onClick={() => handleCopy(DEFAULT_SENDER_ID)}
                    type="button"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-gold" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gold/80 text-xs uppercase tracking-widest font-mono">
                  Balance
                </label>
                <div className="text-2xl font-bold text-gold font-mono">
                  {balance !== null ? (
                    <>
                      {formatBalance(balance)}{' '}
                      <span className="text-sm text-zinc-500">QUBIC</span>
                    </>
                  ) : (
                    '---'
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Check Any Address */}
        <div className="bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gold" />
            <h4 className="font-semibold text-white">Check Any Address</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-gold/80 text-xs uppercase tracking-widest font-mono mb-1 block">
                Qubic Address (60 characters)
              </label>
              <input
                className="w-full bg-card border border-border px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 focus:outline-none transition-all"
                maxLength={60}
                onChange={e => setCustomAddress(e.target.value.toUpperCase())}
                placeholder="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                type="text"
                value={customAddress}
              />
            </div>

            <Button
              className="w-full bg-gold hover:bg-gold/80 text-black font-semibold"
              disabled={isLoadingCustom || customAddress.length !== 60}
              onClick={handleCheckBalance}
            >
              {isLoadingCustom ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              Check Balance
            </Button>

            {customBalance !== null && (
              <div className="p-3 bg-surface-1 border border-border">
                <span className="text-sm text-zinc-400">Balance: </span>
                <span className="text-lg font-bold text-gold font-mono">
                  {formatBalance(customBalance)} QUBIC
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Info Footer */}
      <div className="bg-card border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            <span className="font-semibold text-white">Qubic Network</span> --
            Decentralized AI Computation
          </div>
          <a
            className="flex items-center gap-1 text-sm text-gold hover:text-gold/80"
            href="https://qubic.org"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>qubic.org</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
