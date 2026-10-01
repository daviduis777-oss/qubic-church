'use client'

import { useState, useEffect, useCallback, useRef, useId } from 'react'
import { useLocale } from 'next-intl'
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Check,
} from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import {
  formatCompact,
  formatDecimal,
  formatInt,
  formatPercent,
  formatUsd,
  formatUsdCompact,
  numberLocale,
} from '@/lib/format'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface NetworkData {
  price: {
    usd: number
    market_cap: number
    volume_24h: number
    change_24h: number
  }
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

function useMarketData(locale: string) {
  const [data, setData] = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    // Abort any in-flight request before starting a new one
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), 10000)
    setLoading(true)

    try {
      const res = await fetch('/api/mining-stats?type=all', {
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!res.ok) throw new Error('API error')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setError(null)
      setUpdatedAt(new Date().toLocaleTimeString(numberLocale(locale)))
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Only show timeout error if we timed out (not unmount abort)
        if (!controller.signal.aborted) return
        setError('The request timed out')
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => {
      clearInterval(interval)
      abortRef.current?.abort()
    }
  }, [fetchData])

  return { data, loading, error, updatedAt, refresh: fetchData }
}

// =============================================================================
// PRIMITIVES
// =============================================================================

const EMPTY = 'n/a'

/** One cell of the hairline grid. */
function Panel({
  title,
  aside,
  className,
  children,
}: {
  title: string
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('flex flex-col bg-card p-5 sm:p-6', className)}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="eyebrow text-muted-foreground">{title}</h2>
        {aside && <div className="text-xs text-muted-foreground">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse bg-muted', className)}
    />
  )
}

/** Primary figure of a block: large, tabular, with an optional caption below. */
function Figure({
  value,
  caption,
  loading,
  size = 'lg',
}: {
  value: React.ReactNode
  caption?: React.ReactNode
  loading: boolean
  size?: 'lg' | 'md'
}) {
  if (loading) {
    return (
      <div>
        <Skeleton className={size === 'lg' ? 'h-9 w-40' : 'h-7 w-28'} />
        {caption !== undefined && <Skeleton className="mt-2 h-4 w-24" />}
      </div>
    )
  }
  return (
    <div>
      <p
        className={cn(
          'font-mono font-semibold tabular-nums tracking-tight text-foreground',
          size === 'lg' ? 'text-3xl' : 'text-2xl'
        )}
      >
        {value}
      </p>
      {caption && (
        <p className="mt-1.5 text-sm text-muted-foreground">{caption}</p>
      )}
    </div>
  )
}

/** Secondary fact: label above a smaller value. */
function Fact({
  label,
  value,
  loading,
}: {
  label: string
  value: React.ReactNode
  loading: boolean
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-base tabular-nums text-fg-2">
        {loading ? <Skeleton className="h-5 w-20" /> : value}
      </dd>
    </div>
  )
}

function Bar({
  value,
  tone = 'gold',
  label,
}: {
  value: number
  tone?: 'gold' | 'warning' | 'danger'
  label: string
}) {
  const pct = Math.max(0, Math.min(value, 100))
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(pct)}
      className="h-1.5 overflow-hidden bg-muted"
      role="progressbar"
    >
      <div
        className={cn(
          'h-full w-full origin-left scale-x-(--bar-scale) transition-transform duration-300 ease-out',
          tone === 'gold' && 'bg-gold',
          tone === 'warning' && 'bg-warning',
          tone === 'danger' && 'bg-danger'
        )}
        style={{ '--bar-scale': pct / 100 } as React.CSSProperties}
      />
    </div>
  )
}

function Change({ value, locale }: { value: number; locale: string }) {
  const up = value >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono tabular-nums',
        up ? 'text-verified' : 'text-danger'
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      <span className="sr-only">{up ? 'Up' : 'Down'}</span>
      {formatPercent(Math.abs(value), locale, 2)}
    </span>
  )
}

// =============================================================================
// BLOCKS
// =============================================================================

function PriceBlock({
  data,
  loading,
  locale,
}: {
  data: NetworkData | null
  loading: boolean
  locale: string
}) {
  return (
    <Panel
      aside="CoinGecko"
      className="md:col-span-6 lg:col-span-3"
      title="Price"
    >
      <Figure
        caption={
          data ? (
            <>
              <Change locale={locale} value={data.price.change_24h} /> in 24 h
            </>
          ) : undefined
        }
        loading={loading && !data}
        value={data ? formatUsd(data.price.usd, locale) : EMPTY}
      />
      <p className="mt-auto pt-4 text-sm text-muted-foreground">
        Market cap{' '}
        <span className="font-mono tabular-nums text-fg-2">
          {data ? formatUsdCompact(data.price.market_cap, locale) : EMPTY}
        </span>
        {' · '}
        Volume{' '}
        <span className="font-mono tabular-nums text-fg-2">
          {data ? formatUsdCompact(data.price.volume_24h, locale) : EMPTY}
        </span>
      </p>
    </Panel>
  )
}

function healthOf(quality: number) {
  if (quality > 95)
    return { label: 'Healthy', tone: 'gold' as const, text: 'text-gold' }
  if (quality > 90)
    return { label: 'Degraded', tone: 'warning' as const, text: 'text-warning' }
  return { label: 'Critical', tone: 'danger' as const, text: 'text-danger' }
}

function TickQualityBlock({
  data,
  loading,
  locale,
}: {
  data: NetworkData | null
  loading: boolean
  locale: string
}) {
  const quality = data?.network.tick_quality ?? 0
  const health = healthOf(quality)
  return (
    <Panel className="md:col-span-6 lg:col-span-3" title="Tick quality">
      <Figure
        caption={
          data ? (
            <span className={cn('font-medium', health.text)}>
              {health.label}
            </span>
          ) : undefined
        }
        loading={loading && !data}
        value={data ? formatPercent(quality, locale, 2) : EMPTY}
      />
      <div className="mt-auto pt-4">
        <Bar
          label="Tick quality"
          tone={health.tone}
          value={data ? quality : 0}
        />
      </div>
    </Panel>
  )
}

function EpochBlock({
  data,
  loading,
  locale,
}: {
  data: NetworkData | null
  loading: boolean
  locale: string
}) {
  const EXPECTED_TICKS_PER_EPOCH = 604_800
  const ticksInEpoch = data?.network.ticks_in_epoch ?? 0
  const progress = Math.min(
    (ticksInEpoch / EXPECTED_TICKS_PER_EPOCH) * 100,
    100
  )
  const remaining = Math.max(EXPECTED_TICKS_PER_EPOCH - ticksInEpoch, 0)
  const hoursRemaining = remaining / 3600
  const eta =
    hoursRemaining > 24
      ? `about ${formatDecimal(hoursRemaining / 24, locale, 1)} days`
      : `about ${formatInt(hoursRemaining, locale)} hours`
  const emptyShare =
    ticksInEpoch > 0
      ? ((data?.network.empty_ticks ?? 0) / ticksInEpoch) * 100
      : 0
  const pending = loading && !data

  return (
    <Panel
      aside={
        data
          ? `Started at tick ${formatInt(data.network.initial_tick, locale)}`
          : undefined
      }
      className="md:col-span-12 lg:col-span-8"
      title="Epoch progress"
    >
      <div className="flex items-end justify-between gap-4">
        <Figure
          caption={
            data
              ? `${formatPercent(progress, locale, 1)} complete, ${eta} left`
              : undefined
          }
          loading={pending}
          value={data ? `Epoch ${data.network.epoch}` : EMPTY}
        />
      </div>
      <div className="mt-5">
        <Bar label="Epoch progress" value={data ? progress : 0} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <Fact
          label="Ticks this epoch"
          loading={pending}
          value={data ? formatInt(ticksInEpoch, locale) : EMPTY}
        />
        <Fact
          label="Ticks remaining"
          loading={pending}
          value={data ? formatInt(remaining, locale) : EMPTY}
        />
        <Fact
          label="Empty ticks"
          loading={pending}
          value={
            data ? (
              <>
                {formatInt(data.network.empty_ticks, locale)}{' '}
                <span className="text-muted-foreground">
                  ({formatPercent(emptyShare, locale, 1)})
                </span>
              </>
            ) : (
              EMPTY
            )
          }
        />
      </dl>
    </Panel>
  )
}

function SupplyBlock({
  data,
  loading,
  locale,
}: {
  data: NetworkData | null
  loading: boolean
  locale: string
}) {
  const supply = Number(data?.network.circulating_supply || 0)
  const burned = Number(data?.network.burned_qus || 0)
  const burnRatio = supply > 0 ? (burned / (supply + burned)) * 100 : 0
  const pending = loading && !data

  return (
    <Panel className="md:col-span-12 lg:col-span-4" title="Supply">
      <Figure
        caption="Circulating QUBIC"
        loading={pending}
        value={data ? formatCompact(supply, locale) : EMPTY}
      />
      <dl className="mt-auto grid grid-cols-2 gap-x-6 gap-y-4 pt-6">
        <Fact
          label="Burned"
          loading={pending}
          value={data ? formatCompact(burned, locale) : EMPTY}
        />
        <Fact
          label="Share burned"
          loading={pending}
          value={data ? formatPercent(burnRatio, locale, 2) : EMPTY}
        />
      </dl>
    </Panel>
  )
}

function MiningEstimate({ price, locale }: { price: number; locale: string }) {
  const inputId = useId()
  const [hashrate, setHashrate] = useState('')
  const [result, setResult] = useState<{
    daily: number
    weekly: number
    monthly: number
  } | null>(null)

  const calculate = useCallback(() => {
    const hr = Number.parseFloat(hashrate)
    if (Number.isNaN(hr) || hr <= 0 || price <= 0) {
      setResult(null)
      return
    }
    const DAILY_EMISSION = 1_000_000_000_000 / 7
    const NETWORK_HASHRATE = 500_000_000
    const dailyUsd = DAILY_EMISSION * (hr / NETWORK_HASHRATE) * price
    setResult({ daily: dailyUsd, weekly: dailyUsd * 7, monthly: dailyUsd * 30 })
  }, [hashrate, price])

  return (
    <Panel className="md:col-span-12 lg:col-span-8" title="Mining estimate">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={e => {
          e.preventDefault()
          calculate()
        }}
      >
        <div className="flex-1">
          <label className="mb-1.5 block text-sm text-fg-2" htmlFor={inputId}>
            Your hashrate in iterations per second
          </label>
          <input
            className="h-10 w-full border border-input bg-background px-3 font-mono text-base tabular-nums text-foreground placeholder:text-muted-foreground focus-visible:border-gold sm:text-sm"
            id={inputId}
            inputMode="decimal"
            min="0"
            onChange={e => setHashrate(e.target.value)}
            placeholder="e.g. 1500"
            type="number"
            value={hashrate}
          />
        </div>
        <button
          className="h-10 border border-gold/50 px-4 text-sm font-medium text-gold transition-colors duration-150 ease-out hover:border-gold hover:bg-gold/10"
          type="submit"
        >
          Estimate
        </button>
      </form>

      {result ? (
        <dl className="mt-6 grid grid-cols-3 gap-x-6">
          <div>
            <dt className="text-sm text-muted-foreground">Per day</dt>
            <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {formatUsd(result.daily, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Per week</dt>
            <dd className="mt-1 font-mono text-base tabular-nums text-fg-2">
              {formatUsd(result.weekly, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Per month</dt>
            <dd className="mt-1 font-mono text-base tabular-nums text-fg-2">
              {formatUsd(result.monthly, locale)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Enter a hashrate to see a rough daily, weekly and monthly figure at
          the current price.
        </p>
      )}

      <p className="mt-auto pt-5 text-sm text-muted-foreground">
        A rough estimate based on fixed network assumptions that may be
        outdated. Actual rewards depend on network hashrate, pool fees and the
        price.
      </p>
    </Panel>
  )
}

const LINKS = [
  {
    label: 'Qubic Explorer',
    url: 'https://explorer.qubic.org',
    host: 'explorer.qubic.org',
  },
  {
    label: 'Qubic.li stats',
    url: 'https://app.qubic.li',
    host: 'app.qubic.li',
  },
  {
    label: 'Official wallet',
    url: 'https://wallet.qubic.org',
    host: 'wallet.qubic.org',
  },
  {
    label: 'CoinGecko',
    url: 'https://www.coingecko.com/en/coins/qubic-network',
    host: 'coingecko.com',
  },
]

function ExternalLinks() {
  return (
    <Panel className="md:col-span-12 lg:col-span-4" title="External tools">
      <ul className="-mx-2 divide-y divide-border">
        {LINKS.map(link => (
          <li key={link.url}>
            <a
              className="group flex min-h-11 items-center justify-between gap-3 px-2 py-2 transition-colors duration-150 ease-out hover:bg-accent"
              href={link.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>
                <span className="block text-sm font-medium text-foreground">
                  {link.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {link.host}
                </span>
              </span>
              <ExternalLink
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-colors group-hover:text-gold"
              />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Watchlist({ locale }: { locale: string }) {
  const inputId = useId()
  const [addresses, setAddresses] = useState<WatchedAddress[]>([])
  const [newAddress, setNewAddress] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('qubic-watchlist')
      if (saved) setAddresses(JSON.parse(saved))
    } catch {
      /* storage unavailable or corrupt: start empty */
    }
  }, [])

  useEffect(() => {
    try {
      if (addresses.length > 0) {
        localStorage.setItem('qubic-watchlist', JSON.stringify(addresses))
      } else {
        localStorage.removeItem('qubic-watchlist')
      }
    } catch {
      /* storage unavailable: the list lives for this visit only */
    }
  }, [addresses])

  const addAddress = async () => {
    if (!newAddress.trim() || newAddress.length < 50) return
    const addr = newAddress.trim().toUpperCase()
    if (addresses.some(a => a.address === addr)) return

    setIsAdding(true)
    let balance = EMPTY
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(`https://rpc.qubic.org/v1/balances/${addr}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeout)
      const json = await res.json()
      balance = String(json?.balance?.balance ?? '0')
    } catch {
      // Still add with unknown balance
    }
    setAddresses(prev => [
      ...prev,
      {
        address: addr,
        label: `Wallet ${prev.length + 1}`,
        balance,
        lastUpdate: Date.now(),
      },
    ])
    setNewAddress('')
    setIsAdding(false)
  }

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    setCopied(addr)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Panel
      aside={`${addresses.length} tracked, stored in this browser`}
      className="md:col-span-12"
      title="Address watchlist"
    >
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={e => {
          e.preventDefault()
          addAddress()
        }}
      >
        <div className="flex-1">
          <label className="mb-1.5 block text-sm text-fg-2" htmlFor={inputId}>
            Qubic address (60 characters)
          </label>
          <input
            autoComplete="off"
            className="h-10 w-full border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus-visible:border-gold sm:text-sm"
            id={inputId}
            onChange={e => setNewAddress(e.target.value.toUpperCase())}
            placeholder="BDRFCOFWHRTEH..."
            spellCheck={false}
            value={newAddress}
          />
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 border border-gold/50 px-4 text-sm font-medium text-gold transition-colors duration-150 ease-out hover:border-gold hover:bg-gold/10 disabled:opacity-60"
          disabled={isAdding}
          type="submit"
        >
          <Plus aria-hidden="true" className="size-4" />
          {isAdding ? 'Adding' : 'Add'}
        </button>
      </form>

      {addresses.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No addresses yet. Add one to see its balance here on every visit.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {addresses.map(addr => (
            <li className="flex items-center gap-3 py-2" key={addr.address}>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-fg-2">{addr.label}</p>
                <code
                  className="block truncate font-mono text-xs text-muted-foreground"
                  title={addr.address}
                >
                  {addr.address}
                </code>
              </div>
              <p className="shrink-0 font-mono text-sm tabular-nums text-foreground">
                {addr.balance === EMPTY
                  ? EMPTY
                  : `${formatInt(Number(addr.balance), locale)} QU`}
              </p>
              <button
                aria-label={`Copy address of ${addr.label}`}
                className="inline-flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => copyAddress(addr.address)}
                type="button"
              >
                {copied === addr.address ? (
                  <Check aria-hidden="true" className="size-4 text-gold" />
                ) : (
                  <Copy aria-hidden="true" className="size-4" />
                )}
              </button>
              <button
                aria-label={`Remove ${addr.label}`}
                className="inline-flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-danger"
                onClick={() =>
                  setAddresses(p => p.filter(a => a.address !== addr.address))
                }
                type="button"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

// =============================================================================
// PAGE
// =============================================================================

export default function MonitoringPage() {
  const locale = useLocale()
  const { data, loading, error, updatedAt, refresh } = useMarketData(locale)
  const pending = loading && !data

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        eyebrow="Live network"
        lede="Price, ticks, epoch progress and supply of the Qubic network, refreshed every 30 seconds."
        title="Network monitor"
      >
        <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-2 text-fg-2">
            <span
              aria-hidden="true"
              className={cn(
                'size-2 rounded-full',
                error ? 'bg-danger' : 'bg-verified'
              )}
            />
            {error ? 'Update failed' : 'Live'}
          </span>
          {updatedAt && (
            <span className="text-muted-foreground tabular-nums">
              Updated {updatedAt}
            </span>
          )}
          <button
            className="inline-flex h-10 items-center gap-2 px-2 font-medium text-gold transition-colors hover:text-gold-strong disabled:opacity-60"
            disabled={loading}
            onClick={refresh}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-4', loading && 'animate-spin')}
            />
            Refresh
          </button>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {error && (
          <div
            className="mb-4 flex flex-col gap-3 border border-danger/40 bg-danger/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="text-fg-2">
              <span className="font-medium text-danger">
                Could not load network data.
              </span>{' '}
              {data ? 'Showing the last successful update.' : error}
            </p>
            <button
              className="self-start font-medium text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold sm:self-auto"
              onClick={refresh}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {/* One 12-column hairline grid for every block on the page */}
        <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-12">
          <PriceBlock data={data} loading={loading} locale={locale} />

          <Panel className="md:col-span-6 lg:col-span-3" title="Current tick">
            <Figure
              caption={data ? `Epoch ${data.network.epoch}` : undefined}
              loading={pending}
              value={data ? formatInt(data.network.tick, locale) : EMPTY}
            />
          </Panel>

          <TickQualityBlock data={data} loading={loading} locale={locale} />

          <Panel
            className="md:col-span-6 lg:col-span-3"
            title="Active addresses"
          >
            <Figure
              loading={pending}
              value={
                data ? formatInt(data.network.active_addresses, locale) : EMPTY
              }
            />
          </Panel>

          <EpochBlock data={data} loading={loading} locale={locale} />
          <SupplyBlock data={data} loading={loading} locale={locale} />

          <MiningEstimate locale={locale} price={data?.price.usd ?? 0} />
          <ExternalLinks />

          <Watchlist locale={locale} />
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Sources: CoinGecko for price data, Qubic RPC for network data.
        </p>
      </div>
    </div>
  )
}
