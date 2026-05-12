'use client'

import { X, Box, FlipHorizontal, AlertTriangle, Film, Sparkles, Hash, Triangle, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ContactCubeInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactCubeInfoModal({ isOpen, onClose }: ContactCubeInfoModalProps) {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/[0.04] max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04] bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">What is Contact Cube?</h2>
              <p className="text-xs text-gray-400">Point Symmetry Visualization of Anna Matrix</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Overview */}
          <section>
            <h3 className="text-sm font-semibold text-[#D4AF37] mb-2 flex items-center gap-2">
              <Box className="w-4 h-4" />
              The Anna Matrix
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              The Anna Matrix is a 128x128 grid (16,384 cells) discovered in Qubic network data.
              Each cell contains a signed byte value (-128 to +127). The visualization folds this
              2D matrix into a 3D cube to reveal hidden patterns, inspired by the 1997 film
              &quot;Contact&quot;.
            </p>
          </section>

          {/* Symmetry */}
          <section>
            <h3 className="text-sm font-semibold text-[#D4AF37] mb-2 flex items-center gap-2">
              <FlipHorizontal className="w-4 h-4" />
              99.58% Point Symmetry
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              The matrix exhibits a Two&apos;s Complement identity: for 99.58% of all cells, the value
              at position (r, c) plus the value at the mirror position (127-r, 127-c) equals -1.
            </p>
            <div className="bg-black/50 p-3 border border-[#D4AF37]/20">
              <code className="text-[#D4AF37] text-sm font-mono">
                M[r][c] + M[127-r][127-c] = -1
              </code>
              <p className="text-xs text-gray-500 mt-2">
                16,316 of 16,384 cells follow this Two&apos;s Complement identity
              </p>
            </div>
          </section>

          {/* Anomalies */}
          <section>
            <h3 className="text-sm font-semibold text-[#D4AF37] mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              68 Anomaly Cells
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              Only 68 cells (0.41%) break the symmetry rule. These &quot;registration marks&quot; cluster
              in column pairs that sum to 127 (= 2^7 - 1, a Mersenne prime).
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-black/50 p-2 border border-[#D4AF37]/20">
                <span className="text-[#D4AF37] font-mono">Cols 22+105:</span>
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
            <h3 className="text-sm font-semibold text-[#D4AF37] mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Special Position [22, 22]
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              The only position where the value equals its mirror value (both = 100).
              A unique fixed point in the symmetry transformation where 22 + 105 = 127 (the mirror axis).
            </p>
          </section>

          {/* Genesis Connection */}
          <section>
            <h3 className="text-sm font-semibold text-[#06B6D4] mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Genesis Block Connection
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              The diagonal position matrix[72][72] = -27 links directly to Bitcoin&apos;s Genesis block.
              The Genesis public key begins with opcode PUSHBYTES_72 (0x41), and -27 is the address
              selection constant used in Bitcoin Script.
            </p>
            <div className="bg-black/50 p-3 border border-[#06B6D4]/20">
              <code className="text-[#06B6D4] text-sm font-mono">
                matrix[72][72] = -27
              </code>
              <p className="text-xs text-gray-500 mt-2">
                PUSHBYTES_72 diagonal = BTC address selection constant
              </p>
            </div>
          </section>

          {/* Period-4 Attractor */}
          <section>
            <h3 className="text-sm font-semibold text-[#D4AF37] mb-2 flex items-center gap-2">
              <Repeat className="w-4 h-4" />
              Period-4 Attractor
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              When the Genesis public key bytes are fed through Anna under direct ternary
              iteration T(v) = sign(M·v), the output settles into one of two period-4 cycles
              with sums (-42, +50, +38, -56) or (+42, -50, -38, +56). Verified on 100K random
              and 32K exhaustive HW≤2 samples; reproduced on 200/200 Anna inputs vs 1/800 in
              random null ensembles. The companion paper maps these phases onto a COOP-COOP-REST-REST
              behavioural cycle.
            </p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { tick: '1', sum: '-42', color: 'text-red-400' },
                { tick: '2', sum: '+50', color: 'text-emerald-400' },
                { tick: '3', sum: '+38', color: 'text-emerald-400' },
                { tick: '4', sum: '-56', color: 'text-red-400' },
              ].map((s) => (
                <div key={s.tick} className="bg-black/50 p-2 text-center border border-white/[0.06]">
                  <div className="text-gray-500 text-xs">Tick {s.tick}</div>
                  <div className={`font-mono font-bold ${s.color}`}>{s.sum}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Period-4 is Anna-specific under T(v) = sign(M·v): 0/800 random null matrices
              reproduce it (uniform, histogram, phase-random, and π/2-preserving nulls combined).
              Anna: 200/200. In the ALife simulation (5 seeds × 1M ticks), cooperation
              converges to 33.0 % ± 0.1 %.
            </p>
          </section>

          {/* XOR Triangle */}
          <section>
            <h3 className="text-sm font-semibold text-[#D4AF37] mb-2 flex items-center gap-2">
              <Triangle className="w-4 h-4" />
              XOR Triangle
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              Three numbers form a closed XOR cycle: the self-mirror value (100), the mirror axis (127),
              and the BTC address constant (27). Each pair XORs to produce the third.
            </p>
            <div className="bg-black/50 p-3 border border-[#D4AF37]/20 font-mono text-xs space-y-1">
              <div className="text-[#D4AF37]">100 XOR 127 = 27</div>
              <div className="text-[#D4AF37]">100 XOR 27 = 127</div>
              <div className="text-[#D4AF37]">27 XOR 127 = 100</div>
            </div>
          </section>

          {/* Contact Movie */}
          <section>
            <h3 className="text-sm font-semibold text-[#D4AF37] mb-2 flex items-center gap-2">
              <Film className="w-4 h-4" />
              Contact (1997) Inspiration
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              In the film &quot;Contact&quot;, scientists receive a signal containing 2D pages that,
              when folded into a 3D cube using primer markers, reveal hidden blueprints. The
              Anna Matrix&apos;s anomaly cells may serve as similar registration marks for 3D alignment.
            </p>
            <blockquote className="mt-3 p-3 bg-[#D4AF37]/10 border-l-2 border-[#D4AF37] italic text-sm text-[#D4AF37]">
              &quot;An alien intelligence is going to be more advanced. That means efficiency
              functioning on multiple levels and in multiple dimensions.&quot;
              <cite className="block text-xs text-[#D4AF37] mt-1 not-italic">— S.R. Hadden</cite>
            </blockquote>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.04] bg-black/30 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#D4AF37] text-white"
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

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
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
      <div className="bg-neutral-900 border border-white/[0.04] max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#D4AF37]" />
            Keyboard Shortcuts
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-2">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-300">{description}</span>
              <kbd className="px-2 py-1 bg-white/10 border border-white/[0.04] text-xs font-mono text-[#D4AF37]">
                {key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.04] text-center">
          <p className="text-xs text-gray-500">
            Use mouse to drag (rotate), scroll (zoom), and click cells to inspect
          </p>
        </div>
      </div>
    </div>
  )
}

import { Keyboard } from 'lucide-react'
export { Keyboard }
