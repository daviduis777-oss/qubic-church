'use client'

import { Component, useState, useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import dynamic from 'next/dynamic'
import { ChevronDown } from 'lucide-react'
import { BitcoinLogoSVG, QubicLogoSVG } from '@/components/logos'
import { GlitchText } from '@/components/ui/GlitchText'

// Dynamic import for Hyperspeed - preload for instant display
const Hyperspeed = dynamic(() => import('@/components/Hyperspeed'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />,
})

/** Keeps the page alive if the WebGL background fails on this device. */
class BackgroundBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function canUseWebGL() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    // Phones get the still hero: the bloom pass is too heavy there.
    if (window.innerWidth < 768) return false
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

// Hyperspeed configuration with Bitcoin orange & Qubic purple
const HYPERSPEED_CONFIG = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 9,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 30,
  lightPairsPerRoadWay: 30,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [400 * 0.05, 400 * 0.15],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.2, 0.2],
  carFloorSeparation: [0.05, 1],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0x131318,
    brokenLines: 0x131318,
    leftCars: [0x8b4513, 0xa0522d, 0xd2691e],
    rightCars: [0x1a1f4d, 0x2c3e80, 0x1e3a5f],
    sticks: 0x2c3e80,
  },
}

// Typewriter hook
function useTypewriter(text: string, isActive: boolean, speed: number = 35) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    if (!isActive) {
      setDisplayedText('')
      return
    }

    let index = 0
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, isActive, speed])

  return displayedText
}

export function Phase01_TheVoid() {
  const [showContent, setShowContent] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [webgl, setWebgl] = useState(false)
  // The WebGL road renders only while the hero is on screen; scrolled past, it is disposed.
  const hero = useRef<HTMLElement>(null)
  const heroInView = useInView(hero, { amount: 0.05 })

  useEffect(() => {
    setMounted(true)
    setWebgl(canUseWebGL())
    const timer = setTimeout(() => setShowContent(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  const headline1 = useTypewriter('Something was hidden', mounted, 30)
  const headline2 = useTypewriter(
    'in plain sight',
    mounted && headline1.length >= 20,
    30
  )

  return (
    <section
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black"
      id="phase-void"
      ref={hero}
    >
      {/* Permanent black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Hyperspeed Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {webgl && heroInView && (
          <BackgroundBoundary>
            <Hyperspeed effectOptions={HYPERSPEED_CONFIG} />
          </BackgroundBoundary>
        )}
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none z-[3]" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pb-32 pt-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo Header */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-6 mb-8"
            initial={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              initial={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <BitcoinLogoSVG size={52} />
            </motion.div>

            <motion.div
              animate={{ scaleX: 1 }}
              className="w-20 h-[2px] bg-gradient-to-r from-gold via-white/30 to-gold"
              initial={{ scaleX: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            />

            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              initial={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <QubicLogoSVG size={52} />
            </motion.div>
          </motion.div>

          {/* Main headline with typewriter + glitch - RARE glitches */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-white block drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]">
                <GlitchText
                  glitchDuration={2000}
                  maxInterval={25000}
                  minInterval={15000}
                >
                  {headline1 || '\u00A0'}
                </GlitchText>
                {headline1.length > 0 && headline1.length < 20 && (
                  <span className="animate-pulse text-gold">|</span>
                )}
              </span>
              <span className="text-white/70 block mt-2 drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]">
                <GlitchText
                  glitchDuration={1500}
                  maxInterval={30000}
                  minInterval={20000}
                >
                  {headline2 || '\u00A0'}
                </GlitchText>
                {headline1.length >= 20 &&
                  headline2.length > 0 &&
                  headline2.length < 14 && (
                    <span className="animate-pulse text-gold">|</span>
                  )}
              </span>
            </h1>
          </div>

          {/* Time indicator with glow */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-block relative">
                  <span className="text-xl md:text-2xl text-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                    <span className="text-gold font-mono font-bold text-2xl md:text-3xl relative">
                      2000 &rarr; 13.04.2027
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        className="absolute inset-0 bg-gold/30 blur-xl rounded-full"
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Story intro */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mx-auto"
                initial={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-black/50 backdrop-blur-md px-6 py-5 border border-white/10">
                  <p className="text-base md:text-lg text-white/90 leading-relaxed">
                    In <span className="text-white font-semibold">2000</span> a
                    programmer signed his first articles as{' '}
                    <span className="text-gold font-semibold">Come-from-Beyond</span>.
                    In <span className="text-white font-semibold">2009</span> someone
                    calling himself Satoshi Nakamoto launched Bitcoin and later
                    vanished.
                  </p>
                  <p className="text-base md:text-lg text-white/70 leading-relaxed mt-3">
                    Twenty-six years, one line of work, and a date he keeps
                    repeating. This is the road between them, and halfway down
                    it a door marked Satoshi Nakamoto.
                  </p>
                  <motion.p
                    animate={{ opacity: 1 }}
                    className="text-sm text-gold italic mt-3 font-medium"
                    initial={{ opacity: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Some doors on this road are still open.
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ opacity: showContent ? 1 : 0 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <span className="text-white/60 text-xs tracking-widest uppercase font-medium">
            Walk the road
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            className="relative"
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-white/70" />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-20" />
    </section>
  )
}
