'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

// ── Design tokens: site roles from globals.css ──
const GOLD = 'var(--accent-gold)'
const BG = '#000000'
const CARD_BG = 'var(--card)'
const BORDER = 'var(--border)'
const MUTED = 'var(--muted-foreground)'
const FG2 = 'var(--fg-2)'

const TIER_COLORS: Record<string, string> = {
  legendary: '#A855F7',
  rare: '#3B82F6',
  uncommon: '#22C55E',
  common: 'var(--muted-foreground)',
}

const TIER_INFO = [
  { tier: 'rare', label: 'Rare', threshold: '5\u20138%' },
  { tier: 'uncommon', label: 'Uncommon', threshold: '8\u201312%' },
  { tier: 'common', label: 'Common', threshold: '>12%' },
]

const TRAIT_ABBREV: Record<string, string> = {
  background: 'BG',
  headwear: 'HW',
  accessories: 'ACC',
  clothing: 'CLO',
  hand: 'HAND',
}

// ── Types ──
interface Trait {
  value: string
  count: number
  percent: number
  tier: string
  score_contribution: number
}

interface Token {
  token_id: number
  rarity_score: number
  rank: number
  traits: Record<string, Trait>
}

interface RarityData {
  collection: string
  total_tokens: number
  score_method: string
  tier_thresholds: Record<string, string>
  stats: { max_score: number; min_score: number; mean_score: number }
  tokens: Token[]
}

type FilterType = 'all' | 'top10' | 'rare' | 'uncommon'

// ── Helpers ──
function getImageSrc(tokenId: number): string {
  return `/images/nfts-rarity/anna-${String(tokenId).padStart(3, '0')}.webp`
}

function getHighestTierColor(traits: Record<string, Trait>): string {
  const tiers = Object.values(traits).map(t => t.tier)
  if (tiers.includes('legendary')) return TIER_COLORS.legendary as string
  if (tiers.includes('rare')) return TIER_COLORS.rare as string
  if (tiers.includes('uncommon')) return TIER_COLORS.uncommon as string
  return 'var(--border)'
}

function getTraitColor(tier: string): string {
  return TIER_COLORS[tier] ?? MUTED
}

// ── Filter Logic ──
function matchesFilter(token: Token, filter: FilterType): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'top10':
      return token.rank <= 10
    case 'rare':
      return Object.values(token.traits).some(t => t.tier === 'rare')
    case 'uncommon':
      return Object.values(token.traits).some(t => t.tier !== 'common')
  }
}

// ── Token Card ──
function TokenCard({ token, onClick }: { token: Token; onClick: () => void }) {
  const stripeColor = getHighestTierColor(token.traits)

  return (
    <button
      aria-label={`Token #${token.token_id}, rank ${token.rank}, score ${token.rarity_score.toFixed(2)}`}
      className="relative block w-full bg-card text-left transition-colors duration-150 hover:bg-surface-2"
      onClick={onClick}
      type="button"
    >
      {/* Tier stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: stripeColor }}
      />

      {/* Image */}
      <div className="relative aspect-square">
        <Image
          alt={`Anna #${token.token_id}`}
          className="object-cover"
          fill
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          src={getImageSrc(token.token_id)}
        />
        {/* Rank badge */}
        <div
          className="absolute top-0 left-[3px] px-1.5 py-0.5 font-mono"
          style={{ backgroundColor: BG, fontSize: '12px', color: FG2 }}
        >
          RANK {token.rank}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 pl-4 font-mono">
        {/* Token label */}
        <div
          className="uppercase"
          style={{ fontSize: '12px', color: MUTED, letterSpacing: '0.1em' }}
        >
          TOKEN #{token.token_id}
        </div>

        {/* Score */}
        <div className="flex items-baseline gap-1.5 mt-1 mb-2">
          <span className="font-bold" style={{ fontSize: '18px', color: GOLD }}>
            {token.rarity_score.toFixed(2)}
          </span>
          <span style={{ fontSize: '12px', color: MUTED }}>score</span>
        </div>

        {/* Trait list */}
        <div className="space-y-0">
          {Object.entries(token.traits).map(([layer, trait]) => {
            const color =
              trait.tier === 'common' ? undefined : getTraitColor(trait.tier)
            return (
              <div
                className="flex justify-between items-center py-0.5"
                key={layer}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: color ?? MUTED }}>
                  {TRAIT_ABBREV[layer]}
                </span>
                <span style={{ color: color ?? MUTED }}>{trait.value}</span>
              </div>
            )
          })}
        </div>
      </div>
    </button>
  )
}

// ── Token Detail Modal ──
function TokenModal({ token, onClose }: { token: Token; onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      aria-label={`Token #${token.token_id} details`}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
    >
      {/* Backdrop: clicking outside the panel closes it (Escape also works) */}
      <button
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <div
        className="relative w-full max-w-2xl overflow-hidden font-mono max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <span
            className="uppercase"
            style={{
              color: GOLD,
              fontSize: '12px',
              letterSpacing: '0.1em',
            }}
          >
            TOKEN #{token.token_id} · RANK {token.rank}
          </span>
          <button
            aria-label="Close modal"
            className="p-2 transition-colors hover:text-foreground"
            onClick={onClose}
            style={{ color: MUTED }}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-2">
          {/* Left: Image */}
          <div className="relative aspect-square">
            <Image
              alt={`Anna #${token.token_id}`}
              className="object-cover"
              fill
              priority
              sizes="50vw"
              src={getImageSrc(token.token_id)}
            />
          </div>

          {/* Right: Details */}
          <div className="p-5 space-y-5">
            {/* Rank + Score */}
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color: MUTED,
                  letterSpacing: '0.05em',
                }}
              >
                RARITY RANK {token.rank} / 200
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className="font-bold"
                  style={{ fontSize: '32px', color: GOLD }}
                >
                  {token.rarity_score.toFixed(2)}
                </span>
              </div>
              <div
                className="uppercase"
                style={{
                  fontSize: '12px',
                  color: MUTED,
                  letterSpacing: '0.05em',
                  marginTop: '2px',
                }}
              >
                RARITY SCORE
              </div>
            </div>

            {/* Trait breakdown */}
            <div className="space-y-0">
              {Object.entries(token.traits).map(([layer, trait]) => {
                const color =
                  trait.tier === 'common' ? MUTED : getTraitColor(trait.tier)
                return (
                  <div
                    className="flex items-center justify-between py-2"
                    key={layer}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <span
                      className="uppercase"
                      style={{
                        fontSize: '12px',
                        color: MUTED,
                        letterSpacing: '0.05em',
                        minWidth: '110px',
                      }}
                    >
                      {layer}
                    </span>
                    <div className="flex items-center gap-3 text-right">
                      <span style={{ fontSize: '12px', color }}>
                        {trait.value}
                      </span>
                      <span style={{ fontSize: '12px', color: MUTED }}>
                        {trait.percent.toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '12px', color: MUTED }}>
                        +{trait.score_contribution.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Score formula note */}
            <div
              className="pt-3"
              style={{
                fontSize: '12px',
                color: MUTED,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              Score = sum of 1/frequency for each trait. Higher = rarer
              combination.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──
export default function RarityCodexPage() {
  const [data, setData] = useState<RarityData | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)

  // Load JSON once
  useEffect(() => {
    fetch('/data/anna-rarity.json')
      .then(res => res.json())
      .then((json: RarityData) => setData(json))
      .catch(() => {})
  }, [])

  // Filter + search
  const filteredTokens = useMemo(() => {
    if (!data) return []
    const query = search.replace('#', '').trim()
    return data.tokens.filter(token => {
      if (!matchesFilter(token, filter)) return false
      if (query && !String(token.token_id).includes(query)) return false
      return true
    })
  }, [data, filter, search])

  const FILTER_BUTTONS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'ALL' },
    { key: 'top10', label: 'TOP 10' },
    { key: 'rare', label: 'HAS RARE' },
    { key: 'uncommon', label: 'HAS UNCOMMON' },
  ]

  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-mono"
        style={{ backgroundColor: BG, color: MUTED }}
      >
        Loading rarity data…
      </div>
    )
  }

  return (
    <div className="min-h-screen font-mono" style={{ backgroundColor: BG }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* ── Section Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <div
              className="uppercase"
              style={{
                fontSize: '12px',
                letterSpacing: '0.1em',
                color: MUTED,
                marginBottom: '8px',
              }}
            >
              Anna Aigarth Collection
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold uppercase leading-tight">
              <span style={{ color: 'var(--foreground)' }}>Rarity</span>
              <br />
              <span style={{ color: GOLD }}>Codex</span>
            </h1>
            <div
              className="mt-3 uppercase"
              style={{ fontSize: '12px', color: MUTED }}
            >
              200 TOKENS · 5 TRAIT LAYERS · RANKED BY EMERGENCE
            </div>
          </div>

          {/* Stat boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: data.total_tokens, label: 'TOKENS' },
              { value: data.stats.max_score.toFixed(2), label: 'MAX SCORE' },
              { value: data.stats.mean_score.toFixed(2), label: 'AVG SCORE' },
              { value: data.stats.min_score.toFixed(2), label: 'MIN SCORE' },
            ].map(stat => (
              <div className="text-right sm:text-right" key={stat.label}>
                <div
                  className="font-bold text-xl tabular-nums sm:text-3xl"
                  style={{ color: GOLD }}
                >
                  {stat.value}
                </div>
                <div
                  className="uppercase"
                  style={{
                    fontSize: '12px',
                    color: MUTED,
                    letterSpacing: '0.1em',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tier Legend Bar ── */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 py-3 mb-6"
          style={{
            borderTop: `1px solid ${BORDER}`,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div className="flex flex-wrap items-center gap-5">
            {TIER_INFO.map(({ tier, label, threshold }) => (
              <div className="flex items-center gap-2" key={tier}>
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: TIER_COLORS[tier] }}
                />
                <span style={{ fontSize: '12px', color: TIER_COLORS[tier] }}>
                  {label}
                </span>
                <span style={{ fontSize: '12px', color: MUTED }}>
                  {threshold}
                </span>
              </div>
            ))}
          </div>
          <div className="italic" style={{ fontSize: '12px', color: MUTED }}>
            score = &#931; 1/frequency
          </div>
        </div>

        {/* ── Filter Controls ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {FILTER_BUTTONS.map(btn => (
              <button
                aria-pressed={filter === btn.key}
                className="h-10 px-4 text-xs uppercase tracking-wider transition-colors"
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                style={{
                  border: `1px solid ${filter === btn.key ? GOLD : 'var(--border)'}`,
                  color: filter === btn.key ? GOLD : FG2,
                  backgroundColor: 'transparent',
                }}
                type="button"
              >
                {btn.label}
              </button>
            ))}
          </div>
          <input
            aria-label="Search by token number"
            className="w-full sm:w-48 px-3 py-2 text-xs uppercase tracking-wider bg-transparent outline-none transition-colors placeholder:text-muted-foreground"
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH TOKEN #..."
            style={{
              border: '1px solid var(--input)',
              color: 'var(--foreground)',
            }}
            type="text"
            value={search}
          />
        </div>

        {/* Result count */}
        <div className="mb-4" style={{ fontSize: '12px', color: MUTED }}>
          {filteredTokens.length} / {data.total_tokens} tokens
        </div>

        {/* ── Token Grid ── */}
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            backgroundColor: 'var(--border)',
          }}
        >
          {filteredTokens.map(token => (
            <TokenCard
              key={token.token_id}
              onClick={() => setSelectedToken(token)}
              token={token}
            />
          ))}
        </div>

        {filteredTokens.length === 0 && (
          <div
            className="text-center py-20 uppercase"
            style={{ color: MUTED, fontSize: '12px', letterSpacing: '0.1em' }}
          >
            No tokens match your criteria
          </div>
        )}
      </div>

      {/* ── Token Detail Modal ── */}
      {selectedToken && (
        <TokenModal
          onClose={() => setSelectedToken(null)}
          token={selectedToken}
        />
      )}
    </div>
  )
}
