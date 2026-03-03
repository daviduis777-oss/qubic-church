'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { ChevronDown } from 'lucide-react'
import { BitcoinLogoSVG, QubicLogoSVG } from '@/components/logos'
import { GlitchText } from '@/components/ui/GlitchText'

// Dynamic import for Hyperspeed - preload for instant display
const Hyperspeed = dynamic(() => import('@/components/Hyperspeed'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />,
})

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
    leftCars: [0x8B4513, 0xA0522D, 0xD2691E],
    rightCars: [0x1a1f4d, 0x2c3e80, 0x1e3a5f],
    sticks: 0x2c3e80
  }
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

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setShowContent(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  const headline1 = useTypewriter('Something was hidden', mounted, 30)
  const headline2 = useTypewriter('in plain sight', mounted && headline1.length >= 20, 30)

  return (
    <section
      id="phase-void"
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black"
    >
      {/* Permanent black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Hyperspeed Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <Hyperspeed effectOptions={HYPERSPEED_CONFIG} />
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.5) 100%)'
        }}
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none z-[3]" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pb-32 pt-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo Header */}
          <motion.div
            className="flex items-center justify-center gap-6 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <BitcoinLogoSVG size={52} />
            </motion.div>

            <motion.div
              className="w-20 h-[2px] bg-gradient-to-r from-[#D4AF37] via-white/30 to-[#D4AF37]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
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
                  minInterval={15000}
                  maxInterval={25000}
                  glitchDuration={2000}
                >
                  {headline1 || '\u00A0'}
                </GlitchText>
                {headline1.length > 0 && headline1.length < 20 && (
                  <span className="animate-pulse text-[#D4AF37]">|</span>
                )}
              </span>
              <span className="text-white/70 block mt-2 drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]">
                <GlitchText
                  minInterval={20000}
                  maxInterval={30000}
                  glitchDuration={1500}
                >
                  {headline2 || '\u00A0'}
                </GlitchText>
                {headline1.length >= 20 && headline2.length > 0 && headline2.length < 14 && (
                  <span className="animate-pulse text-[#D4AF37]">|</span>
                )}
              </span>
            </h1>
          </div>

          {/* Time indicator with glow */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="inline-block relative">
                  <span className="text-xl md:text-2xl text-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                    For{' '}
                    <span className="text-[#D4AF37] font-mono font-bold text-2xl md:text-3xl relative">
                      17 years
                      <motion.span
                        className="absolute inset-0 bg-[#D4AF37]/30 blur-xl rounded-full"
                        animate={{ opacity: [0.5, 1, 0.5] }}
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-xl mx-auto"
              >
                <div className="bg-black/50 backdrop-blur-md px-6 py-5 border border-white/10">
                  <p className="text-base md:text-lg text-white/90 leading-relaxed">
                    In <span className="text-white font-semibold">2009</span>, an anonymous genius created{' '}
                    <span className="text-[#D4AF37] font-semibold">Bitcoin</span> —
                    a revolutionary digital currency that would change the world.
                  </p>
                  <p className="text-base md:text-lg text-white/70 leading-relaxed mt-3">
                    But hidden within the very first blocks of Bitcoin's blockchain,
                    a mathematical pattern was waiting to be discovered...
                  </p>
                  <motion.p
                    className="text-sm text-[#D4AF37] italic mt-3 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    A pattern that connects to something that didn't exist yet.
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <span className="text-white/60 text-xs tracking-[0.2em] uppercase font-medium">
            Begin the Investigation
          </span>
          <motion.div
            className="relative"
            animate={{ y: [0, 6, 0] }}
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
