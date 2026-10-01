'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/lib/hooks'

interface ProgressRingProps {
  progress: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
  labelSuffix?: string
  color?: 'primary' | 'bitcoin' | 'qubic' | 'verified'
}

const colorMap = {
  primary: 'stroke-primary',
  bitcoin: 'stroke-bitcoin-orange',
  qubic: 'stroke-gold',
  verified: 'stroke-verified',
}

const bgColorMap = {
  primary: 'stroke-muted',
  bitcoin: 'stroke-orange-950/30',
  qubic: 'stroke-purple-950/30',
  verified: 'stroke-green-950/30',
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  className = '',
  showLabel = true,
  labelSuffix = '%',
  color = 'primary',
}: ProgressRingProps) {
  const prefersReducedMotion = useReducedMotion()
  const normalizedProgress = Math.min(100, Math.max(0, progress))

  // SVG circle calculations
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset =
    circumference - (normalizedProgress / 100) * circumference

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg className="progress-ring" height={size} width={size}>
        {/* Background circle */}
        <circle
          className={bgColorMap[color]}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <motion.circle
          animate={{ strokeDashoffset }}
          className={`progress-ring-circle ${colorMap[color]}`}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          initial={{ strokeDashoffset: circumference }}
          r={radius}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          style={{
            strokeDasharray: circumference,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 1, ease: 'easeOut' }
          }
        />
      </svg>

      {/* Label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            animate={{ opacity: 1 }}
            className="text-sm font-mono font-bold"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(normalizedProgress)}
            <span className="text-xs text-muted-foreground">{labelSuffix}</span>
          </motion.span>
        </div>
      )}
    </div>
  )
}

// Smaller version for inline use
export function ProgressRingMini({
  progress,
  color = 'primary',
}: {
  progress: number
  color?: 'primary' | 'bitcoin' | 'qubic' | 'verified'
}) {
  return (
    <ProgressRing
      color={color}
      progress={progress}
      showLabel={false}
      size={32}
      strokeWidth={3}
    />
  )
}
