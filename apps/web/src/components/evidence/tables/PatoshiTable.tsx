'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { VirtualizedTable, ExplorerButton, type Column } from './VirtualizedTable'
import { Copy, Check } from 'lucide-react'
import { pubkeyToAddressCached } from '@/lib/crypto/pubkey-to-address'
import { DataUnavailablePlaceholder } from '../DataUnavailablePlaceholder'
import type { FilterConfig } from './TableFilters'

interface PatoshiRecord {
  id: number
  blockHeight: number
  outputIndex: number
  pubkey: string
  amount: number
  scriptType: string
}

interface PatoshiData {
  total: number
  records: Omit<PatoshiRecord, 'id'>[]
}

export default function PatoshiTable() {
  const [data, setData] = useState<PatoshiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dataUnavailable, setDataUnavailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const loadData = async () => {
      try {
        const res = await fetch('/data/patoshi-addresses.json', { signal: controller.signal })
        if (!res.ok) {
          setDataUnavailable(true)
          setLoading(false)
          return
        }
        const json: PatoshiData = await res.json()
        const records = json.records.map((r, idx) => ({ ...r, id: idx }))
        setData(records)
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

  // Memoize columns to prevent re-renders
  const columns: Column<PatoshiRecord>[] = useMemo(
    () => [
      {
        id: 'blockHeight',
        header: 'Block',
        accessor: (row) => row.blockHeight,
        width: '80px',
        sortable: true,
      },
      {
        id: 'address',
        header: 'Bitcoin Address',
        accessor: (row) => pubkeyToAddressCached(row.pubkey),
        width: '320px',
        render: (_, row) => {
          const address = pubkeyToAddressCached(row.pubkey)
          const cellId = `addr-${row.id}`
          return (
            <div className="flex items-center gap-2 group">
              <span className="font-mono text-xs truncate">{address}</span>
              <button
                onClick={() => handleCopy(address, cellId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                {copiedId === cellId ? (
                  <Check className="w-3 h-3 text-[#D4AF37]" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                )}
              </button>
              <ExplorerButton type="bitcoin" value={address} />
            </div>
          )
        },
      },
      {
        id: 'pubkey',
        header: 'Public Key',
        accessor: (row) => row.pubkey,
        width: '280px',
        render: (value, row) => {
          const cellId = `pk-${row.id}`
          return (
            <div className="flex items-center gap-2 group">
              <span className="truncate text-xs text-muted-foreground">
                {String(value).slice(0, 24)}...
              </span>
              <button
                onClick={() => handleCopy(String(value), cellId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                {copiedId === cellId ? (
                  <Check className="w-3 h-3 text-[#D4AF37]" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                )}
              </button>
            </div>
          )
        },
      },
      {
        id: 'amount',
        header: 'BTC',
        accessor: (row) => row.amount,
        width: '80px',
        sortable: true,
        render: (value) => (
          <span className="text-[#D4AF37] font-medium">{Number(value).toFixed(0)}</span>
        ),
      },
      {
        id: 'scriptType',
        header: 'Type',
        accessor: (row) => row.scriptType,
        width: '70px',
        render: (value) => (
          <span className="px-2 py-0.5 bg-muted text-xs uppercase">
            {String(value)}
          </span>
        ),
      },
    ],
    [copiedId]
  )

  // Filter configuration for Patoshi table
  const filters: FilterConfig[] = useMemo(
    () => [
      {
        id: 'addressPrefix',
        label: 'Address Starts With',
        type: 'prefix',
        field: 'address',
        options: ['1'], // All P2PKH start with 1
      },
      {
        id: 'scriptType',
        label: 'Script Type',
        type: 'category',
        field: 'scriptType',
        options: ['p2pk', 'p2pkh'],
      },
    ],
    []
  )

  // Get field value for filtering
  const getFilterFieldValue = useCallback(
    (item: PatoshiRecord, field: string): string => {
      if (field === 'address') {
        return pubkeyToAddressCached(item.pubkey)
      }
      if (field === 'scriptType') {
        return item.scriptType
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
          <span className="text-muted-foreground">Loading Patoshi addresses...</span>
        </div>
      </div>
    )
  }

  if (dataUnavailable) {
    return (
      <DataUnavailablePlaceholder
        datasetName="Patoshi-Era Bitcoin Addresses"
        fileName="patoshi-addresses.json (5.5 MB)"
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Patoshi-Era Bitcoin Addresses</h3>
          <p className="text-sm text-muted-foreground">
            Early mining addresses (blocks 1-36,288) attributed to Satoshi Nakamoto
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#D4AF37]">
            {data.length.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">Total Addresses</div>
        </div>
      </div>

      <VirtualizedTable
        data={data}
        columns={columns}
        searchFields={['pubkey']}
        filters={filters}
        getFilterFieldValue={getFilterFieldValue}
        exportable
        onExport={() => {
          // Include derived addresses in export
          const csv = data
            .map((r) => {
              const address = pubkeyToAddressCached(r.pubkey)
              return `${r.blockHeight},${address},${r.pubkey},${r.amount}`
            })
            .join('\n')
          const blob = new Blob([`Block,Address,Pubkey,Amount\n${csv}`], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'patoshi-addresses.csv'
          a.click()
        }}
      />
    </div>
  )
}
