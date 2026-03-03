'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { VirtualizedTable, ExplorerButton, type Column } from './VirtualizedTable'
import { Copy, Check, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataUnavailablePlaceholder } from '../DataUnavailablePlaceholder'
import type { FilterConfig } from './TableFilters'

interface QubicSeedRecord {
  id: number
  seed: string // PRIVATE SEED
  documentedIdentity: string
  realIdentity: string
  match: boolean
  source: string
}

interface QubicData {
  total: number
  processed: number
  matches: number
  matchRate: string
  records: QubicSeedRecord[]
}

export default function QubicSeedsTable() {
  const [data, setData] = useState<QubicSeedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dataUnavailable, setDataUnavailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSeeds, setShowSeeds] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, matches: 0, matchRate: '0%' })

  useEffect(() => {
    const controller = new AbortController()
    const loadData = async () => {
      try {
        const res = await fetch('/data/qubic-seeds.json', { signal: controller.signal })
        if (!res.ok) {
          setDataUnavailable(true)
          setLoading(false)
          return
        }
        const json: QubicData = await res.json()
        setData(json.records)
        setStats({
          total: json.total,
          matches: json.matches,
          matchRate: json.matchRate,
        })
        setLoading(false)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setDataUnavailable(true)
        setLoading(false)
      }
    }
    loadData()
    return () => controller.abort()
  }, [])

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const columns: Column<QubicSeedRecord>[] = [
    {
      id: 'id',
      header: '#',
      accessor: (row) => row.id + 1,
      width: '70px',
      sortable: true,
    },
    {
      id: 'seed',
      header: 'Private Seed (55 chars)',
      accessor: (row) => row.seed,
      width: '280px',
      render: (value, row) => (
        <div className="flex items-center gap-2 group">
          <span className="font-mono text-xs">
            {showSeeds ? String(value) : '•'.repeat(20) + '...'}
          </span>
          {showSeeds && (
            <button
              onClick={() => handleCopy(String(value), `seed-${row.id}`)}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              {copiedId === `seed-${row.id}` ? (
                <Check className="w-3 h-3 text-[#D4AF37]" />
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          )}
        </div>
      ),
    },
    {
      id: 'realIdentity',
      header: 'Public Identity (60 chars)',
      accessor: (row) => row.realIdentity,
      width: '320px',
      render: (value, row) => (
        <div className="flex items-center gap-2 group">
          <span className="font-mono text-xs truncate">{String(value).slice(0, 24)}...</span>
          <button
            onClick={() => handleCopy(String(value), `pub-${row.id}`)}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            {copiedId === `pub-${row.id}` ? (
              <Check className="w-3 h-3 text-[#D4AF37]" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            )}
          </button>
          <ExplorerButton type="qubic" value={String(value)} />
        </div>
      ),
    },
    {
      id: 'match',
      header: 'Verified',
      accessor: (row) => row.match,
      width: '100px',
      render: (value) => (
        <span
          className={`px-2 py-0.5 text-xs font-medium ${
            value
              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
              : 'bg-[#D4AF37]/20 text-[#D4AF37]'
          }`}
        >
          {value ? 'Match' : 'Derived'}
        </span>
      ),
    },
  ]

  // Filter configuration for Qubic Seeds table
  const filters: FilterConfig[] = useMemo(
    () => [
      {
        id: 'identityPrefix',
        label: 'Identity Starts With',
        type: 'prefix',
        field: 'realIdentity',
      },
      {
        id: 'status',
        label: 'Status',
        type: 'category',
        field: 'match',
        options: ['Match', 'Derived'],
      },
    ],
    []
  )

  // Get field value for filtering
  const getFilterFieldValue = useCallback(
    (item: QubicSeedRecord, field: string): string => {
      if (field === 'realIdentity') {
        return item.realIdentity
      }
      if (field === 'match') {
        return item.match ? 'Match' : 'Derived'
      }
      return ''
    },
    []
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-muted-foreground">Loading Qubic seeds...</span>
        </div>
      </div>
    )
  }

  if (dataUnavailable) {
    return (
      <DataUnavailablePlaceholder
        datasetName="Qubic Seeds Database"
        fileName="qubic-seeds.json (7 MB)"
        height="600px"
      />
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] text-destructive">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30">
        <AlertTriangle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-[#D4AF37]">Private Seeds Displayed</h4>
          <p className="text-sm text-muted-foreground mt-1">
            These are cryptographic private seeds. Anyone with access to these seeds can
            control the corresponding Qubic identities. This data is provided for research
            purposes only.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Qubic Seeds Database</h3>
          <p className="text-sm text-muted-foreground">
            Complete mapping of 55-character private seeds to 60-character public identities
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant={showSeeds ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setShowSeeds(!showSeeds)}
          >
            {showSeeds ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Seeds
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Seeds
              </>
            )}
          </Button>

          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Seeds</div>
          </div>
        </div>
      </div>

      <VirtualizedTable
        data={data}
        columns={columns}
        searchFields={['seed', 'realIdentity', 'documentedIdentity']}
        filters={filters}
        getFilterFieldValue={getFilterFieldValue}
        exportable
        onExport={() => {
          const csv = data
            .map((r) => `${r.seed},${r.realIdentity},${r.match}`)
            .join('\n')
          const blob = new Blob([`Seed,Identity,Verified\n${csv}`], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'qubic-seeds.csv'
          a.click()
        }}
      />
    </div>
  )
}
