'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter,
  X,
  Search,
  DollarSign,
  Calendar,
  Hash,
  TrendingUp,
  ChevronDown,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface FilterConfig {
  balance?: {
    min: number
    max: number
  }
  transactionCount?: {
    min: number
    max: number
  }
  dateRange?: {
    start: Date | null
    end: Date | null
  }
  addressPrefix?: string
  addressPattern?: string
  hasBalance?: boolean | null
  isPatoshi?: boolean | null
  method?: string | null
  status?: string | null
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterConfig) => void
  availableMethods?: string[]
  availableStatuses?: string[]
}

export function AdvancedFilters({
  onFilterChange,
  availableMethods = ['sha256', 'k12', 'qubic'],
  availableStatuses = ['SUCCESS', 'FAILED', 'PENDING'],
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterConfig>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.balance) count++
    if (filters.transactionCount) count++
    if (filters.dateRange?.start || filters.dateRange?.end) count++
    if (filters.addressPrefix) count++
    if (filters.addressPattern) count++
    if (filters.hasBalance !== null && filters.hasBalance !== undefined) count++
    if (filters.isPatoshi !== null && filters.isPatoshi !== undefined) count++
    if (filters.method) count++
    if (filters.status) count++
    if (searchTerm) count++
    return count
  }, [filters, searchTerm])

  const handleFilterChange = (key: keyof FilterConfig, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    setFilters({})
    setSearchTerm('')
    onFilterChange({})
  }

  return (
    <div className="space-y-3">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-3">
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2 relative"
        >
          <Filter className="w-4 h-4" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
          />
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        )}

        {/* Quick Search */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Quick search address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border p-6 space-y-6">
              {/* Balance Filter */}
              <FilterSection icon={DollarSign} title="Balance Range" color="text-[#D4AF37]">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Min Balance (BTC)
                      </label>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        value={filters.balance?.min || ''}
                        onChange={(e) =>
                          handleFilterChange('balance', {
                            ...filters.balance,
                            min: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Max Balance (BTC)
                      </label>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="100.000"
                        value={filters.balance?.max || ''}
                        onChange={(e) =>
                          handleFilterChange('balance', {
                            ...filters.balance,
                            max: parseFloat(e.target.value) || 1000,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.hasBalance === true}
                        onChange={(e) =>
                          handleFilterChange(
                            'hasBalance',
                            e.target.checked ? true : null
                          )
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Only with balance</span>
                    </label>
                  </div>
                </div>
              </FilterSection>

              {/* Transaction Count Filter */}
              <FilterSection icon={TrendingUp} title="Transaction Count" color="text-[#D4AF37]">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Min Transactions
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.transactionCount?.min || ''}
                        onChange={(e) =>
                          handleFilterChange('transactionCount', {
                            ...filters.transactionCount,
                            min: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Max Transactions
                      </label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={filters.transactionCount?.max || ''}
                        onChange={(e) =>
                          handleFilterChange('transactionCount', {
                            ...filters.transactionCount,
                            max: parseInt(e.target.value) || 10000,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </FilterSection>

              {/* Date Range Filter */}
              <FilterSection icon={Calendar} title="Activity Date Range" color="text-[#D4AF37]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      First Seen After
                    </label>
                    <Input
                      type="date"
                      value={
                        filters.dateRange?.start
                          ? filters.dateRange.start.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        handleFilterChange('dateRange', {
                          ...filters.dateRange,
                          start: e.target.value ? new Date(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Last Seen Before
                    </label>
                    <Input
                      type="date"
                      value={
                        filters.dateRange?.end
                          ? filters.dateRange.end.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        handleFilterChange('dateRange', {
                          ...filters.dateRange,
                          end: e.target.value ? new Date(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.isPatoshi === true}
                      onChange={(e) =>
                        handleFilterChange('isPatoshi', e.target.checked ? true : null)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Only Patoshi Period (2009-2010)</span>
                  </label>
                </div>
              </FilterSection>

              {/* Address Pattern Filter */}
              <FilterSection icon={Hash} title="Address Pattern" color="text-[#D4AF37]">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Address Prefix
                    </label>
                    <Input
                      placeholder="e.g., 1CFB, 3, bc1"
                      value={filters.addressPrefix || ''}
                      onChange={(e) => handleFilterChange('addressPrefix', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Pattern (regex)
                    </label>
                    <Input
                      placeholder="e.g., ^1[A-Z]{3}.*"
                      value={filters.addressPattern || ''}
                      onChange={(e) => handleFilterChange('addressPattern', e.target.value)}
                    />
                  </div>
                </div>
              </FilterSection>

              {/* Method & Status Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">
                    Derivation Method
                  </label>
                  <Select
                    value={filters.method || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('method', value === 'all' ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All methods</SelectItem>
                      {availableMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">
                    Validation Status
                  </label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('status', value === 'all' ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null

            let label = ''
            if (key === 'balance' && value.min !== undefined) label = `Balance ≥ ${value.min} BTC`
            if (key === 'balance' && value.max !== undefined) label = `Balance ≤ ${value.max} BTC`
            if (key === 'hasBalance') label = 'Has balance'
            if (key === 'isPatoshi') label = 'Patoshi period'
            if (key === 'method') label = `Method: ${value}`
            if (key === 'status') label = `Status: ${value}`
            if (key === 'addressPrefix') label = `Prefix: ${value}`

            if (!label) return null

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm border border-primary/20"
              >
                <span>{label}</span>
                <button
                  onClick={() => handleFilterChange(key as keyof FilterConfig, undefined)}
                  className="hover:bg-primary/20 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterSection({
  icon: IconComponent,
  title,
  color,
  children,
}: {
  icon: React.ElementType
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {React.createElement(IconComponent, { className: cn('w-4 h-4', color) })}
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  )
}
