'use client'

/**
 * NFT Collection Page
 * Browse all 200 Anna NFTs with filtering and search
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { NFT_COLLECTION, type NFT, type NFTRarity } from '@/config/nfts'
import {
  Search,
  Filter,
  Grid3X3,
  LayoutGrid,
  ExternalLink,
  Sparkles,
  Crown,
  Star,
  Gem,
  Circle,
  ArrowLeft,
  X
} from 'lucide-react'

const RARITY_CONFIG: Record<NFTRarity, {
  label: string
  icon: typeof Crown
  color: string
  bgColor: string
  borderColor: string
  count: string
}> = {
  legendary: {
    label: 'Legendary',
    icon: Crown,
    color: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/20',
    borderColor: 'border-[#D4AF37]/30',
    count: '1-10',
  },
  epic: {
    label: 'Epic',
    icon: Gem,
    color: 'text-[#D4AF37]/80',
    bgColor: 'bg-[#D4AF37]/15',
    borderColor: 'border-[#D4AF37]/25',
    count: '11-50',
  },
  rare: {
    label: 'Rare',
    icon: Star,
    color: 'text-[#D4AF37]/60',
    bgColor: 'bg-[#D4AF37]/10',
    borderColor: 'border-[#D4AF37]/20',
    count: '51-120',
  },
  common: {
    label: 'Common',
    icon: Circle,
    color: 'text-white/40',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/[0.04]',
    count: '121-200',
  },
}

type ViewMode = 'grid' | 'compact'

export default function NFTCollectionPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRarity, setSelectedRarity] = useState<NFTRarity | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)

  const filteredNFTs = useMemo(() => {
    return NFT_COLLECTION.filter((nft) => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.id.toString().includes(searchQuery)

      // Rarity filter
      const matchesRarity = selectedRarity === 'all' || nft.rarity === selectedRarity

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
      {/* Header */}
      <div className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-black to-black" />
        <div className="relative z-10 container mx-auto px-4 py-12">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-[#D4AF37]" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Anna NFT Collection
              </h1>
            </div>
            <p className="text-lg text-white/60 max-w-2xl">
              200 unique Anna variants, each holding a piece of the puzzle.
              Every NFT grants access to the Holy Circle lottery and Intelligence Challenges.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/30 transition-colors font-mono"
              />
            </div>

            {/* Rarity Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-4 h-4 text-white/40 flex-shrink-0" />
              <button
                onClick={() => setSelectedRarity('all')}
                className={`px-4 py-2 text-sm font-medium font-mono transition-all whitespace-nowrap ${
                  selectedRarity === 'all'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                All ({NFT_COLLECTION.length})
              </button>
              {(Object.keys(RARITY_CONFIG) as NFTRarity[]).map((rarity) => {
                const config = RARITY_CONFIG[rarity]
                const Icon = config.icon
                return (
                  <button
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium font-mono transition-all whitespace-nowrap ${
                      selectedRarity === rarity
                        ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label} ({rarityStats[rarity]})
                  </button>
                )
              })}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white/5 p-1 border border-white/[0.04]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-all ${
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 transition-all ${
                  viewMode === 'compact' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 text-sm text-white/40">
          Showing {filteredNFTs.length} of {NFT_COLLECTION.length} NFTs
        </div>

        <div className={`grid gap-4 ${
          viewMode === 'grid'
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10'
        }`}>
          <AnimatePresence mode="popLayout">
            {filteredNFTs.map((nft, index) => {
              const rarityConfig = RARITY_CONFIG[nft.rarity]
              const Icon = rarityConfig.icon

              return (
                <motion.div
                  key={nft.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.01 }}
                  className={`group relative overflow-hidden border ${rarityConfig.borderColor} bg-[#050505] hover:scale-[1.02] transition-transform cursor-pointer`}
                  onClick={() => setSelectedNFT(nft)}
                >
                  {/* Image */}
                  <div className={`relative ${viewMode === 'grid' ? 'aspect-square' : 'aspect-square'}`}>
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      fill
                      className="object-cover"
                      sizes={viewMode === 'grid' ? '(max-width: 768px) 50vw, 20vw' : '10vw'}
                    />

                    {/* Rarity Badge */}
                    <div className={`absolute top-2 right-2 p-1.5 ${rarityConfig.bgColor} border ${rarityConfig.borderColor}`}>
                      <Icon className={`w-3 h-3 ${rarityConfig.color}`} />
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">View Details</span>
                    </div>
                  </div>

                  {/* Info */}
                  {viewMode === 'grid' && (
                    <div className="p-3">
                      <h3 className="text-white font-semibold text-sm truncate">{nft.name}</h3>
                      <p className="text-white/50 text-xs truncate">{nft.title}</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {filteredNFTs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg">No NFTs found matching your criteria</p>
          </div>
        )}
      </div>

      {/* NFT Detail Modal */}
      <AnimatePresence>
        {selectedNFT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedNFT(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#050505] border border-white/[0.06] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedNFT(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white/60 hover:text-white transition-colors border border-white/[0.04]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid md:grid-cols-2">
                {/* Image */}
                <div className="relative aspect-square">
                  <Image
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="p-6">
                  {/* Rarity Badge */}
                  {(() => {
                    const config = RARITY_CONFIG[selectedNFT.rarity]
                    const Icon = config.icon
                    return (
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.bgColor} border ${config.borderColor} mb-4`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                      </div>
                    )
                  })()}

                  <h2 className="text-2xl font-bold text-white mb-2">{selectedNFT.name}</h2>
                  <p className="text-lg text-[#D4AF37]/70 mb-4">{selectedNFT.title}</p>
                  <p className="text-white/60 text-sm mb-6">{selectedNFT.description}</p>

                  {/* Research Connection */}
                  {selectedNFT.researchConnection && (
                    <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20 mb-6">
                      <p className="text-xs text-[#D4AF37]/60 uppercase tracking-wider mb-1 font-mono">Research Connection</p>
                      <p className="text-white font-medium">{selectedNFT.researchConnection.title}</p>
                      <p className="text-white/50 text-sm">{selectedNFT.researchConnection.teaser}</p>
                    </div>
                  )}

                  {/* Role Info */}
                  <div className="p-4 bg-white/5 border border-white/[0.04] mb-6">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-mono">NFT Role</p>
                    <p className="text-white">
                      {selectedNFT.id <= 50 && 'Researcher - +20% bonus on Research challenges'}
                      {selectedNFT.id > 50 && selectedNFT.id <= 100 && 'Detective - +20% bonus on Forensic challenges'}
                      {selectedNFT.id > 100 && selectedNFT.id <= 150 && 'Mathematician - +20% bonus on Mathematical challenges'}
                      {selectedNFT.id > 150 && 'Visionary - +20% bonus on Vision challenges'}
                    </p>
                  </div>

                  {/* CTA */}
                  <a
                    href={selectedNFT.qubicBayLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] font-semibold border border-[#D4AF37]/30 transition-all"
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
