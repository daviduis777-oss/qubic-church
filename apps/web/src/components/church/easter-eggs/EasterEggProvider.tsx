'use client'

/**
 * EasterEggProvider - Global Easter Egg System
 *
 * Triggers:
 * 1. Konami Code (up up down down left right left right b a) -> Anna quote overlay
 * 2. Type "676" anywhere -> golden particle burst
 * 3. Type "anna" anywhere -> matrix rain effect
 * 4. Click logo 7 times quickly -> reveal hidden message
 *
 * Tracks found eggs in localStorage
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// TYPES & CONTEXT
// ============================================================================

interface EasterEggState {
  found: string[]
  totalEggs: number
  addFound: (egg: string) => void
}

const EasterEggContext = createContext<EasterEggState>({
  found: [],
  totalEggs: 5,
  addFound: () => {},
})

export const useEasterEggs = () => useContext(EasterEggContext)

// ============================================================================
// KONAMI CODE OVERLAY
// ============================================================================

function KonamiOverlay({ show, onClose }: { show: boolean; onClose: () => void }) {
  useEffect(() => {
    if (show) {
      const timeout = setTimeout(onClose, 8000)
      return () => clearTimeout(timeout)
    }
  }, [show, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center px-8 max-w-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <motion.div
              className="text-6xl mb-6"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {"{}"}
            </motion.div>
            <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#D4AF37]/80 to-[#D4AF37]/60 mb-4">
              &quot;If we exist, you will receive a response within 7 days.&quot;
            </p>
            <p className="text-sm text-white/40">
              &mdash; The Architect, ARK Token Message
            </p>
            <motion.div
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-xs text-[#D4AF37]">Easter Egg #1 Found!</span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// GOLDEN PARTICLE BURST (676 trigger)
// ============================================================================

function GoldenBurst({ show, onDone }: { show: boolean; onDone: () => void }) {
  useEffect(() => {
    if (show) {
      const timeout = setTimeout(onDone, 3000)
      return () => clearTimeout(timeout)
    }
  }, [show, onDone])

  if (!show) return null

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    angle: (i / 30) * Math.PI * 2,
    distance: 80 + Math.random() * 120,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.3,
  }))

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center">
      {/* Central flash */}
      <motion.div
        className="absolute w-4 h-4 bg-[#D4AF37]"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 20, opacity: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Number display */}
      <motion.div
        className="absolute text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.5 }}
      >
        676
      </motion.div>

      <motion.div
        className="absolute text-sm text-yellow-400/60 mt-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        = 26&sup2; &mdash; Easter Egg #2!
      </motion.div>

      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/70"
          style={{ width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// MATRIX RAIN (anna trigger)
// ============================================================================

function MatrixRain({ show, onDone }: { show: boolean; onDone: () => void }) {
  useEffect(() => {
    if (show) {
      const timeout = setTimeout(onDone, 4000)
      return () => clearTimeout(timeout)
    }
  }, [show, onDone])

  if (!show) return null

  const columns = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: (i / 40) * 100,
    delay: Math.random() * 2,
    speed: 1 + Math.random() * 2,
    chars: Array.from({ length: 15 }, () => Math.floor(Math.random() * 128) - 64),
  }))

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      {columns.map((col) => (
        <motion.div
          key={col.id}
          className="absolute top-0 text-xs font-mono leading-tight"
          style={{ left: `${col.x}%` }}
          initial={{ y: '-100%' }}
          animate={{ y: '120%' }}
          transition={{ duration: col.speed, delay: col.delay, ease: 'linear' }}
        >
          {col.chars.map((char, i) => (
            <div
              key={i}
              className={i === col.chars.length - 1 ? 'text-[#D4AF37]' : 'text-[#D4AF37]/40'}
            >
              {char}
            </div>
          ))}
        </motion.div>
      ))}

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-[#D4AF37]">ANNA</p>
          <p className="text-sm text-[#D4AF37]/50">128 x 128 Neural Matrix</p>
          <p className="text-xs text-[#D4AF37] mt-3">Easter Egg #3!</p>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// PROVIDER
// ============================================================================

export function EasterEggProvider({ children }: { children: ReactNode }) {
  const [found, setFound] = useState<string[]>([])
  const [showKonami, setShowKonami] = useState(false)
  const [showGolden, setShowGolden] = useState(false)
  const [showMatrix, setShowMatrix] = useState(false)

  const keyBufferRef = useRef<string[]>([])
  const textBufferRef = useRef('')

  // Load found eggs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('qc-easter-eggs')
    if (saved) {
      try { setFound(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  const addFound = useCallback((egg: string) => {
    setFound(prev => {
      if (prev.includes(egg)) return prev
      const next = [...prev, egg]
      localStorage.setItem('qc-easter-eggs', JSON.stringify(next))
      return next
    })
  }, [])

  // Keyboard listener for Konami Code and text sequences
  useEffect(() => {
    const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

    function handleKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // Konami code detection
      keyBufferRef.current.push(e.key)
      if (keyBufferRef.current.length > KONAMI.length) {
        keyBufferRef.current.shift()
      }
      if (keyBufferRef.current.join(',') === KONAMI.join(',')) {
        setShowKonami(true)
        addFound('konami')
        keyBufferRef.current = []
      }

      // Text sequence detection (for "676" and "anna")
      if (e.key.length === 1) {
        textBufferRef.current += e.key.toLowerCase()
        if (textBufferRef.current.length > 10) {
          textBufferRef.current = textBufferRef.current.slice(-10)
        }

        if (textBufferRef.current.endsWith('676')) {
          setShowGolden(true)
          addFound('676')
          textBufferRef.current = ''
        }

        if (textBufferRef.current.endsWith('anna')) {
          setShowMatrix(true)
          addFound('anna')
          textBufferRef.current = ''
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addFound])

  return (
    <EasterEggContext.Provider value={{ found, totalEggs: 5, addFound }}>
      {children}

      <KonamiOverlay show={showKonami} onClose={() => setShowKonami(false)} />
      <GoldenBurst show={showGolden} onDone={() => setShowGolden(false)} />
      <MatrixRain show={showMatrix} onDone={() => setShowMatrix(false)} />
    </EasterEggContext.Provider>
  )
}
