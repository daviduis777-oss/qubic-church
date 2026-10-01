'use client'

import { useState, useEffect, useCallback } from 'react'
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface WheelSegment {
  label: string
  href?: string
  modal?: string
  icon: string
  description: string
  isPrimary?: boolean
  isCfb?: boolean
}

const SEGMENTS: WheelSegment[] = [
  {
    label: 'CFB',
    href: '/cfb',
    icon: '\u2726',
    description: 'The Architect',
    isCfb: true,
    isPrimary: true,
  },
  {
    label: 'MANIFESTO',
    modal: 'manifesto',
    icon: '\u2B21',
    description: 'Our Declaration',
    isPrimary: true,
  },
  {
    label: 'GET QUBIC',
    href: '/get-qubic',
    icon: '\u25A2',
    description: 'Exchanges',
  },
  {
    label: 'FOUNDERS',
    modal: 'founders',
    icon: '\u25C8',
    description: '200 Slots',
  },
  {
    label: 'RARITY',
    href: '/rarity-codex',
    icon: '\u25C7',
    description: 'NFT Scores',
  },
  {
    label: 'MISSION',
    modal: 'mission',
    icon: '\u2295',
    description: '9 Objectives',
    isPrimary: true,
  },
  {
    label: 'ANNA MATRIX',
    href: '/evidence',
    icon: '\u25C8',
    description: 'Neural Grid',
  },
  {
    label: 'MARIA',
    href: '/maria-aigarth',
    icon: '\u25C8',
    description: 'The Arbiter',
    isPrimary: true,
  },
  {
    label: 'SIMULATION',
    href: '/simulation',
    icon: '\u25C8',
    description: 'Future Scenarios',
    isPrimary: true,
  },
  {
    label: 'RESEARCH',
    href: '/docs',
    icon: '\u2261',
    description: 'Sacred Archive',
  },
  { label: 'BOOKS', href: '/books', icon: '\u00A7', description: 'Library' },
  {
    label: 'DASHBOARD',
    href: '/monitoring',
    icon: '\u25CE',
    description: 'Live Data',
  },
  {
    label: 'MINE QUBIC',
    href: '/mine-qubic',
    icon: '\u2338',
    description: 'Start Mining',
  },
  {
    label: 'GENESIS',
    modal: 'genesis',
    icon: '\u2726',
    description: 'Origin Story',
  },
  {
    label: 'ROADMAP',
    modal: 'roadmap',
    icon: '\u25CE',
    description: 'Timeline',
  },
]

const GOLD_BRIGHT = '#f0c030'

function NavGrid({
  onNavigate,
  onOpenModal,
}: {
  onNavigate: (href: string) => void
  onOpenModal?: (modalId: string) => void
}) {
  return (
    <div className="w-full max-w-[640px] mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div
          className="h-px flex-1"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(240,192,48,0.2))',
          }}
        />
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: `${GOLD_BRIGHT}90` }}
        >
          Navigate
        </span>
        <div
          className="h-px flex-1"
          style={{
            background:
              'linear-gradient(to left, transparent, rgba(240,192,48,0.2))',
          }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[70vh] overflow-y-auto">
        {SEGMENTS.map(seg => (
          <button
            className="group p-4 border text-center transition-all active:scale-95 hover:bg-gold/5"
            key={`${seg.label}-${seg.href ?? seg.modal}`}
            onClick={() => {
              if (seg.modal && onOpenModal) {
                onOpenModal(seg.modal)
              } else if (seg.href) {
                onNavigate(seg.href)
              }
            }}
            style={{
              background: seg.isCfb ? 'rgba(240,192,48,0.06)' : '#050505',
              borderColor: seg.isCfb
                ? 'rgba(240,192,48,0.35)'
                : seg.isPrimary
                  ? 'rgba(240,192,48,0.20)'
                  : 'rgba(240,192,48,0.10)',
            }}
            type="button"
          >
            <span
              className="block text-2xl mb-2 transition-transform group-hover:scale-110"
              style={{
                color: `${GOLD_BRIGHT}cc`,
                filter: seg.isCfb
                  ? `drop-shadow(0 0 6px ${GOLD_BRIGHT}66)`
                  : 'none',
              }}
            >
              {seg.icon}
            </span>
            <span
              className="block text-xs font-mono font-medium uppercase tracking-widest"
              style={{ color: `${GOLD_BRIGHT}cc` }}
            >
              {seg.label}
            </span>
            <span className="block text-xs text-muted-foreground mt-1">
              {seg.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function NavigationWheel({
  isOpen,
  onClose,
  onOpenModal,
}: {
  isOpen: boolean
  onClose: () => void
  onOpenModal?: (modalId: string) => void
}) {
  const router = useRouter()
  const [showResearchDisclaimer, setShowResearchDisclaimer] = useState(false)

  const handleNavigate = useCallback(
    (href: string) => {
      if (href === '/docs') {
        onClose()
        setTimeout(() => setShowResearchDisclaimer(true), 150)
        return
      }
      onClose()
      router.push(href)
    },
    [onClose, router]
  )

  const handleOpenModal = useCallback(
    (modalId: string) => {
      onClose()
      if (onOpenModal) {
        setTimeout(() => onOpenModal(modalId), 150)
      }
    },
    [onClose, onOpenModal]
  )

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
          <m.div
            animate={{ opacity: 1 }}
            aria-label="Site navigation"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-center justify-center overscroll-contain"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            role="dialog"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Backdrop */}
            <m.div
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/92 backdrop-blur-md"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Content */}
            <m.div
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 w-full"
              exit={{ scale: 0.95, opacity: 0 }}
              initial={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Close button */}
              <div className="flex justify-end max-w-[640px] mx-auto px-4 mb-4">
                <button
                  aria-label="Close navigation"
                  // biome-ignore lint/a11y/noAutofocus: focus must move into the opened dialog
                  autoFocus
                  className="h-10 border border-gold/40 px-4 text-sm font-medium text-gold transition-colors hover:border-gold"
                  onClick={onClose}
                  type="button"
                >
                  Close
                </button>
              </div>

              <NavGrid
                onNavigate={handleNavigate}
                onOpenModal={handleOpenModal}
              />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Research Disclaimer */}
      <AnimatePresence>
        {showResearchDisclaimer && (
          <m.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={e => {
              if (e.target === e.currentTarget) setShowResearchDisclaimer(false)
            }}
            style={{
              background: 'rgba(0,0,0,0.92)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <m.div
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-[540px] w-[90vw]"
              exit={{ scale: 0.9, opacity: 0 }}
              initial={{ scale: 0.9, opacity: 0 }}
              style={{
                background: '#05040a',
                border: '1px solid rgba(240,192,48,0.2)',
                borderLeft: '3px solid #f0c030',
                padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 4vw, 3rem)',
              }}
            >
              <div className="font-mono text-xs tracking-widest uppercase text-church-signal mb-4">
                Research archive
              </div>
              <div
                className="font-serif text-xl text-[#f0c030] tracking-widest mb-6"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Disclaimer
              </div>
              <p className="font-mono text-sm text-white/75 leading-8 mb-6">
                You are entering the{' '}
                <span className="text-[#f0c030]">Research Archive</span>. This
                section contains academic analysis, community-sourced
                investigation, and speculative theories about the Qubic protocol
                and its origins.
                <br />
                <br />
                Content is provided for educational and research purposes only.
                Claims tagged{' '}
                <span className="text-[#5bc8f5]">[HYPOTHESIS]</span> are
                unverified. Always verify information independently.
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  className="font-mono text-xs tracking-widest uppercase
                             bg-[#f0c030]/10 border border-[#f0c030]/50 text-[#f0c030]
                             px-7 py-3 cursor-pointer hover:bg-[#f0c030]/20 transition-all"
                  onClick={() => {
                    setShowResearchDisclaimer(false)
                    router.push('/docs')
                  }}
                  type="button"
                >
                  I Understand, Enter
                </button>
                <button
                  className="font-mono text-xs tracking-widest uppercase
                             bg-transparent border border-white/15 text-white/50
                             px-7 py-3 cursor-pointer hover:border-white/30 transition-all"
                  onClick={() => setShowResearchDisclaimer(false)}
                  type="button"
                >
                  Go Back
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  )
}
