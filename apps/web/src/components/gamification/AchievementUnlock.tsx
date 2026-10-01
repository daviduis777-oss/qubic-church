'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy } from 'lucide-react'
import {
  useGamification,
  ACHIEVEMENTS,
  type AchievementId,
} from './GamificationProvider'

const rarityColors = {
  common: 'from-slate-500 to-slate-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-gold to-purple-600',
  legendary: 'from-amber-500 to-orange-500',
}

const rarityGlow = {
  common: 'shadow-slate-500/30',
  rare: 'shadow-blue-500/30',
  epic: 'shadow-purple-500/30',
  legendary: 'shadow-amber-500/50',
}

const rarityLabel = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

export function AchievementUnlock() {
  const { state, dismissAchievementUnlock } = useGamification()
  const [showConfetti, setShowConfetti] = useState(false)

  const achievementId = state.showAchievementUnlock
  const achievement = achievementId ? ACHIEVEMENTS[achievementId] : null

  useEffect(() => {
    if (achievementId) {
      setShowConfetti(true)
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        dismissAchievementUnlock()
        setShowConfetti(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [achievementId, dismissAchievementUnlock])

  if (!achievement) return null

  const rarity = achievement.rarity

  return (
    <AnimatePresence>
      {achievementId && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={dismissAchievementUnlock}
        >
          {/* Confetti particles */}
          {showConfetti && <ConfettiParticles rarity={rarity} />}

          {/* Achievement card */}
          <motion.div
            animate={{ scale: 1, rotate: 0 }}
            className={`relative w-[300px] p-6 rounded-2xl bg-gradient-to-br ${rarityColors[rarity]} shadow-2xl ${rarityGlow[rarity]}`}
            exit={{ scale: 0, rotate: 10 }}
            initial={{ scale: 0, rotate: -10 }}
            onClick={e => e.stopPropagation()}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
          >
            {/* Close button */}
            <button
              className="absolute top-3 right-3 p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
              onClick={dismissAchievementUnlock}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Trophy icon */}
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ y: 0, opacity: 1 }}
                initial={{ y: -20, opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Trophy className="h-12 w-12 text-white drop-shadow-lg" />
              </motion.div>
            </div>

            {/* Achievement unlocked text */}
            <motion.p
              animate={{ y: 0, opacity: 1 }}
              className="text-center text-sm font-medium text-white/80 mb-2"
              initial={{ y: 10, opacity: 0 }}
              transition={{ delay: 0.3 }}
            >
              Achievement Unlocked!
            </motion.p>

            {/* Icon */}
            <motion.div
              animate={{ scale: [0, 1.3, 1] }}
              className="flex justify-center mb-3"
              initial={{ scale: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <span className="text-5xl">{achievement.icon}</span>
            </motion.div>

            {/* Name */}
            <motion.h3
              animate={{ y: 0, opacity: 1 }}
              className="text-center text-xl font-bold text-white mb-2"
              initial={{ y: 10, opacity: 0 }}
              transition={{ delay: 0.5 }}
            >
              {achievement.name}
            </motion.h3>

            {/* Description */}
            <motion.p
              animate={{ y: 0, opacity: 1 }}
              className="text-center text-sm text-white/80 mb-4"
              initial={{ y: 10, opacity: 0 }}
              transition={{ delay: 0.6 }}
            >
              {achievement.description}
            </motion.p>

            {/* Rarity badge */}
            <motion.div
              animate={{ scale: 1 }}
              className="flex justify-center"
              initial={{ scale: 0 }}
              transition={{ delay: 0.7, type: 'spring' }}
            >
              <span className="px-3 py-1 rounded-full bg-black/20 text-xs font-medium text-white uppercase tracking-wider">
                {rarityLabel[rarity]}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Confetti component
function ConfettiParticles({
  rarity,
}: {
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}) {
  const colors = {
    common: ['#94a3b8', '#cbd5e1', '#e2e8f0'],
    rare: ['#3b82f6', '#60a5fa', '#93c5fd'],
    epic: ['#a855f7', '#c084fc', '#d8b4fe'],
    legendary: ['#f59e0b', '#fbbf24', '#fcd34d', '#ef4444'],
  }

  const particleColors = colors[rarity]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => {
        const color = particleColors[i % particleColors.length]
        const startX = 50 + (Math.random() - 0.5) * 20
        const startY = 50
        const endX = startX + (Math.random() - 0.5) * 100
        const endY = startY + Math.random() * 80 + 20

        return (
          <motion.div
            animate={{
              scale: [0, 1, 1, 0],
              x: `${endX - startX}vw`,
              y: `${endY - startY}vh`,
              rotate: Math.random() * 720 - 360,
            }}
            className="absolute w-2 h-2 rounded-full"
            initial={{
              scale: 0,
              x: 0,
              y: 0,
              rotate: 0,
            }}
            key={i}
            style={{
              backgroundColor: color,
              left: `${startX}%`,
              top: `${startY}%`,
            }}
            transition={{
              duration: 1.5 + Math.random() * 0.5,
              delay: Math.random() * 0.3,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </div>
  )
}
