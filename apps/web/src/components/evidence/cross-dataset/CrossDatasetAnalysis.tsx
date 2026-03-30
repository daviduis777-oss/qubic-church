'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Database,
  Search,
  ExternalLink,
  Info,
  Zap,
  Shield,
  FileSearch,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataUnavailablePlaceholder } from '../DataUnavailablePlaceholder'

// Known Satoshi/Patoshi address datasets
const KNOWN_SATOSHI_DATASETS = {
  genesis: {
    name: 'Genesis Block Address',
    addresses: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'],
    description: 'Bitcoin Genesis Block (Block #0) reward address',
    significance: 'CRITICAL',
  },
  knownSatoshi: {
    name: 'Known Satoshi Addresses',
    addresses: [
      '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX', // Known Satoshi
      '12cbQLTFMXRnSzktFkuoG3eHoMeFtpTu3S', // Known Satoshi
      '1HLoD9E4SDFFPDiYfNYnkBLQ85Y51J3Zb1', // Known Satoshi
    ],
    description: 'Verified Satoshi Nakamoto addresses from early communications',
    significance: 'CRITICAL',
  },
  halFinney: {
    name: 'Hal Finney Addresses',
    addresses: [
      '1Q2TWHE3GMdB6BZKafqwxXtWAWgFt5Jvm3', // Hal Finney first transaction
    ],
    description: 'First Bitcoin transaction recipient (Block #170)',
    significance: 'HIGH',
  },
  earlyMiners: {
    name: 'Early Miner Addresses (2009)',
    addresses: [
      '1PSSGeFHDnKNxiEyFrD1wcEaHr9hrQDDWc', // Early miner
      '1JfbZRwdDHKZmuiZgYArJZhcuuzuw2HuMu', // Early miner
    ],
    description: 'Confirmed early Bitcoin miners from 2009',
    significance: 'MEDIUM',
  },
}

interface AnalysisResult {
  dataset: string
  totalKnownAddresses: number
  totalOurAddresses: number
  overlaps: Array<{
    address: string
    dataset: string
    ourSource: string
    blockNumber?: number
    timestamp?: string
  }>
  overlapCount: number
  overlapPercentage: number
  pValue: number
  chiSquare: number
  significance: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'SMOKING_GUN'
}

interface CrossDatasetAnalysisProps {
  ourAddresses?: string[]
}

export function CrossDatasetAnalysis({ ourAddresses = [] }: CrossDatasetAnalysisProps) {
  const [loading, setLoading] = useState(true)
  const [dataUnavailable, setDataUnavailable] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [loadedAddresses, setLoadedAddresses] = useState<string[]>([])

  // Load our derived Bitcoin addresses
  useEffect(() => {
    if (ourAddresses.length > 0) {
      setLoadedAddresses(ourAddresses)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    // Load from JSON files
    const loadAddresses = async () => {
      try {
        const allAddresses = new Set<string>()
        let anyLoaded = false

        // Attempt each fetch independently -- some may be available, others not
        const fetchAndExtract = async (url: string) => {
          try {
            const res = await fetch(url, { signal: controller.signal })
            if (!res.ok) return
            const json = await res.json()
            if (json.records && Array.isArray(json.records)) {
              json.records.forEach((r: any) => {
                if (r.address) allAddresses.add(r.address)
              })
              anyLoaded = true
            }
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') throw err
            // Individual file unavailable -- continue with others
          }
        }

        await Promise.all([
          fetchAndExtract('/data/bitcoin-derived-addresses.json'),
          fetchAndExtract('/data/bitcoin-private-keys.json'),
          fetchAndExtract('/data/matrix-addresses.json'),
        ])

        if (!anyLoaded) {
          // None of the datasets loaded -- show data unavailable
          setDataUnavailable(true)
          setLoading(false)
          return
        }

        setLoadedAddresses(Array.from(allAddresses))
        setLoading(false)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setDataUnavailable(true)
        setLoading(false)
      }
    }

    loadAddresses()
    return () => controller.abort()
  }, [ourAddresses])

  // Perform cross-dataset analysis
  const performAnalysis = () => {
    if (loadedAddresses.length === 0) return

    setAnalyzing(true)

    // Create a Set for O(1) lookup
    const ourAddressSet = new Set(loadedAddresses)
    const analysisResults: AnalysisResult[] = []

    // Check each known dataset
    Object.entries(KNOWN_SATOSHI_DATASETS).forEach(([key, dataset]) => {
      const overlaps: AnalysisResult['overlaps'] = []

      dataset.addresses.forEach((knownAddress) => {
        if (ourAddressSet.has(knownAddress)) {
          overlaps.push({
            address: knownAddress,
            dataset: dataset.name,
            ourSource: 'Derived from Qubic seeds',
          })
        }
      })

      const overlapCount = overlaps.length
      const totalKnown = dataset.addresses.length
      const totalOurs = loadedAddresses.length

      // Calculate statistical significance
      const expectedOverlaps = (totalKnown * totalOurs) / Math.pow(2, 160) // Bitcoin address space
      const chiSquare = Math.pow(overlapCount - expectedOverlaps, 2) / expectedOverlaps
      const pValue = overlapCount > 0 ? Math.exp(-chiSquare / 2) : 1

      // Determine significance
      let significance: AnalysisResult['significance'] = 'NONE'
      if (overlapCount > 0) {
        if (key === 'genesis' || key === 'knownSatoshi') {
          significance = 'SMOKING_GUN' // Any overlap with known Satoshi is explosive
        } else if (overlapCount >= 3) {
          significance = 'CRITICAL'
        } else if (overlapCount === 2) {
          significance = 'HIGH'
        } else {
          significance = 'MEDIUM'
        }
      }

      analysisResults.push({
        dataset: dataset.name,
        totalKnownAddresses: totalKnown,
        totalOurAddresses: totalOurs,
        overlaps,
        overlapCount,
        overlapPercentage: (overlapCount / totalKnown) * 100,
        pValue,
        chiSquare,
        significance,
      })
    })

    setResults(analysisResults)
    setAnalyzing(false)
  }

  // Auto-run analysis when addresses are loaded
  useEffect(() => {
    if (loadedAddresses.length > 0 && results.length === 0) {
      performAnalysis()
    }
  }, [loadedAddresses])

  const totalOverlaps = useMemo(
    () => results.reduce((sum, r) => sum + r.overlapCount, 0),
    [results]
  )

  const hasSmokingGun = useMemo(
    () => results.some((r) => r.significance === 'SMOKING_GUN'),
    [results]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading Bitcoin addresses...</p>
        </div>
      </div>
    )
  }

  if (dataUnavailable) {
    return (
      <DataUnavailablePlaceholder
        datasetName="Cross-Dataset Analysis"
        fileName="matrix-addresses.json, bitcoin-derived-addresses.json, bitcoin-private-keys.json"
        height="500px"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-[#D4AF37]">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Cross-Dataset Analysis</h3>
            <p className="text-muted-foreground">
              Searching for overlaps with known Satoshi Nakamoto addresses
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/30 border border-border">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                This analysis compares our {loadedAddresses.length.toLocaleString()} derived Bitcoin
                addresses with known Satoshi Nakamoto addresses from historical records.
              </p>
              <p className="text-sm font-medium text-foreground">
                <strong>Finding even ONE overlap</strong> would provide cryptographic proof of CFB's
                involvement in Bitcoin's creation.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Overview */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatsCard
          icon={Database}
          label="Our Addresses"
          value={loadedAddresses.length.toLocaleString()}
          color="text-[#D4AF37]"
          bgColor="bg-[#D4AF37]/10"
        />
        <StatsCard
          icon={Shield}
          label="Known Datasets"
          value={Object.keys(KNOWN_SATOSHI_DATASETS).length.toString()}
          color="text-[#D4AF37]"
          bgColor="bg-[#D4AF37]/10"
        />
        <StatsCard
          icon={Search}
          label="Total Overlaps"
          value={totalOverlaps.toString()}
          color={totalOverlaps > 0 ? 'text-red-500' : 'text-[#D4AF37]'}
          bgColor={totalOverlaps > 0 ? 'bg-red-500/10' : 'bg-[#D4AF37]/10'}
        />
        <StatsCard
          icon={hasSmokingGun ? AlertTriangle : CheckCircle2}
          label="Status"
          value={hasSmokingGun ? 'SMOKING GUN!' : 'Clean'}
          color={hasSmokingGun ? 'text-red-500' : 'text-[#D4AF37]'}
          bgColor={hasSmokingGun ? 'bg-red-500/10' : 'bg-[#D4AF37]/10'}
        />
      </motion.div>

      {/* Smoking Gun Alert */}
      {hasSmokingGun && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-gradient-to-r from-red-500/20 to-[#D4AF37]/20 border-2 border-red-500/50"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-red-400 mb-2">
                SMOKING GUN DETECTED!
              </h3>
              <p className="text-lg text-foreground mb-3">
                We found {results.filter(r => r.significance === 'SMOKING_GUN').reduce((sum, r) => sum + r.overlapCount, 0)} overlap(s) with known Satoshi Nakamoto addresses!
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                This is direct cryptographic evidence that our Qubic-derived addresses match
                addresses used by Satoshi Nakamoto himself. The probability of this occurring
                randomly is essentially zero.
              </p>
              <div className="flex gap-3">
                <Button variant="destructive" size="lg">
                  <FileSearch className="w-4 h-4 mr-2" />
                  View Evidence Details
                </Button>
                <Button variant="outline" size="lg">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Verify on Blockchain
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Analysis Results */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Dataset Comparison Results
        </h4>

        {results.map((result, idx) => (
          <DatasetResultCard
            key={result.dataset}
            result={result}
            index={idx}
            onClick={() => setSelectedDataset(result.dataset)}
            isSelected={selectedDataset === result.dataset}
          />
        ))}
      </div>

      {/* Methodology */}
      <motion.div
        className="p-6 bg-muted/20 border border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          Analysis Methodology
        </h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">1. Data Collection:</strong> We compare {loadedAddresses.length.toLocaleString()} Bitcoin addresses derived from Qubic seeds with curated datasets of known Satoshi addresses.
          </p>
          <p>
            <strong className="text-foreground">2. Overlap Detection:</strong> Using Set-based O(1) lookup for efficient matching across all datasets simultaneously.
          </p>
          <p>
            <strong className="text-foreground">3. Statistical Significance:</strong> Chi-square test and p-value calculation based on Bitcoin's 2^160 address space (extremely unlikely random collisions).
          </p>
          <p>
            <strong className="text-foreground">4. Verification:</strong> All overlaps can be independently verified on Bitcoin's public blockchain using block explorers.
          </p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={performAnalysis} disabled={analyzing} className="gap-2">
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
              Re-analyzing...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Re-run Analysis
            </>
          )}
        </Button>
        <Button variant="outline" className="gap-2">
          <ExternalLink className="w-4 h-4" />
          Export Results
        </Button>
      </div>
    </div>
  )
}

// Helper Components
function StatsCard({
  icon: IconComponent,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType
  label: string
  value: string
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
        </div>
      </div>
    </Card>
  )
}

function DatasetResultCard({
  result,
  index,
  onClick,
  isSelected,
}: {
  result: AnalysisResult
  index: number
  onClick: () => void
  isSelected: boolean
}) {
  const getBorderColor = () => {
    switch (result.significance) {
      case 'SMOKING_GUN':
        return 'border-red-500'
      case 'CRITICAL':
        return 'border-[#D4AF37]'
      case 'HIGH':
        return 'border-[#D4AF37]'
      case 'MEDIUM':
        return 'border-[#D4AF37]'
      default:
        return 'border-border'
    }
  }

  const getSignificanceBadge = () => {
    const colors = {
      SMOKING_GUN: 'bg-red-500/20 text-red-400 border-red-500/30',
      CRITICAL: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30',
      HIGH: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30',
      MEDIUM: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30',
      LOW: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      NONE: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30',
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-medium border ${colors[result.significance]}`}
      >
        {result.significance.replace('_', ' ')}
      </span>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={`p-5 border-2 ${getBorderColor()} cursor-pointer hover:bg-muted/50 transition-colors ${
          isSelected ? 'bg-muted/50' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h5 className="font-semibold text-lg">{result.dataset}</h5>
              {getSignificanceBadge()}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <Metric label="Known Addresses" value={result.totalKnownAddresses} />
              <Metric label="Overlaps Found" value={result.overlapCount} />
              <Metric
                label="Overlap Rate"
                value={`${result.overlapPercentage.toFixed(2)}%`}
              />
              <Metric label="p-value" value={result.pValue.toExponential(2)} />
            </div>

            {result.overlapCount > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/30">
                <p className="text-sm font-medium text-red-400 mb-2">
                  {result.overlapCount} overlap(s) detected!
                </p>
                <div className="space-y-1">
                  {result.overlaps.slice(0, 3).map((overlap) => (
                    <div
                      key={overlap.address}
                      className="flex items-center gap-2 text-xs font-mono"
                    >
                      <span className="text-muted-foreground">{overlap.address}</span>
                      <a
                        href={`https://blockchair.com/bitcoin/address/${overlap.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                  {result.overlaps.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      + {result.overlaps.length - 3} more overlaps
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
