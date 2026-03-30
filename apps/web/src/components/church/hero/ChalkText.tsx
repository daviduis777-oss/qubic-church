'use client'

import { motion } from 'framer-motion'

interface ChalkMessage {
  text: string
  x: string
  y: string
  rotate?: number
  size?: string
  opacity?: string
  delay?: number
  mobileHidden?: boolean
  flicker?: boolean
}

const CHALK_MESSAGES: ChalkMessage[] = [
  {
    text: "Don't click",
    x: '3%',
    y: '16%',
    rotate: -14,
    size: 'text-2xl md:text-3xl',
    opacity: 'text-white/70',
    delay: 1.5,
  },
  {
    text: 'MADNESS!',
    x: '28%',
    y: '5%',
    rotate: 4,
    size: 'text-4xl md:text-5xl lg:text-6xl',
    opacity: 'text-white/75',
    delay: 1.8,
  },
  {
    text: "She doesn't\nsleep",
    x: '55%',
    y: '10%',
    rotate: -7,
    size: 'text-xl md:text-2xl lg:text-3xl',
    opacity: 'text-white/55',
    delay: 2.5,
  },
  {
    text: 'Ask\nMiners',
    x: '32%',
    y: '45%',
    rotate: 11,
    size: 'text-2xl md:text-3xl lg:text-4xl',
    opacity: 'text-white/55',
    delay: 3.0,
    mobileHidden: true,
  },
  {
    text: 'behind you!',
    x: '68%',
    y: '65%',
    rotate: -9,
    size: 'text-lg md:text-xl',
    opacity: 'text-white/45',
    delay: 3.5,
  },
  {
    text: 'He scares me',
    x: '6%',
    y: '55%',
    rotate: 5,
    size: 'text-lg md:text-xl',
    opacity: 'text-white/45',
    delay: 4.0,
    mobileHidden: true,
  },
  {
    text: 'tick tack',
    x: '18%',
    y: '76%',
    rotate: -12,
    size: 'text-xl md:text-2xl',
    opacity: 'text-white/35',
    delay: 4.5,
    mobileHidden: true,
  },
  {
    text: 'God ?',
    x: '33%',
    y: '87%',
    rotate: 6,
    size: 'text-base md:text-lg',
    opacity: 'text-white/28',
    delay: 5.0,
    mobileHidden: true,
  },
  {
    text: 'Jordan',
    x: '82%',
    y: '3%',
    rotate: -3,
    size: 'text-sm md:text-base',
    opacity: 'text-white/22',
    delay: 2.0,
    flicker: true,
  },
  {
    text: 'cfbtroll:',
    x: '44%',
    y: '40%',
    rotate: -8,
    size: 'text-sm md:text-base',
    opacity: 'text-white/18',
    delay: 5.5,
    mobileHidden: true,
    flicker: true,
  },
  {
    text: 'TC 369',
    x: '12%',
    y: '67%',
    rotate: 15,
    size: 'text-xs md:text-sm',
    opacity: 'text-white/15',
    delay: 5.0,
    mobileHidden: true,
    flicker: true,
  },
  {
    text: '10  10',
    x: '10%',
    y: '25%',
    rotate: -18,
    size: 'text-xs md:text-sm',
    opacity: 'text-white/15',
    delay: 3.0,
    mobileHidden: true,
    flicker: true,
  },
]

export function ChalkText() {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden" aria-hidden="true">
      {CHALK_MESSAGES.map((msg, i) => (
        <motion.span
          key={i}
          className={`absolute ${msg.size} ${msg.opacity ?? 'text-white/40'} select-none whitespace-pre-line ${
            msg.mobileHidden ? 'hidden md:block' : ''
          } ${msg.flicker ? 'animate-chalk-flicker' : ''}`}
          style={{
            left: msg.x,
            top: msg.y,
            fontFamily: 'var(--font-crayon), var(--font-handodle), cursive',
          }}
          initial={{ opacity: 0, scale: 0.8, rotate: msg.rotate ?? 0 }}
          animate={{ opacity: 1, scale: 1, rotate: msg.rotate ?? 0 }}
          transition={{
            delay: msg.delay ?? 0,
            duration: 1.5,
            ease: 'easeOut',
          }}
        >
          {msg.text}
        </motion.span>
      ))}
    </div>
  )
}
