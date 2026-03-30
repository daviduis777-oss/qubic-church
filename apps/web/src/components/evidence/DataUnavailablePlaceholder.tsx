'use client'

import { Database } from 'lucide-react'

interface DataUnavailablePlaceholderProps {
  /** Name of the dataset for display */
  datasetName: string
  /** File name or path for developer reference */
  fileName?: string
  /** Custom height for the placeholder container */
  height?: string
}

/**
 * Shown when a large data file is not available on the deployed environment.
 * These JSON files exceed Vercel's size limits and are only available in local dev.
 */
export function DataUnavailablePlaceholder({
  datasetName,
  fileName,
  height = '400px',
}: DataUnavailablePlaceholderProps) {
  return (
    <div
      className="flex items-center justify-center border border-white/10 bg-black/20"
      style={{ height }}
    >
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
        <div className="p-3 border border-white/10 bg-white/5">
          <Database className="w-6 h-6 text-white/40" />
        </div>
        <div className="space-y-2">
          <p className="font-mono text-sm text-white/40">
            {datasetName}
          </p>
          <p className="font-mono text-xs text-white/25">
            Dataset too large for web deployment. Available locally.
          </p>
          {fileName && (
            <p className="font-mono text-[10px] text-white/15">
              {fileName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
