'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'


/**
 * Shown once per browser session before the Road to The Day.
 * The page itself is rendered underneath, so readers without JavaScript
 * and search engines still get the full text.
 */
interface DisclaimerGateProps {
  storageKey?: string
  title?: string
  eyebrow?: string
  children?: ReactNode
  linkHref?: string
  linkLabel?: string
}

export function DisclaimerGate({
  storageKey = 'qc-road-disclaimer',
  title = 'The Road to The Day',
  eyebrow = 'Before you enter',
  children,
  linkHref,
  linkLabel,
}: DisclaimerGateProps = {}) {
  const KEY = storageKey
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(KEY) === '1'
    } catch {}
    if (!seen) setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    button.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const enter = () => {
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {}
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          aria-labelledby="road-disclaimer-title"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 px-4 backdrop-blur-md"
          exit={{ opacity: 0 }}
          initial={{ opacity: 1 }}
          role="dialog"
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl border border-gold/30 bg-[#070707] p-6 md:p-10"
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
            <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl" id="road-disclaimer-title">
              {title}
            </h2>
            <div className="mt-5 space-y-3 text-base leading-relaxed text-white/75">
              {children ?? <p className="text-xl text-white/90">Use your head.</p>}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                className="bg-gold px-6 py-3 font-semibold uppercase tracking-wider text-black transition-colors hover:bg-gold-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                onClick={enter}
                ref={button}
                type="button"
              >
                Enter
              </button>
              {linkHref && linkLabel && (
                <Link className="text-sm text-white/50 underline decoration-white/20 underline-offset-4 hover:text-white" href={linkHref}>
                  {linkLabel}
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
