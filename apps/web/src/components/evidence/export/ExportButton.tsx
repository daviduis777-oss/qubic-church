'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Image as ImageIcon,
  Check,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import html2canvas from 'html2canvas'

export type ExportFormat = 'json' | 'csv' | 'screenshot'

interface ExportButtonProps {
  data: any[]
  filename?: string
  onExport?: (format: ExportFormat) => void
  screenshotElementId?: string
  className?: string
}

export function ExportButton({
  data,
  filename = 'evidence-data',
  onExport,
  screenshotElementId,
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportedFormat, setExportedFormat] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)
    setExportedFormat(format)

    try {
      switch (format) {
        case 'json':
          exportJSON()
          break
        case 'csv':
          exportCSV()
          break
        case 'screenshot':
          await exportScreenshot()
          break
      }

      onExport?.(format)

      // Show success state
      setTimeout(() => {
        setExportedFormat(null)
      }, 2000)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportJSON = () => {
    const json = JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        recordCount: data.length,
        data,
      },
      null,
      2
    )

    const blob = new Blob([json], { type: 'application/json' })
    downloadBlob(blob, `${filename}.json`)
  }

  const exportCSV = () => {
    if (data.length === 0) return

    // Get headers from first object
    const headers = Object.keys(data[0])
    const csvRows = []

    // Add headers
    csvRows.push(headers.join(','))

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""')
        return escaped.includes(',') ? `"${escaped}"` : escaped
      })
      csvRows.push(values.join(','))
    }

    const csv = csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    downloadBlob(blob, `${filename}.csv`)
  }

  const exportScreenshot = async () => {
    const element = screenshotElementId
      ? document.getElementById(screenshotElementId)
      : document.body

    if (!element) {
      console.error('Screenshot element not found')
      return
    }

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
      })

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `${filename}-screenshot.png`)
        }
      }, 'image/png')
    } catch (error) {
      console.error('Screenshot failed:', error)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : exportedFormat ? (
            <Check className="w-4 h-4 mr-2 text-[#D4AF37]" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {isExporting
            ? 'Exporting...'
            : exportedFormat
            ? 'Exported!'
            : 'Export'}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Export Format
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('json')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileJson className="w-4 h-4 mr-2 text-[#D4AF37]" />
          <div className="flex-1">
            <div className="font-medium">JSON</div>
            <div className="text-xs text-muted-foreground">
              {data.length.toLocaleString()} records
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-[#D4AF37]" />
          <div className="flex-1">
            <div className="font-medium">CSV</div>
            <div className="text-xs text-muted-foreground">Excel compatible</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('screenshot')}
          disabled={isExporting || !screenshotElementId}
          className="cursor-pointer"
        >
          <ImageIcon className="w-4 h-4 mr-2 text-[#D4AF37]" />
          <div className="flex-1">
            <div className="font-medium">Screenshot</div>
            <div className="text-xs text-muted-foreground">
              {screenshotElementId ? 'Current view' : 'Not available'}
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Bulk Export Component for multiple tables
interface BulkExportProps {
  exports: Array<{
    label: string
    data: any[]
    filename: string
  }>
}

export function BulkExport({ exports }: BulkExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleBulkExport = async (format: ExportFormat) => {
    setIsExporting(true)

    try {
      for (const exportItem of exports) {
        // Export each dataset with a delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        if (format === 'json') {
          const json = JSON.stringify(
            {
              exportDate: new Date().toISOString(),
              recordCount: exportItem.data.length,
              data: exportItem.data,
            },
            null,
            2
          )
          const blob = new Blob([json], { type: 'application/json' })
          downloadBlob(blob, `${exportItem.filename}.json`)
        } else if (format === 'csv') {
          // CSV export logic (similar to above)
          const headers = Object.keys(exportItem.data[0] || {})
          const csvRows = [headers.join(',')]

          for (const row of exportItem.data) {
            const values = headers.map((header) => {
              const value = row[header]
              const escaped = String(value).replace(/"/g, '""')
              return escaped.includes(',') ? `"${escaped}"` : escaped
            })
            csvRows.push(values.join(','))
          }

          const csv = csvRows.join('\n')
          const blob = new Blob([csv], { type: 'text/csv' })
          downloadBlob(blob, `${exportItem.filename}.csv`)
        }
      }
    } catch (error) {
      console.error('Bulk export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const totalRecords = exports.reduce((sum, e) => sum + e.data.length, 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {isExporting ? 'Exporting All...' : 'Export All'}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Export All Datasets ({exports.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-2 text-xs text-muted-foreground">
          Total: {totalRecords.toLocaleString()} records
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleBulkExport('json')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileJson className="w-4 h-4 mr-2 text-[#D4AF37]" />
          <div className="flex-1">
            <div className="font-medium">All as JSON</div>
            <div className="text-xs text-muted-foreground">
              {exports.length} files
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleBulkExport('csv')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-[#D4AF37]" />
          <div className="flex-1">
            <div className="font-medium">All as CSV</div>
            <div className="text-xs text-muted-foreground">
              {exports.length} files
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
