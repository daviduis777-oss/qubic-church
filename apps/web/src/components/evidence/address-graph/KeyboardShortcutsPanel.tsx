'use client'

import { motion } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KEYBOARD_SHORTCUTS } from './constants'

// =============================================================================
// KEYBOARD SHORTCUTS PANEL
// =============================================================================

interface KeyboardShortcutsPanelProps {
  onClose: () => void
}

export function KeyboardShortcutsPanel({ onClose }: KeyboardShortcutsPanelProps) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-950 border border-white/[0.04] shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-gray-500">Navigate the graph like a pro</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Shortcuts grid */}
        <div className="p-6 grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
          {KEYBOARD_SHORTCUTS.map((category) => (
            <div key={category.category}>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between p-2 bg-white/5"
                  >
                    <span className="text-sm text-gray-300">{shortcut.action}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.key.split(' / ').map((key, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          {idx > 0 && <span className="text-gray-600 text-xs">/</span>}
                          {key.split('+').map((k, i) => (
                            <span key={i} className="flex items-center gap-1">
                              {i > 0 && <span className="text-gray-600 text-xs">+</span>}
                              <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 text-xs font-mono text-gray-300 min-w-[28px] text-center">
                                {formatKey(k.trim())}
                              </kbd>
                            </span>
                          ))}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.04] bg-white/5">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-gray-800 text-gray-400">Esc</kbd> or click outside to close
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Format key display
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    Space: '␣',
    Escape: 'Esc',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    '←': '←',
    '→': '→',
  }
  return keyMap[key] || key
}
