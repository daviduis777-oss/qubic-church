'use client'

/**
 * ChurchModal - Full-screen modal overlay with HUD aesthetic
 * Used by homepage sections for immersive "deep read" experiences.
 *
 * Features:
 * - Dark overlay with backdrop blur
 * - Gold border
 * - Animated entrance/exit (Framer Motion + AnimatePresence)
 * - Escape key & backdrop click to close
 * - Body scroll lock while open
 * - Portal-rendered to avoid z-index issues
 */

import { useEffect, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface ChurchModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: string
  date?: string
  children: ReactNode
}

export function ChurchModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  date,
  children,
}: ChurchModalProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEsc])

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/88 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#060606] border border-[#D4AF37]/15"
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ scrollbarWidth: 'none' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="sticky top-0 right-0 float-right z-10 m-4 px-3 py-1.5 text-white/30 hover:text-[#D4AF37]/70 transition-colors text-xs uppercase tracking-[0.2em] border border-white/[0.06] hover:border-[#D4AF37]/25 bg-[#060606]/90 backdrop-blur-sm"
            >
              [ close ]
            </button>

            {/* Content area */}
            <div className="px-5 md:px-12 pb-10 pt-2 clear-both">
              {/* Modal header */}
              {subtitle && (
                <div className="text-[11px] text-[#5bc8f5]/50 uppercase tracking-[0.4em] mb-3">
                  {subtitle}
                </div>
              )}

              <div className="flex items-center gap-3 mb-2">
                {icon && (
                  <span className="text-[#D4AF37]/80 text-2xl">{icon}</span>
                )}
                <h2 className="text-2xl md:text-3xl text-[#D4AF37]/90 uppercase tracking-[0.15em] font-semibold">
                  {title}
                </h2>
              </div>

              {date && (
                <div className="text-[11px] text-[#5bc8f5]/40 uppercase tracking-[0.35em] mb-6">
                  {date}
                </div>
              )}

              {/* Gold rule */}
              <div className="w-14 h-px bg-gradient-to-r from-[#D4AF37]/60 to-transparent mb-8" />

              {/* Body content */}
              <div className="church-modal-body">{children}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/**
 * ModalTrigger - Reusable "Read More" button that opens a modal.
 * HUD-style with gold accents and hover animation.
 */
export function ModalTrigger({
  onClick,
  label = 'Read Full Section',
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      className="group inline-flex items-center gap-2 px-5 py-2.5 border border-white/[0.06] hover:border-[#D4AF37]/25 bg-transparent hover:bg-[#D4AF37]/[0.04] text-white/30 hover:text-[#D4AF37]/70 transition-all duration-400 text-[11px] uppercase tracking-[0.25em]"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-[#D4AF37]/20 group-hover:text-[#D4AF37]/50 transition-colors">
        +
      </span>
      {label}
    </motion.button>
  )
}
