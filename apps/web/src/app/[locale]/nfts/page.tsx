'use client'

/**
 * NFT Collection Page
 * Browse all 200 Anna NFTs with filtering and search
 */

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { PageHeader } from '@/components/ui/page-header'
import { NFT_COLLECTION, type NFT, type NFTRarity } from '@/config/nfts'
import {
  Search,
  Filter,
  Grid3X3,
  LayoutGrid,
  ExternalLink,
  Crown,
  Star,
  Gem,
  Circle,
  X,
} from 'lucide-react'

const RARITY_CONFIG: Record<
  NFTRarity,
  {
    label: string
    icon: typeof Crown
    color: string
    bgColor: string
    borderColor: string
    count: string
  }
> = {
  legendary: {
    label: 'Legendary',
    icon: Crown,
    color: 'text-gold',
    bgColor: 'bg-gold/20',
    borderColor: 'border-gold/30',
    count: '1-10',
  },
  epic: {
    label: 'Epic',
    icon: Gem,
    color: 'text-gold/80',
    bgColor: 'bg-gold/15',
    borderColor: 'border-gold/25',
    count: '11-50',
  },
  rare: {
    label: 'Rare',
    icon: Star,
    color: 'text-gold/80',
    bgColor: 'bg-gold/10',
    borderColor: 'border-gold/20',
    count: '51-120',
  },
  common: {
    label: 'Common',
    icon: Circle,
    color: 'text-muted-foreground',
    bgColor: 'bg-white/5',
    borderColor: 'border-border',
    count: '121-200',
  },
}

type ViewMode = 'grid' | 'compact'

export default function NFTCollectionPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRarity, setSelectedRarity] = useState<NFTRarity | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)

  // Escape closes the detail dialog
  useEffect(() => {
    if (!selectedNFT) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNFT(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedNFT])

  const filteredNFTs = useMemo(() => {
    return NFT_COLLECTION.filter(nft => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.id.toString().includes(searchQuery)

      // Rarity filter
      const matchesRarity =
        selectedRarity === 'all' || nft.rarity === selectedRarity

      return matchesSearch && matchesRarity
    })
  }, [searchQuery, selectedRarity])

  const rarityStats = useMemo(() => {
    return {
      legendary: NFT_COLLECTION.filter(n => n.rarity === 'legendary').length,
      epic: NFT_COLLECTION.filter(n => n.rarity === 'epic').length,
      rare: NFT_COLLECTION.filter(n => n.rarity === 'rare').length,
      common: NFT_COLLECTION.filter(n => n.rarity === 'common').length,
    }
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <PageHeader
        eyebrow="Collection"
        lede="200 unique Anna variants, each holding a piece of the puzzle. Every NFT grants community access and tiered research benefits."
        title="Anna NFT collection"
      />

      {/* Filters */}
      <div className="sticky top-14 z-30 border-y border-border bg-black/85 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
              <input
                aria-label="Search NFTs"
                className="h-11 w-full border border-input bg-background pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-gold sm:text-sm"
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or ID..."
                type="text"
                value={searchQuery}
              />
            </div>

            {/* Rarity Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-4 h-4 text-muted-foreground/70 flex-shrink-0" />
              <button
                aria-pressed={selectedRarity === 'all'}
                className={`h-10 whitespace-nowrap border px-4 text-sm font-medium transition-colors ${
                  selectedRarity === 'all'
                    ? 'border-foreground/40 bg-accent text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setSelectedRarity('all')}
                type="button"
              >
                All ({NFT_COLLECTION.length})
              </button>
              {(Object.keys(RARITY_CONFIG) as NFTRarity[]).map(rarity => {
                const config = RARITY_CONFIG[rarity]
                const Icon = config.icon
                return (
                  <button
                    aria-pressed={selectedRarity === rarity}
                    className={`flex h-10 items-center gap-2 whitespace-nowrap border px-4 text-sm font-medium transition-colors ${
                      selectedRarity === rarity
                        ? `${config.bgColor} ${config.color} ${config.borderColor}`
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    type="button"
                  >
                    <Icon aria-hidden="true" className="w-4 h-4" />
                    {config.label} ({rarityStats[rarity]})
                  </button>
                )
              })}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 border border-border p-1">
              <button
                aria-label="Large tiles"
                aria-pressed={viewMode === 'grid'}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setViewMode('grid')}
                type="button"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                aria-label="Compact tiles"
                aria-pressed={viewMode === 'compact'}
                className={`p-2 transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setViewMode('compact')}
                type="button"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="container py-8">
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredNFTs.length} of {NFT_COLLECTION.length} NFTs
        </div>

        <div
          className={`grid gap-4 ${
            viewMode === 'grid'
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              : 'grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10'
          }`}
        >
          <AnimatePresence mode="popLayout">
            {filteredNFTs.map((nft, index) => {
              const rarityConfig = RARITY_CONFIG[nft.rarity]
              const Icon = rarityConfig.icon

              return (
                <motion.button
                  animate={{ opacity: 1, scale: 1 }}
                  aria-label={`${nft.name}, ${rarityConfig.label}`}
                  className={`group relative block w-full overflow-hidden border text-left ${rarityConfig.borderColor} bg-card transition-colors hover:border-gold/60`}
                  exit={{ opacity: 0, scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  key={nft.id}
                  layout
                  onClick={() => setSelectedNFT(nft)}
                  transition={{ duration: 0.2, delay: index * 0.01 }}
                  type="button"
                >
                  {/* Image */}
                  <div
                    className={`relative ${viewMode === 'grid' ? 'aspect-square' : 'aspect-square'}`}
                  >
                    <Image
                      alt={nft.name}
                      className="object-cover"
                      fill
                      sizes={
                        viewMode === 'grid'
                          ? '(max-width: 768px) 50vw, 20vw'
                          : '10vw'
                      }
                      src={nft.image}
                    />

                    {/* Rarity Badge */}
                    <div
                      className={`absolute top-2 right-2 p-1.5 ${rarityConfig.bgColor} border ${rarityConfig.borderColor}`}
                    >
                      <Icon className={`w-3 h-3 ${rarityConfig.color}`} />
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-foreground text-sm font-medium">
                        View details
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  {viewMode === 'grid' && (
                    <div className="p-3">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {nft.name}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {nft.title}
                      </p>
                    </div>
                  )}
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>

        {filteredNFTs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No NFTs found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* NFT Detail Modal */}
      <AnimatePresence>
        {selectedNFT && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setSelectedNFT(null)}
          >
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              aria-label={selectedNFT.name}
              aria-modal="true"
              className="relative max-h-full w-full max-w-2xl overflow-y-auto border border-border bg-card"
              exit={{ scale: 0.9, opacity: 0 }}
              initial={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              role="dialog"
            >
              {/* Close button */}
              <button
                aria-label="Close"
                className="absolute top-3 right-3 z-10 border border-border bg-black/70 p-2 text-fg-2 transition-colors hover:text-foreground"
                onClick={() => setSelectedNFT(null)}
                type="button"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid md:grid-cols-2">
                {/* Image */}
                <div className="relative aspect-square">
                  <Image
                    alt={selectedNFT.name}
                    className="object-cover"
                    fill
                    src={selectedNFT.image}
                  />
                </div>

                {/* Info */}
                <div className="p-6">
                  {/* Rarity Badge */}
                  {(() => {
                    const config = RARITY_CONFIG[selectedNFT.rarity]
                    const Icon = config.icon
                    return (
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.bgColor} border ${config.borderColor} mb-4`}
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className={`text-sm font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    )
                  })()}

                  <h2 className="mb-2 text-2xl font-semibold text-foreground">
                    {selectedNFT.name}
                  </h2>
                  <p className="mb-4 text-lg text-gold">{selectedNFT.title}</p>
                  <p className="mb-6 text-sm leading-relaxed text-fg-2">
                    {selectedNFT.description}
                  </p>

                  {/* Research Connection */}
                  {selectedNFT.researchConnection && (
                    <div className="mb-6 border border-gold/30 bg-gold/5 p-4">
                      <p className="eyebrow mb-1 text-gold">
                        Research connection
                      </p>
                      <p className="font-medium text-foreground">
                        {selectedNFT.researchConnection.title}
                      </p>
                      <p className="text-sm text-fg-2">
                        {selectedNFT.researchConnection.teaser}
                      </p>
                    </div>
                  )}

                  {/* Role Info */}
                  <div className="mb-6 border border-border p-4">
                    <p className="eyebrow mb-2 text-muted-foreground">
                      NFT role
                    </p>
                    <p className="text-foreground">
                      {selectedNFT.id <= 50 &&
                        'Researcher - +20% bonus on Research challenges'}
                      {selectedNFT.id > 50 &&
                        selectedNFT.id <= 100 &&
                        'Detective - +20% bonus on Forensic challenges'}
                      {selectedNFT.id > 100 &&
                        selectedNFT.id <= 150 &&
                        'Mathematician - +20% bonus on Mathematical challenges'}
                      {selectedNFT.id > 150 &&
                        'Visionary - +20% bonus on Vision challenges'}
                    </p>
                  </div>

                  {/* CTA */}
                  <a
                    className="flex h-11 w-full items-center justify-center gap-2 bg-gold font-medium text-black transition-colors hover:bg-gold-strong"
                    href={selectedNFT.qubicBayLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View on QubicBay
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
