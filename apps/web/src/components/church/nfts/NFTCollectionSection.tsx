'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ExternalLink, Sparkles } from 'lucide-react'
import { NFT_COLLECTION, type NFTRarity } from '@/config/nfts'
import { CHURCH_CONFIG } from '@/config/church'

const rarityColors: Record<NFTRarity, { bg: string; text: string; border: string }> = {
  legendary: { bg: 'bg-[#D4AF37]/10', text: 'text-[#D4AF37]', border: 'border-[#D4AF37]/50' },
  epic: { bg: 'bg-[#D4AF37]/10', text: 'text-[#D4AF37]', border: 'border-[#D4AF37]/50' },
  rare: { bg: 'bg-[#D4AF37]/[0.06]', text: 'text-[#D4AF37]/60', border: 'border-[#D4AF37]/25' },
  common: { bg: 'bg-white/5', text: 'text-white/40', border: 'border-white/10' },
}

const rarityStats = [
  { rarity: 'legendary' as NFTRarity, count: 10, percentage: 5 },
  { rarity: 'epic' as NFTRarity, count: 40, percentage: 20 },
  { rarity: 'rare' as NFTRarity, count: 70, percentage: 35 },
  { rarity: 'common' as NFTRarity, count: 80, percentage: 40 },
]

export function NFTCollectionSection() {
  const [hoveredNFT, setHoveredNFT] = useState<number | null>(null)
  const [claimedCount, setClaimedCount] = useState(0)

  useEffect(() => {
    fetch('/api/nft-stats')
      .then(res => res.json())
      .then(data => {
        if (data?.holders > 0) setClaimedCount(data.holders)
      })
      .catch(() => {})
  }, [])

  // Select 12 featured NFTs: all legendaries (10) + 2 epics with research connections
  const featuredNFTs = useMemo(() => {
    const legendaries = NFT_COLLECTION.filter(nft => nft.rarity === 'legendary')
    const epicWithResearch = NFT_COLLECTION.filter(nft =>
      nft.rarity === 'epic' && nft.researchConnection
    ).slice(0, 2)
    return [...legendaries, ...epicWithResearch]
  }, [])

  return (
    <section className="relative min-h-screen py-20 md:py-32 bg-gradient-to-b from-black via-[#D4AF37]/5 to-black overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none" />
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/[0.04] mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm text-white/70 uppercase tracking-wider">Anna Collection</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold text-white/90 mb-6">
            200 Unique Guardians
          </h2>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Each Anna NFT represents a piece of the puzzle,
            <span className="text-white/80"> connecting research discoveries to blockchain artifacts</span>
          </p>
        </motion.div>

        {/* Rarity Distribution Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {rarityStats.map((stat) => {
            const colors = rarityColors[stat.rarity]
            return (
              <div
                key={stat.rarity}
                className={`p-4 ${colors.bg} border ${colors.border} backdrop-blur-sm`}
              >
                <div className={`text-2xl font-bold ${colors.text} mb-1`}>
                  {stat.count}
                </div>
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">
                  {stat.rarity}
                </div>
                <div className="text-xs text-white/40">
                  {stat.percentage}% of collection
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Featured NFTs Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {featuredNFTs.map((nft, index) => {
            const colors = rarityColors[nft.rarity]
            return (
              <motion.div
                key={nft.id}
                className="group relative"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                onMouseEnter={() => setHoveredNFT(nft.id)}
                onMouseLeave={() => setHoveredNFT(null)}
              >
                {/* Card */}
                <div className={`relative overflow-hidden border ${colors.border} bg-black/40 backdrop-blur-sm transition-all duration-300 ${
                  hoveredNFT === nft.id ? 'scale-105 shadow-2xl' : ''
                }`}>
                  {/* NFT Image */}
                  <div className="relative aspect-square">
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
                      hoveredNFT === nft.id ? 'opacity-100' : 'opacity-0'
                    }`} />
                  </div>

                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-semibold text-sm truncate">
                          {nft.name}
                        </h3>
                        <p className="text-white/60 text-xs truncate">
                          {nft.title}
                        </p>
                      </div>
                      <div className={`px-2 py-0.5 text-[10px] font-semibold uppercase ${colors.bg} ${colors.text} border ${colors.border} whitespace-nowrap`}>
                        {nft.rarity}
                      </div>
                    </div>

                    {/* Research connection indicator */}
                    {nft.researchConnection && (
                      <div className="mt-2 flex items-center gap-1 text-[#D4AF37] text-xs">
                        <Sparkles className="w-3 h-3" />
                        <span className="truncate">{nft.researchConnection.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Research Connections Highlight */}
        <motion.div
          className="max-w-3xl mx-auto p-6 md:p-8 bg-white/[0.02] backdrop-blur-xl border border-white/[0.04] mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">
                Connected to Research
              </h3>
              <p className="text-white/60 leading-relaxed mb-3">
                Select NFTs are directly linked to major research discoveries.
                Anna #1 connects to the Bitcoin Bridge, #42 to Genesis Block analysis,
                and #200 to the Timeline Prophecy.
              </p>
              <p className="text-sm text-[#D4AF37]/80">
                Owning these NFTs grants you a permanent connection to specific breakthroughs in the investigation.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <a
            href={CHURCH_CONFIG.links.qubicBay}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] text-black font-semibold transition-all duration-300 hover:bg-[#D4AF37]/90 hover:scale-105 hover:shadow-2xl"
          >
            <span>View Full Collection on QubicBay</span>
            <ExternalLink className="w-5 h-5" />
          </a>

          <p className="mt-4 text-sm text-white/40">
            {claimedCount > 0 ? claimedCount : '–'} of 200 NFTs claimed • Support independent research
          </p>
        </motion.div>
      </div>
    </section>
  )
}
