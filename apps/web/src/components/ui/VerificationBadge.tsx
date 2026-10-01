'use client'

import { motion } from 'framer-motion'
import { Check, AlertCircle, HelpCircle, XCircle, Shield, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export type ConfidenceLevel = 'verified' | 'high' | 'medium' | 'unknown' | 'disproven'

interface VerificationBadgeProps {
  level: ConfidenceLevel
  percentage?: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string
  sourceUrl?: string
  className?: string
}

const levelConfig = {
  verified: {
    icon: Check,
    label: 'Verified',
    className: 'badge-verified',
    description: 'On-chain proof available',
    bgClass: 'bg-verified-bg',
    textClass: 'text-verified',
    borderClass: 'border-verified',
  },
  high: {
    icon: Shield,
    label: 'High Confidence',
    className: 'badge-high-confidence',
    description: 'Strong evidence supports this',
    bgClass: 'bg-high-confidence-bg',
    textClass: 'text-high-confidence',
    borderClass: 'border-high-confidence',
  },
  medium: {
    icon: AlertCircle,
    label: 'Medium',
    className: 'badge-warning',
    description: 'Some evidence, needs verification',
    bgClass: 'bg-warning-bg',
    textClass: 'text-warning',
    borderClass: 'border-warning',
  },
  unknown: {
    icon: HelpCircle,
    label: 'Unknown',
    className: 'badge-unknown',
    description: 'Awaiting verification',
    bgClass: 'bg-unknown-bg',
    textClass: 'text-unknown',
    borderClass: 'border-unknown',
  },
  disproven: {
    icon: XCircle,
    label: 'Disproven',
    className: 'badge-disproven',
    description: 'Evidence contradicts this claim',
    bgClass: 'bg-disproven-bg',
    textClass: 'text-disproven',
    borderClass: 'border-disproven',
  },
}

const sizeConfig = {
  sm: {
    padding: 'px-1.5 py-0.5',
    text: 'text-xs',
    iconSize: 'h-3 w-3',
    gap: 'gap-1',
  },
  md: {
    padding: 'px-2 py-1',
    text: 'text-sm',
    iconSize: 'h-4 w-4',
    gap: 'gap-1.5',
  },
  lg: {
    padding: 'px-3 py-1.5',
    text: 'text-base',
    iconSize: 'h-5 w-5',
    gap: 'gap-2',
  },
}

export function VerificationBadge({
  level,
  percentage,
  label,
  showPercentage = false,
  size = 'md',
  tooltip,
  sourceUrl,
  className = '',
}: VerificationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const config = levelConfig[level]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon

  const displayLabel = label || config.label
  const displayPercentage = percentage !== undefined ? percentage : getDefaultPercentage(level)

  return (
    <div className="relative inline-block">
      <motion.div
        className={`
          inline-flex items-center ${sizeStyles.gap} ${sizeStyles.padding} ${sizeStyles.text}
          rounded-full font-medium
          ${config.bgClass} ${config.textClass} border ${config.borderClass}
          cursor-default transition-all hover:opacity-90
          ${className}
        `}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Icon className={sizeStyles.iconSize} />
        <span>{displayLabel}</span>
        {showPercentage && (
          <span className="font-mono opacity-80">
            {displayPercentage}%
          </span>
        )}
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-60 hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (tooltip || config.description) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2
                     bg-popover text-popover-foreground text-xs rounded-lg shadow-lg
                     border border-border whitespace-nowrap max-w-xs"
        >
          <div className="font-medium mb-1">{config.description}</div>
          {tooltip && <div className="text-muted-foreground">{tooltip}</div>}
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
                          border-l-4 border-r-4 border-t-4
                          border-l-transparent border-r-transparent border-t-border" />
        </motion.div>
      )}
    </div>
  )
}

function getDefaultPercentage(level: ConfidenceLevel): number {
  switch (level) {
    case 'verified':
      return 99
    case 'high':
      return 85
    case 'medium':
      return 60
    case 'unknown':
      return 50
    case 'disproven':
      return 5
  }
}

// Compact inline version
export function VerificationDot({
  level,
  size = 8,
}: {
  level: ConfidenceLevel
  size?: number
}) {
  const config = levelConfig[level]

  return (
    <span
      className={`inline-block rounded-full ${config.bgClass}`}
      style={{ width: size, height: size }}
      title={config.label}
    />
  )
}

// Confidence meter bar
export function ConfidenceMeter({
  percentage,
  showLabel = true,
  className = '',
}: {
  percentage: number
  showLabel?: boolean
  className?: string
}) {
  const level = getConfidenceLevel(percentage)
  const config = levelConfig[level]

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className={config.textClass}>{config.label}</span>
          <span className="font-mono text-muted-foreground">{percentage}%</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${config.bgClass} ${config.borderClass} border-r`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function getConfidenceLevel(percentage: number): ConfidenceLevel {
  if (percentage >= 95) return 'verified'
  if (percentage >= 70) return 'high'
  if (percentage >= 40) return 'medium'
  if (percentage >= 10) return 'unknown'
  return 'disproven'
}
