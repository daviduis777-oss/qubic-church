'use client'

/**
 * TreasureHuntProvider - Hidden Fragment Discovery System
 *
 * 10 hidden "fragments" scattered across the site.
 * Each fragment is a small glowing symbol that reveals a clue when clicked.
 * Progress is tracked in localStorage and shown via a floating indicator.
 *
 * Fragments are placed by wrapping content with <HiddenFragment id="..." />
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// FRAGMENT DATA
// ============================================================================

export interface FragmentData {
  id: string
  symbol: string
  clue: string
  location: string // human-readable hint
}

export const FRAGMENTS: FragmentData[] = [
  {
    id: 'genesis',
    symbol: '\u2727', // ✧
    clue: 'Proof of Existence.',
    location: 'Homepage',
  },
  {
    id: 'oracle',
    symbol: '\u2726', // ✦
    clue: 'Row 6 holds the key.',
    location: 'Research',
  },
  {
    id: 'architect',
    symbol: '\u29BE', // ⦾
    clue: '676 = 26\u00B2 \u2014 not a coincidence.',
    location: 'Docs',
  },
  {
    id: 'symmetry',
    symbol: '\u2B21', // ⬡
    clue: '99.58% point symmetry across 128\u00D7128.',
    location: 'Anna Matrix',
  },
  {
    id: 'bridge',
    symbol: '\u2B22', // ⬢
    clue: 'Block 2028: 6212 days to ARK.',
    location: 'Evidence',
  },
  {
    id: 'signal',
    symbol: '\u25C8', // ◈
    clue: 'M[8,74], M[9,75], M[10,76] = K, e, y on the diagonal.',
    location: 'NFT Collection',
  },
  {
    id: 'exodus',
    symbol: '\u2B25', // ⬥
    clue: 'It is accomplished.',
    location: 'Giveaway',
  },
  {
    id: 'ternary',
    symbol: '\u2B23', // ⬣
    clue: 'Not binary. Never was.',
    location: 'Get Qubic',
  },
  {
    id: 'resonance',
    symbol: '\u29BF', // ⦿
    clue: '128 mod 26 = 24. The loop closes.',
    location: 'Mine Qubic',
  },
  {
    id: 'ark',
    symbol: '\u2B50', // ⭐
    clue: 'Supply = 2028 = 3 \u00D7 676.',
    location: 'Hidden',
  },
]

// ============================================================================
// CONTEXT
// ============================================================================

interface TreasureHuntState {
  foundFragments: string[]
  totalFragments: number
  discoverFragment: (id: string) => void
  isFound: (id: string) => boolean
  showTracker: boolean
  setShowTracker: (show: boolean) => void
}

const TreasureHuntContext = createContext<TreasureHuntState>({
  foundFragments: [],
  totalFragments: FRAGMENTS.length,
  discoverFragment: () => {},
  isFound: () => false,
  showTracker: false,
  setShowTracker: () => {},
})

export const useTreasureHunt = () => useContext(TreasureHuntContext)

// ============================================================================
// FRAGMENT COMPONENT (place these across pages)
// ============================================================================

export function HiddenFragment({
  id,
  children,
}: {
  id: string
  children?: ReactNode
}) {
  const { discoverFragment, isFound } = useTreasureHunt()
  const [showReveal, setShowReveal] = useState(false)
  const found = isFound(id)
  const fragment = FRAGMENTS.find(f => f.id === id)

  if (!fragment) return children ?? null

  const handleClick = () => {
    if (!found) {
      discoverFragment(id)
    }
    setShowReveal(true)
    setTimeout(() => setShowReveal(false), 4000)
  }

  return (
    <span className="relative inline-block">
      {children}

      {/* The hidden fragment icon */}
      <motion.button
        className={`
          inline-flex items-center justify-center
          w-6 h-6 text-xs cursor-pointer
          transition-all duration-300
          ${
            found
              ? 'bg-gold/20 text-gold border border-gold/30'
              : 'bg-white/5 text-muted-foreground hover:text-gold hover:bg-gold/10 border border-transparent hover:border-gold/20'
          }
        `}
        onClick={handleClick}
        title={found ? `Fragment: ${fragment.clue}` : 'Something hidden...'}
        whileHover={{ scale: 1.3 }}
        whileTap={{ scale: 0.9 }}
      >
        {fragment.symbol}
      </motion.button>

      {/* Reveal popup */}
      <AnimatePresence>
        {showReveal && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
          >
            <div className="bg-black/90 border border-gold/30 px-4 py-3 text-center min-w-[200px] backdrop-blur-sm">
              <p className="text-gold text-lg mb-1">{fragment.symbol}</p>
              <p className="text-white/90 text-sm font-medium">
                {fragment.clue}
              </p>
              {!found && (
                <p className="text-gold text-xs mt-2">Fragment discovered!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

// ============================================================================
// FLOATING PROGRESS TRACKER
// ============================================================================

function TreasureTracker() {
  const { foundFragments, totalFragments, showTracker, setShowTracker } =
    useTreasureHunt()
  const count = foundFragments.length

  // Don't show if nothing found yet
  if (count === 0) return null

  const progress = (count / totalFragments) * 100
  const allFound = count === totalFragments

  return (
    <>
      {/* Minimized indicator (always visible after first find) */}
      <motion.button
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-[9000] flex items-center gap-2 px-3 py-2 bg-black/80 border border-gold/30 backdrop-blur-sm cursor-pointer hover:border-gold/50 transition-colors"
        initial={{ opacity: 0, scale: 0, y: 20 }}
        onClick={() => setShowTracker(!showTracker)}
        whileHover={{ scale: 1.05 }}
      >
        <span className="text-gold text-sm">
          {allFound ? '\u2B50' : '\u2727'}
        </span>
        <span className="text-white/70 text-xs font-mono">
          {count}/{totalFragments}
        </span>
        {allFound && (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            className="text-xs text-gold"
            transition={{ duration: 2, repeat: Infinity }}
          >
            Complete!
          </motion.span>
        )}
      </motion.button>

      {/* Expanded tracker panel */}
      <AnimatePresence>
        {showTracker && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="fixed bottom-20 right-6 z-[9000] w-72 bg-black/95 border border-gold/20 backdrop-blur-md overflow-hidden"
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">
                Fragment Collection
              </h3>
              <div className="mt-2 h-1.5 bg-white/10 overflow-hidden">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-gold to-gold/70"
                  initial={{ width: 0 }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {count} of {totalFragments} fragments found
              </p>
            </div>

            {/* Fragment list */}
            <div className="px-4 py-2 max-h-60 overflow-y-auto">
              {FRAGMENTS.map(fragment => {
                const discovered = foundFragments.includes(fragment.id)
                return (
                  <div
                    className={`flex items-center gap-3 py-2 ${
                      discovered ? 'opacity-100' : 'opacity-30'
                    }`}
                    key={fragment.id}
                  >
                    <span
                      className={`text-lg ${discovered ? 'text-gold' : 'text-muted-foreground'}`}
                    >
                      {discovered ? fragment.symbol : '?'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs truncate ${discovered ? 'text-white/80' : 'text-muted-foreground'}`}
                      >
                        {discovered ? fragment.clue : '???'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fragment.location}
                      </p>
                    </div>
                    {discovered && (
                      <span className="text-gold text-xs">Found</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            {allFound && (
              <div className="px-4 py-3 border-t border-gold/20 bg-gold/5">
                <p className="text-xs text-gold text-center font-medium">
                  All fragments collected! The Architect acknowledges you.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================================================
// PROVIDER
// ============================================================================

const STORAGE_KEY = 'qc-treasure-hunt'

export function TreasureHuntProvider({ children }: { children: ReactNode }) {
  const [foundFragments, setFoundFragments] = useState<string[]>([])
  const [showTracker, setShowTracker] = useState(false)

  const loadedRef = useRef(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setFoundFragments(JSON.parse(saved))
    } catch {
      /* storage unavailable or corrupt: start empty */
    }
    loadedRef.current = true
  }, [])

  // Persist after the initial load, outside the state updater
  useEffect(() => {
    if (!loadedRef.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foundFragments))
    } catch {
      /* storage unavailable: progress lives for this visit only */
    }
  }, [foundFragments])

  const discoverFragment = useCallback((id: string) => {
    setFoundFragments(prev => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const isFound = useCallback(
    (id: string) => foundFragments.includes(id),
    [foundFragments]
  )

  return (
    <TreasureHuntContext.Provider
      value={{
        foundFragments,
        totalFragments: FRAGMENTS.length,
        discoverFragment,
        isFound,
        showTracker,
        setShowTracker,
      }}
    >
      {children}
      <TreasureTracker />
    </TreasureHuntContext.Provider>
  )
}
