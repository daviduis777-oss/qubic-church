'use client'

import { useRef, useState, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Download, ExternalLink, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  TableFilters,
  applyFilters,
  type FilterConfig,
  type ActiveFilter,
} from './TableFilters'

export interface Column<T> {
  id: string
  header: string
  accessor: (row: T) => string | number | boolean
  width?: string
  render?: (value: unknown, row: T) => React.ReactNode
  sortable?: boolean
  copyable?: boolean
}

interface VirtualizedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  height?: number
  rowHeight?: number
  searchable?: boolean
  searchFields?: (keyof T)[]
  exportable?: boolean
  onExport?: () => void
  emptyMessage?: string
  // Filter system
  filters?: FilterConfig[]
  getFilterFieldValue?: (item: T, field: string) => string
}

export function VirtualizedTable<T extends { id: number | string }>({
  data,
  columns,
  height = 600,
  rowHeight = 48,
  searchable = true,
  searchFields,
  exportable = false,
  onExport,
  emptyMessage = 'No data available',
  filters,
  getFilterFieldValue,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  // Apply column-based filters first
  const columnFilteredData = useMemo(() => {
    if (!filters || !getFilterFieldValue || activeFilters.length === 0) {
      return data
    }
    return applyFilters(data, filters, activeFilters, getFilterFieldValue)
  }, [data, filters, activeFilters, getFilterFieldValue])

  // Then apply text search
  const filteredData = useMemo(() => {
    if (!search.trim()) return columnFilteredData

    const searchLower = search.toLowerCase()
    return columnFilteredData.filter((row) => {
      const fieldsToSearch = searchFields || (Object.keys(row) as (keyof T)[])
      return fieldsToSearch.some((field) => {
        const value = row[field]
        if (value == null) return false
        return String(value).toLowerCase().includes(searchLower)
      })
    })
  }, [columnFilteredData, search, searchFields])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const col = columns.find((c) => c.id === sortConfig.key)
      if (!col) return 0

      const aVal = col.accessor(a)
      const bVal = col.accessor(b)

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig, columns])

  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 20,
  })

  const handleSort = (columnId: string) => {
    setSortConfig((current) => {
      if (current?.key !== columnId) {
        return { key: columnId, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key: columnId, direction: 'desc' }
      }
      return null
    })
  }

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with search and export */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {searchable && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {sortedData.length.toLocaleString()} of {data.length.toLocaleString()} records
          </span>
          {exportable && onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {filters && filters.length > 0 && getFilterFieldValue && (
        <TableFilters
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          data={data}
          getFieldValue={(item, field) =>
            getFilterFieldValue(item as T, field)
          }
        />
      )}

      {/* Table */}
      <div className="border border-border overflow-hidden">
        {/* Header */}
        <div className="flex bg-muted/50 border-b border-border sticky top-0 z-10">
          {columns.map((col) => (
            <div
              key={col.id}
              className={cn(
                'px-4 py-3 font-medium text-sm text-muted-foreground',
                col.sortable && 'cursor-pointer hover:bg-muted/80',
                col.width || 'flex-1'
              )}
              style={{ width: col.width, minWidth: col.width }}
              onClick={() => col.sortable && handleSort(col.id)}
            >
              <div className="flex items-center gap-1">
                {col.header}
                {col.sortable && sortConfig?.key === col.id && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Virtualized rows */}
        <div
          ref={parentRef}
          style={{ height, overflow: 'auto' }}
          className="bg-background"
        >
          {sortedData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = sortedData[virtualRow.index]
                if (!row) return null

                return (
                  <div
                    key={virtualRow.index}
                    className={cn(
                      'absolute top-0 left-0 w-full flex border-b border-border/50',
                      'hover:bg-muted/30 transition-colors'
                    )}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((col) => {
                      const value = col.accessor(row)
                      const cellId = `${row.id}-${col.id}`

                      return (
                        <div
                          key={col.id}
                          className={cn(
                            'px-4 py-2 flex items-center text-sm font-mono truncate',
                            col.width || 'flex-1'
                          )}
                          style={{ width: col.width, minWidth: col.width }}
                        >
                          {col.render ? (
                            col.render(value, row)
                          ) : col.copyable ? (
                            <div className="flex items-center gap-2 group">
                              <span className="truncate">{String(value)}</span>
                              <button
                                onClick={() => handleCopy(String(value), cellId)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {copiedId === cellId ? (
                                  <Check className="w-3 h-3 text-[#D4AF37]" />
                                ) : (
                                  <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                )}
                              </button>
                            </div>
                          ) : (
                            String(value)
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Explorer button component
export function ExplorerButton({
  type,
  value,
}: {
  type: 'bitcoin' | 'qubic'
  value: string
}) {
  const url =
    type === 'bitcoin'
      ? `https://mempool.space/address/${value}`
      : `https://explorer.qubic.org/network/address/${value}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
      title={`View on ${type === 'bitcoin' ? 'Mempool' : 'Qubic'} Explorer`}
    >
      <ExternalLink className="w-3.5 h-3.5" />
    </a>
  )
}
