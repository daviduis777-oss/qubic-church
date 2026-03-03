'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { X, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterConfig {
  id: string
  label: string
  type: 'prefix' | 'category' | 'range'
  options?: string[]
  field: string // which field to filter
}

export interface ActiveFilter {
  filterId: string
  value: string
  label: string
}

interface TableFiltersProps {
  filters: FilterConfig[]
  activeFilters: ActiveFilter[]
  onFilterChange: (filters: ActiveFilter[]) => void
  data?: unknown[] // For auto-detecting prefixes
  getFieldValue?: (item: unknown, field: string) => string
}

export function TableFilters({
  filters,
  activeFilters,
  onFilterChange,
  data,
  getFieldValue,
}: TableFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Auto-detect available prefixes from data
  const prefixOptions = useMemo(() => {
    if (!data || !getFieldValue) return {}

    const options: Record<string, Set<string>> = {}

    filters.forEach((filter) => {
      if (filter.type === 'prefix') {
        const prefixes = new Set<string>()
        data.forEach((item) => {
          const value = getFieldValue(item, filter.field)
          if (value && typeof value === 'string' && value.length > 0) {
            const firstChar = value[0]
            if (firstChar) {
              prefixes.add(firstChar.toUpperCase())
            }
          }
        })
        options[filter.id] = prefixes
      }
    })

    return options
  }, [data, filters, getFieldValue])

  const handleAddFilter = (filterId: string, value: string, label: string) => {
    // Check if already exists
    const exists = activeFilters.some(
      (f) => f.filterId === filterId && f.value === value
    )
    if (!exists) {
      onFilterChange([...activeFilters, { filterId, value, label }])
    }
    setOpenDropdown(null)
  }

  const handleRemoveFilter = (filterId: string, value: string) => {
    onFilterChange(
      activeFilters.filter((f) => !(f.filterId === filterId && f.value === value))
    )
  }

  const handleClearAll = () => {
    onFilterChange([])
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />

        {filters.map((filter) => {
          const options =
            filter.type === 'prefix'
              ? Array.from(prefixOptions[filter.id] || filter.options || []).sort()
              : filter.options || []

          return (
            <div key={filter.id} className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() =>
                  setOpenDropdown(openDropdown === filter.id ? null : filter.id)
                }
              >
                {filter.label}
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform',
                    openDropdown === filter.id && 'rotate-180'
                  )}
                />
              </Button>

              {openDropdown === filter.id && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOpenDropdown(null)}
                  />

                  {/* Dropdown */}
                  <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border shadow-lg min-w-[120px] max-h-[300px] overflow-y-auto">
                    {options.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No options
                      </div>
                    ) : (
                      <div className="p-1">
                        {filter.type === 'prefix' && (
                          <div className="grid grid-cols-6 gap-1">
                            {options.map((opt) => {
                              const isActive = activeFilters.some(
                                (f) => f.filterId === filter.id && f.value === opt
                              )
                              return (
                                <button
                                  key={opt}
                                  className={cn(
                                    'w-8 h-8 text-sm font-mono transition-colors',
                                    isActive
                                      ? 'bg-primary text-primary-foreground'
                                      : 'hover:bg-muted'
                                  )}
                                  onClick={() =>
                                    isActive
                                      ? handleRemoveFilter(filter.id, opt)
                                      : handleAddFilter(
                                          filter.id,
                                          opt,
                                          `${filter.label}: ${opt}`
                                        )
                                  }
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {filter.type === 'category' &&
                          options.map((opt) => {
                            const isActive = activeFilters.some(
                              (f) => f.filterId === filter.id && f.value === opt
                            )
                            return (
                              <button
                                key={opt}
                                className={cn(
                                  'w-full px-3 py-2 text-left text-sm transition-colors',
                                  isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                )}
                                onClick={() =>
                                  isActive
                                    ? handleRemoveFilter(filter.id, opt)
                                    : handleAddFilter(
                                        filter.id,
                                        opt,
                                        `${filter.label}: ${opt}`
                                      )
                                }
                              >
                                {opt}
                              </button>
                            )
                          })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}

        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, idx) => (
            <span
              key={`${filter.filterId}-${filter.value}-${idx}`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs"
            >
              {filter.label}
              <button
                onClick={() => handleRemoveFilter(filter.filterId, filter.value)}
                className="hover:bg-primary/20 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Utility function to filter data based on active filters
 */
export function applyFilters<T>(
  data: T[],
  filters: FilterConfig[],
  activeFilters: ActiveFilter[],
  getFieldValue: (item: T, field: string) => string
): T[] {
  if (activeFilters.length === 0) return data

  return data.filter((item) => {
    // Group filters by filterId
    const filterGroups: Record<string, ActiveFilter[]> = {}
    activeFilters.forEach((af) => {
      const existing = filterGroups[af.filterId]
      if (!existing) {
        filterGroups[af.filterId] = [af]
      } else {
        existing.push(af)
      }
    })

    // For each filter group, at least one must match (OR within group)
    // All groups must pass (AND between groups)
    return Object.entries(filterGroups).every(([filterId, groupFilters]) => {
      const filterConfig = filters.find((f) => f.id === filterId)
      if (!filterConfig) return true

      const fieldValue = getFieldValue(item, filterConfig.field)
      if (!fieldValue) return false

      // OR logic within the same filter type
      return groupFilters.some((af) => {
        if (filterConfig.type === 'prefix') {
          return fieldValue.toUpperCase().startsWith(af.value.toUpperCase())
        }
        if (filterConfig.type === 'category') {
          return fieldValue.toLowerCase() === af.value.toLowerCase()
        }
        return true
      })
    })
  })
}
