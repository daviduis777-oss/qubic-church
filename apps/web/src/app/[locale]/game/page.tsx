'use client'

/**
 * /game - Fullscreen Anna Matrix RPG Game
 * Immersive exploration of the 128×128 neural network
 */

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { CosmicBackground } from '@/components/church/backgrounds/CosmicBackground'

// Dynamic import for the game (heavy component)
const AnnaMatrixGame = dynamic(
  () =>
    import('@/components/church/game/AnnaMatrixGame').then(
      mod => mod.AnnaMatrixGame
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-fg-2">Loading Anna Matrix…</p>
        </div>
      </div>
    ),
  }
)

export default function GamePage() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <CosmicBackground intensity="low" showStars />
      </div>

      {/* Game Container */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl">
          {/* Game Header */}
          <div className="text-center mb-6">
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Anna Matrix <span className="text-gold">Explorer</span>
            </h1>
            <p className="text-fg-2 text-sm md:text-base">
              Explore the 128×128 Anna Matrix as a game world.
              Earn rewards.
            </p>
          </div>

          {/* Game */}
          <div className="overflow-hidden border border-border">
            <AnnaMatrixGame />
          </div>

          {/* Instructions */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'W/↑', action: 'Move Up' },
              { key: 'S/↓', action: 'Move Down' },
              { key: 'A/←', action: 'Move Left' },
              { key: 'D/→', action: 'Move Right' },
            ].map(item => (
              <div
                className="flex items-center justify-center gap-2 border border-border bg-card px-3 py-2"
                key={item.key}
              >
                <kbd className="border border-border bg-surface-2 px-2 py-1 font-mono text-xs text-foreground">
                  {item.key}
                </kbd>
                <span className="text-xs text-fg-2">{item.action}</span>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 border border-border bg-card p-4">
            <h2 className="mb-2 font-semibold text-foreground">Tips</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-fg-2 marker:text-muted-foreground">
              <li>
                Visit <span className="text-orange-400">Row 21</span> - Input
                Layer
              </li>
              <li>
                Explore <span className="text-purple-400">Row 68</span> - the
                &ldquo;cortex&rdquo; row of the game lore
              </li>
              <li>
                Find <span className="text-green-400">Row 96</span> - Output
                Layer with 4 decision neurons
              </li>
              <li>Discover all 7 hidden patterns to maximize your score</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
