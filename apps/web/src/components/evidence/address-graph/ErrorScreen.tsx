'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AddressGraphError } from './types'
import { ERROR_CONFIG } from './constants'

interface ErrorScreenProps {
  error: AddressGraphError
  onRetry: () => void
  retryCount: number
  maxRetries?: number
}

export function ErrorScreen({
  error,
  onRetry,
  retryCount,
  maxRetries = 3,
}: ErrorScreenProps) {
  const config = ERROR_CONFIG[error.type]
  const Icon = config.icon
  const canRetry = error.retryable && retryCount < maxRetries

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="flex flex-col items-center gap-6 max-w-md px-8 text-center">
        {/* Error icon with animated ring */}
        <div className="relative">
          <div
            className={`absolute inset-0 border-2 ${config.color} opacity-20 animate-ping`}
          />
          <div
            className={`w-24 h-24 bg-gray-900 border-2 border-current flex items-center justify-center ${config.color}`}
          >
            <Icon className="w-12 h-12" />
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h2 className={`text-xl font-bold ${config.color}`}>{error.message}</h2>
          {error.details && (
            <p className="text-sm text-gray-500 max-w-sm">{error.details}</p>
          )}
        </div>

        {/* Error type badge */}
        <div className="px-3 py-1 bg-white/5 border border-white/[0.04]">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {error.type.replace('_', ' ')}
          </span>
        </div>

        {/* Retry section */}
        {canRetry ? (
          <div className="space-y-3">
            <Button
              onClick={onRetry}
              className="gap-2 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#D4AF37] text-white"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <p className="text-xs text-gray-600">
              Attempt {retryCount + 1} of {maxRetries}
            </p>
          </div>
        ) : retryCount >= maxRetries ? (
          <div className="space-y-2">
            <p className="text-sm text-red-400">Maximum retry attempts reached</p>
            <p className="text-xs text-gray-600">
              Please refresh the page or contact support
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-600">
            This error cannot be automatically resolved
          </p>
        )}

        {/* Troubleshooting tips */}
        <div className="pt-4 border-t border-white/[0.04] w-full">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
            Troubleshooting
          </p>
          <ul className="text-xs text-gray-500 space-y-1 text-left">
            <li>• Check your internet connection</li>
            <li>• Try refreshing the page</li>
            <li>• Disable ad blockers that may block JSON files</li>
            <li>• Try a different browser (Chrome recommended)</li>
            <li>• Clear browser cache if issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
