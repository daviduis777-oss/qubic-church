'use client'

import {
  X,
  Box,
  FlipHorizontal,
  AlertTriangle,
  Film,
  Sparkles,
  Triangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ContactCubeInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactCubeInfoModal({
  isOpen,
  onClose,
}: ContactCubeInfoModalProps) {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-border max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-gold/10 to-gold/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold via-gold to-gold flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                What is Contact Cube?
              </h2>
              <p className="text-xs text-gray-400">
                Point Symmetry Visualization of Anna Matrix
              </p>
            </div>
          </div>
          <Button
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Overview */}
          <section>
            <h3 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
              <Box className="w-4 h-4" />
              The Anna Matrix
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              The Anna Matrix is a 128x128 grid (16,384 cells) that our team
              compiled by hand from the Anna bot&apos;s replies on X. Each cell
              contains a signed byte value (-128 to +127). This visualization
              folds the 2D matrix onto a 3D cube, inspired by the 1997 film
              &quot;Contact&quot;. The folding is a way of looking at the data,
              not a decoding.
            </p>
          </section>

          {/* Symmetry */}
          <section>
            <h3 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
              <FlipHorizontal className="w-4 h-4" />
              99.58% Point Symmetry
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              The matrix exhibits a Two&apos;s Complement identity: for 99.58%
              of all cells, the value at position (r, c) plus the value at the
              mirror position (127-r, 127-c) equals -1.
            </p>
            <div className="bg-black/50 p-3 border border-gold/20">
              <code className="text-gold text-sm font-mono">
                M[r][c] + M[127-r][127-c] = -1
              </code>
              <p className="text-xs text-gray-500 mt-2">
                16,316 of 16,384 cells follow this Two&apos;s Complement
                identity
              </p>
            </div>
          </section>

          {/* Anomalies */}
          <section>
            <h3 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              68 Anomaly Cells
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              Only 68 cells (0.41%) break the symmetry rule. They sit in a few
              short runs, in mirrored column pairs (any column c and its mirror
              127 - c sum to 127 by definition). The run around (22,22) and the
              column 30 run are very likely data-entry errors.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-black/50 p-2 border border-gold/20">
                <span className="text-gold font-mono">Cols 22+105:</span>
                <span className="text-white ml-2">13 pairs</span>
              </div>
              <div className="bg-black/50 p-2 border border-[#06B6D4]/20">
                <span className="text-[#06B6D4] font-mono">Cols 97+30:</span>
                <span className="text-white ml-2">18 pairs</span>
              </div>
              <div className="bg-black/50 p-2 border border-[#8B5CF6]/20">
                <span className="text-[#8B5CF6] font-mono">Cols 41+86:</span>
                <span className="text-white ml-2">2 pairs</span>
              </div>
              <div className="bg-black/50 p-2 border border-[#10B981]/20">
                <span className="text-[#10B981] font-mono">Cols 127+0:</span>
                <span className="text-white ml-2">1 pair</span>
              </div>
            </div>
          </section>

          {/* Special Position */}
          <section>
            <h3 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Special Position [22, 22]
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              The only position where the value equals its mirror value (both =
              100) instead of summing to -1. It sits inside a run of exceptions
              and is very likely an entry error in the typed table (see the
              re-check page).
            </p>
          </section>

          {/* XOR Triangle */}
          <section>
            <h3 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
              <Triangle className="w-4 h-4" />
              XOR Triangle
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              Three numbers form a closed XOR cycle: 100, 127 and 27. Any a XOR
              b = c gives such a cycle, so this is arithmetic with no meaning of
              its own.
            </p>
            <div className="bg-black/50 p-3 border border-gold/20 font-mono text-xs space-y-1">
              <div className="text-gold">100 XOR 127 = 27</div>
              <div className="text-gold">100 XOR 27 = 127</div>
              <div className="text-gold">27 XOR 127 = 100</div>
            </div>
          </section>

          {/* Contact Movie */}
          <section>
            <h3 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
              <Film className="w-4 h-4" />
              Contact (1997) Inspiration
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              In the film &quot;Contact&quot;, scientists receive a signal
              containing 2D pages that, when folded into a 3D cube using primer
              markers, reveal hidden blueprints. The cube view here borrows that
              idea as a visual only.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-black/30 flex justify-end">
          <Button
            className="bg-gradient-to-r from-gold to-gold hover:from-gold hover:to-gold text-white"
            onClick={onClose}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}

// Keyboard Shortcuts Modal
interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null

  const shortcuts = [
    { key: 'F', description: 'Toggle fullscreen' },
    { key: 'R', description: 'Reset camera' },
    { key: 'I', description: 'Show info modal' },
    { key: 'T', description: 'Toggle auto-tour' },
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'D', description: 'Toggle 3D depth' },
    { key: 'A', description: 'Toggle anomaly highlighting' },
    { key: 'M', description: 'Toggle registration markers' },
    { key: 'Space', description: 'Fold / Unfold cube' },
    { key: '1-5', description: 'Camera presets' },
    { key: 'Esc', description: 'Close modals / Deselect' },
  ]

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-border max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-gold" />
            Keyboard Shortcuts
          </h2>
          <Button
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-2">
          {shortcuts.map(({ key, description }) => (
            <div className="flex items-center justify-between py-1.5" key={key}>
              <span className="text-sm text-gray-300">{description}</span>
              <kbd className="px-2 py-1 bg-white/10 border border-border text-xs font-mono text-gold">
                {key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-center">
          <p className="text-xs text-gray-500">
            Use mouse to drag (rotate), scroll (zoom), and click cells to
            inspect
          </p>
        </div>
      </div>
    </div>
  )
}

import { Keyboard } from 'lucide-react'
export { Keyboard }
