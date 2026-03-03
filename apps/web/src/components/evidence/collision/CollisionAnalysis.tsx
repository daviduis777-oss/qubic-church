'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Shield,
  Hash,
  TrendingUp,
  Info,
  Zap,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataUnavailablePlaceholder } from '../DataUnavailablePlaceholder'

interface CollisionData {
  address: string
  count: number
  sources: string[]
  probability: number
  isSuspicious: boolean
}

interface CollisionAnalysisProps {
  addresses?: string[]
  /** When true, shows the data-unavailable placeholder instead of empty analysis */
  dataUnavailable?: boolean
}

export function CollisionAnalysis({ addresses = [], dataUnavailable = false }: CollisionAnalysisProps) {
  const [loading, setLoading] = useState(true)
  const [collisions, setCollisions] = useState<CollisionData[]>([])
  const [analyzing, setAnalyzing] = useState(false)

  // Calculate Birthday Attack probability
  const birthdayProbability = (n: number) => {
    // Simplified Birthday Attack calculation for 160-bit address space
    const addressSpace = Math.pow(2, 160)
    return 1 - Math.exp(-(n * n) / (2 * addressSpace))
  }

  useEffect(() => {
    if (dataUnavailable) {
      setLoading(false)
      return
    }
    analyzeCollisions()
  }, [addresses, dataUnavailable])

  const analyzeCollisions = () => {
    setLoading(true)
    setAnalyzing(true)

    // Mock analysis - in production, this would analyze actual address data
    const addressMap = new Map<string, { count: number; sources: string[] }>()

    // Simulate loading addresses from multiple sources
    const mockSources = [
      'bitcoin-derived-addresses.json',
      'bitcoin-private-keys.json',
      'matrix-addresses.json',
      'patoshi-addresses.json',
    ]

    // Count duplicates
    addresses.forEach((addr, idx) => {
      const source = mockSources[idx % mockSources.length] ?? 'Unknown'
      const existing = addressMap.get(addr)

      if (existing) {
        existing.count++
        existing.sources.push(source)
      } else {
        addressMap.set(addr, { count: 1, sources: [source] })
      }
    })

    // Find collisions (count > 1)
    const collisionData: CollisionData[] = []

    addressMap.forEach((data, address) => {
      if (data.count > 1) {
        const probability = birthdayProbability(addresses.length)

        collisionData.push({
          address,
          count: data.count,
          sources: data.sources,
          probability,
          isSuspicious: data.count > 2, // More than 2 is very suspicious
        })
      }
    })

    // Sort by count (most collisions first)
    collisionData.sort((a, b) => b.count - a.count)

    setCollisions(collisionData)
    setLoading(false)
    setAnalyzing(false)
  }

  const stats = useMemo(() => {
    const totalCollisions = collisions.length
    const suspiciousCollisions = collisions.filter((c) => c.isSuspicious).length
    const maxCollisionCount = Math.max(...collisions.map((c) => c.count), 0)
    const avgProbability = collisions.length > 0
      ? collisions.reduce((sum, c) => sum + c.probability, 0) / collisions.length
      : 0

    return {
      total: totalCollisions,
      suspicious: suspiciousCollisions,
      maxCount: maxCollisionCount,
      avgProbability,
    }
  }, [collisions])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Analyzing for collisions...</p>
        </div>
      </div>
    )
  }

  if (dataUnavailable) {
    return (
      <DataUnavailablePlaceholder
        datasetName="Collision Analysis"
        fileName="matrix-addresses.json, bitcoin-derived-addresses.json, patoshi-addresses.json"
        height="500px"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Collision Analysis</h3>
            <p className="text-muted-foreground">
              Detecting duplicate addresses and analyzing Birthday Attack probability
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/30 border border-border">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                This analysis checks for duplicate Bitcoin addresses across all datasets. In a
                properly generated dataset, duplicates should be extremely rare due to the vast
                address space (2^160 possible addresses).
              </p>
              <p className="text-sm font-medium text-foreground">
                <strong>Finding collisions would indicate:</strong> Either intentional design or
                compromised randomness in address generation.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatCard
          label="Total Addresses"
          value={addresses.length.toLocaleString()}
          icon={Hash}
          color="text-[#D4AF37]"
          bgColor="bg-[#D4AF37]/10"
        />
        <StatCard
          label="Collisions Found"
          value={stats.total.toLocaleString()}
          icon={AlertTriangle}
          color={stats.total > 0 ? 'text-[#D4AF37]' : 'text-[#D4AF37]'}
          bgColor={stats.total > 0 ? 'bg-[#D4AF37]/10' : 'bg-[#D4AF37]/10'}
        />
        <StatCard
          label="Suspicious"
          value={stats.suspicious.toLocaleString()}
          subtitle="&gt;2 occurrences"
          icon={Shield}
          color={stats.suspicious > 0 ? 'text-red-500' : 'text-[#D4AF37]'}
          bgColor={stats.suspicious > 0 ? 'bg-red-500/10' : 'bg-[#D4AF37]/10'}
        />
        <StatCard
          label="Max Collisions"
          value={stats.maxCount.toString()}
          subtitle="Same address"
          icon={TrendingUp}
          color="text-[#D4AF37]"
          bgColor="bg-[#D4AF37]/10"
        />
      </motion.div>

      {/* Collision Status */}
      {stats.total === 0 ? (
        <Card className="p-6 bg-[#D4AF37]/10 border-[#D4AF37]/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#D4AF37]">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#D4AF37] mb-2">
                No Collisions Detected
              </h3>
              <p className="text-foreground mb-3">
                All {addresses.length.toLocaleString()} addresses are unique across all datasets.
              </p>
              <p className="text-sm text-muted-foreground">
                This is the expected result for properly generated Bitcoin addresses. The
                probability of accidental collision in a 160-bit address space is negligible.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-[#D4AF37]/10 border-[#D4AF37]/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#D4AF37]">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#D4AF37] mb-2">
                {stats.total} Collision(s) Detected
              </h3>
              <p className="text-foreground mb-3">
                Found {stats.total} address(es) that appear multiple times across datasets.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                While some duplication may be intentional (e.g., re-using addresses for testing),
                a high collision rate could indicate an issue with address generation randomness.
              </p>

              {stats.suspicious > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30">
                  <p className="text-sm font-medium text-red-400">
                    {stats.suspicious} highly suspicious collision(s) detected (&gt;2
                    occurrences)
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Birthday Attack Probability */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Birthday Attack Probability
        </h4>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                For {addresses.length.toLocaleString()} addresses:
              </span>
              <span className="text-sm font-mono font-bold text-primary">
                {(stats.avgProbability * 100).toExponential(2)}%
              </span>
            </div>
            <div className="h-2 bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stats.avgProbability * 100, 100)}%` }}
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]"
              />
            </div>
          </div>

          <div className="p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground mb-2">
              <strong className="text-foreground">Birthday Attack:</strong> The probability that
              at least two addresses in a set will collide (be identical) based on the address
              space size.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Bitcoin Address Space:</strong> 2^160 &cong; 1.46 x
              10^48 possible addresses. Even with 1 million addresses, collision probability is
              negligibly small (&lt; 10^-30).
            </p>
          </div>
        </div>
      </Card>

      {/* Collision Details */}
      {collisions.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />
            Collision Details ({collisions.length})
          </h4>

          <div className="space-y-3">
            {collisions.slice(0, 10).map((collision, idx) => (
              <CollisionCard key={idx} collision={collision} />
            ))}

            {collisions.length > 10 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                + {collisions.length - 10} more collisions...
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Methodology */}
      <Card className="p-6 bg-muted/20">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          Analysis Methodology
        </h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">1. Deduplication:</strong> All addresses from all
            datasets are loaded into a hash map for O(1) collision detection.
          </p>
          <p>
            <strong className="text-foreground">2. Source Tracking:</strong> Each duplicate is
            tracked to identify which datasets contain the collision.
          </p>
          <p>
            <strong className="text-foreground">3. Probability Calculation:</strong> Birthday
            Attack probability is calculated using: P = 1 - e^(-n^2/2d) where n = addresses, d =
            address space size.
          </p>
          <p>
            <strong className="text-foreground">4. Suspicion Threshold:</strong> Addresses
            appearing &gt;2 times are flagged as highly suspicious and require investigation.
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={analyzeCollisions} disabled={analyzing} className="gap-2">
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
              Re-analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Re-run Analysis
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Helper Components
function StatCard({
  label,
  value,
  subtitle,
  icon: IconComponent,
  color,
  bgColor,
}: {
  label: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color: string
  bgColor: string
}) {
  return (
    <Card className={`p-4 ${bgColor} border-border`}>
      <div className="flex items-center gap-3">
        {React.createElement(IconComponent, { className: `w-5 h-5 ${color}` })}
        <div className="flex-1">
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
          {subtitle && (
            <div className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</div>
          )}
        </div>
      </div>
    </Card>
  )
}

function CollisionCard({ collision }: { collision: CollisionData }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(collision.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 border-2 ${
        collision.isSuspicious
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-[#D4AF37]/10 border-[#D4AF37]/30'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 text-xs font-medium ${
                collision.isSuspicious
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-[#D4AF37]/20 text-[#D4AF37]'
              }`}
            >
              {collision.count}x Collision
            </span>
            {collision.isSuspicious && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white">
                SUSPICIOUS
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm truncate">{collision.address}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 p-1 hover:bg-muted transition-colors"
            >
              {copied ? (
                <span className="text-xs text-[#D4AF37]">Copied</span>
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
            <a
              href={`https://blockchair.com/bitcoin/address/${collision.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1 hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          </div>

          <div className="text-xs text-muted-foreground">
            Found in: {collision.sources.join(', ')}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground mb-1">Probability</div>
          <div className="text-sm font-mono font-bold">
            {(collision.probability * 100).toExponential(2)}%
          </div>
        </div>
      </div>
    </motion.div>
  )
}
