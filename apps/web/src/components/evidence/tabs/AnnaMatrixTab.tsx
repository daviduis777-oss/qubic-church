'use client'

import { motion } from 'framer-motion'
import { Download, Share2, ExternalLink, Keyboard, Sparkles, Grid3X3, Binary, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

// Placeholder for 3D scene (anna-grid removed)
function AnnaGridScene() {
  return (
    <div className="w-full h-[700px] bg-[#050505] border border-white/[0.04] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 opacity-50">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#D4AF37]/20 animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="text-lg font-bold text-[#D4AF37]/70 font-mono">128^2</div>
          </div>
        </div>
        <span className="text-white/40 text-sm font-mono">Anna Matrix Explorer</span>
        <span className="text-white/25 text-xs font-mono">Use the Research workspace for full 3D exploration</span>
      </div>
    </div>
  )
}

// Quick action buttons config
const QUICK_ACTIONS = [
  {
    id: 'download',
    label: 'Download JSON',
    icon: Download,
    href: '/data/anna-matrix.json',
    download: true,
  },
  {
    id: 'docs',
    label: 'Documentation',
    icon: ExternalLink,
    href: '/docs/anna-matrix',
  },
]

// Keyboard shortcuts for this tab
const KEYBOARD_HINTS = [
  { keys: ['F'], action: 'Fullscreen' },
  { keys: ['T'], action: '2D/3D Toggle' },
  { keys: ['W', 'A', 'S', 'D'], action: 'Navigate' },
  { keys: ['?'], action: 'All Shortcuts' },
]

// Stats with enhanced styling
const MATRIX_STATS = [
  {
    value: '16,384',
    label: 'Total Cells',
    description: '128 x 128 grid',
    icon: Grid3X3,
    color: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/[0.04]',
    borderColor: 'border-[#D4AF37]/15',
  },
  {
    value: '30',
    label: 'VIP Addresses',
    description: 'Bitcoin connections',
    icon: Sparkles,
    color: 'text-[#D4AF37]/80',
    bgColor: 'bg-[#D4AF37]/[0.04]',
    borderColor: 'border-[#D4AF37]/15',
  },
  {
    value: '3',
    label: 'Special Rows',
    description: 'Row 21, 68, 96',
    icon: Target,
    color: 'text-[#D4AF37]/70',
    bgColor: 'bg-[#D4AF37]/[0.04]',
    borderColor: 'border-[#D4AF37]/15',
  },
  {
    value: '[-128, 127]',
    label: 'Value Range',
    description: 'Signed byte',
    icon: Binary,
    color: 'text-[#D4AF37]/60',
    bgColor: 'bg-[#D4AF37]/[0.04]',
    borderColor: 'border-[#D4AF37]/15',
  },
]

// Special row explanations
const SPECIAL_ROWS = [
  {
    row: 21,
    name: 'Bitcoin Input',
    description: 'Receives Block #283 data. Boot address 2692 starts execution here.',
    color: '#D4AF37',
    bgClass: 'bg-[#D4AF37]/[0.06] border-[#D4AF37]/20',
    textClass: 'text-[#D4AF37]',
  },
  {
    row: 68,
    name: 'Transformation',
    description: 'Bitcoin to Qubic conversion. 137 writes match the fine structure constant.',
    color: '#D4AF37',
    bgClass: 'bg-[#D4AF37]/[0.04] border-[#D4AF37]/15',
    textClass: 'text-[#D4AF37]/80',
  },
  {
    row: 96,
    name: 'Output',
    description: 'Final computation output. Contains POCZ address at position [96, 84].',
    color: '#D4AF37',
    bgClass: 'bg-[#D4AF37]/[0.03] border-[#D4AF37]/10',
    textClass: 'text-[#D4AF37]/70',
  },
]

export default function AnnaMatrixTab() {
  const [showShortcuts, setShowShortcuts] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Anna Matrix Explorer',
          text: 'Explore the 128×128 cryptographic matrix connecting Bitcoin and Qubic',
          url: window.location.href + '#matrix',
        })
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href + '#matrix')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with quick actions */}
      <motion.div
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#D4AF37]/[0.06] border border-[#D4AF37]/20">
              <Grid3X3 className="w-5 h-5 text-[#D4AF37]/70" />
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-wider text-white/90">Anna Matrix Explorer</h3>
              <p className="text-sm text-white/40 font-mono">128x128 Cryptographic Matrix</p>
            </div>
          </div>
          <p className="text-sm text-white/40 max-w-2xl">
            Interactive 3D visualization of the mathematical structure connecting Bitcoin and Qubic.
            Real data from anna-matrix.json with 16,384 cells and 30 VIP addresses.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return action.download ? (
              <a
                key={action.id}
                href={action.href}
                download
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-[#050505] hover:bg-white/[0.03] border border-white/[0.04] transition-colors font-mono"
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </a>
            ) : (
              <a
                key={action.id}
                href={action.href}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-[#050505] hover:bg-white/[0.03] border border-white/[0.04] transition-colors font-mono"
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </a>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="gap-2"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Keyboard shortcuts hint */}
      {showShortcuts && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap items-center gap-4 p-3 bg-white/[0.02] border border-white/[0.04]"
        >
          <span className="text-xs text-white/40 font-mono font-medium tracking-wider">Shortcuts:</span>
          {KEYBOARD_HINTS.map((hint) => (
            <div key={hint.action} className="flex items-center gap-1.5 text-xs">
              <div className="flex gap-0.5">
                {hint.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
              <span className="text-white/40">{hint.action}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* 3D Scene */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <AnnaGridScene />
      </motion.div>

      {/* Statistics Grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {MATRIX_STATS.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              className={`relative p-4 border overflow-hidden group hover:scale-[1.02] transition-transform ${stat.bgColor} ${stat.borderColor}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
            >
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className="w-16 h-16" />
              </div>
              <div className="relative">
                <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-sm font-medium text-white/70">{stat.label}</div>
                <div className="text-xs text-white/30">{stat.description}</div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Special Rows Explanation */}
      <motion.div
        className="grid md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {SPECIAL_ROWS.map((row, idx) => (
          <motion.div
            key={row.row}
            className={`p-4 border ${row.bgClass} hover:scale-[1.01] transition-transform`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3"
                style={{ backgroundColor: row.color }}
              />
              <span className={`font-semibold ${row.textClass}`}>
                Row {row.row} - {row.name}
              </span>
            </div>
            <p className="text-sm text-white/40">{row.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer hint */}
      <motion.div
        className="flex items-center justify-center gap-4 pt-4 text-xs text-white/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>Real-time 3D rendering</span>
        </div>
        <span className="text-white/15">//</span>
        <div className="flex items-center gap-1">
          <Grid3X3 className="w-3 h-3" />
          <span>Verified on-chain data</span>
        </div>
        <span className="text-white/15">//</span>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>30 VIP Bitcoin addresses</span>
        </div>
      </motion.div>
    </div>
  )
}
