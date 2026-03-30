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
  { label: 'CFB', href: '/cfb', icon: '\u2726', description: 'The Architect', isCfb: true, isPrimary: true },
  { label: 'MANIFESTO', modal: 'manifesto', icon: '\u2B21', description: 'Our Declaration', isPrimary: true },
  { label: 'GET QUBIC', href: '/get-qubic', icon: '\u25A2', description: 'Exchanges' },
  { label: 'FOUNDERS', modal: 'founders', icon: '\u25C8', description: '200 Slots' },
  { label: 'RARITY', href: '/rarity-codex', icon: '\u25C7', description: 'NFT Scores' },
  { label: 'MISSION', modal: 'mission', icon: '\u2295', description: '9 Objectives', isPrimary: true },
  { label: 'ANNA MATRIX', href: '/evidence', icon: '\u25C8', description: 'Neural Grid' },
  { label: 'MARIA', href: '/maria-aigarth', icon: '\u25C8', description: 'The Arbiter', isPrimary: true },
  { label: 'SIMULATION', href: '/simulation', icon: '\u25C8', description: 'Future Scenarios', isPrimary: true },
  { label: 'RESEARCH', href: '/docs', icon: '\u2261', description: 'Sacred Archive' },
  { label: 'BOOKS', href: '/books', icon: '\u00A7', description: 'Library' },
  { label: 'DASHBOARD', href: '/monitoring', icon: '\u25CE', description: 'Live Data' },
  { label: 'MINE QUBIC', href: '/mine-qubic', icon: '\u2338', description: 'Start Mining' },
  { label: 'GENESIS', modal: 'genesis', icon: '\u2726', description: 'Origin Story' },
  { label: 'ROADMAP', modal: 'roadmap', icon: '\u25CE', description: 'Timeline' },
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
        <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, rgba(240,192,48,0.2))` }} />
        <span className="font-mono text-xs uppercase tracking-[0.4em]" style={{ color: `${GOLD_BRIGHT}90` }}>
          Navigate
        </span>
        <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, rgba(240,192,48,0.2))` }} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[70vh] overflow-y-auto">
        {SEGMENTS.map((seg) => (
          <button
            key={`${seg.label}-${seg.href ?? seg.modal}`}
            onClick={() => {
              if (seg.modal && onOpenModal) {
                onOpenModal(seg.modal)
              } else if (seg.href) {
                onNavigate(seg.href)
              }
            }}
            className="group p-4 border text-center transition-all active:scale-95 hover:bg-[#D4AF37]/5"
            style={{
              background: seg.isCfb ? 'rgba(240,192,48,0.06)' : '#050505',
              borderColor: seg.isCfb ? 'rgba(240,192,48,0.35)' : seg.isPrimary ? 'rgba(240,192,48,0.20)' : 'rgba(240,192,48,0.10)',
            }}
          >
            <span
              className="block text-2xl mb-2 transition-transform group-hover:scale-110"
              style={{
                color: `${GOLD_BRIGHT}cc`,
                filter: seg.isCfb ? `drop-shadow(0 0 6px ${GOLD_BRIGHT}66)` : 'none',
              }}
            >
              {seg.icon}
            </span>
            <span
              className="block text-[11px] font-mono font-medium uppercase tracking-[0.15em]"
              style={{ color: `${GOLD_BRIGHT}cc` }}
            >
              {seg.label}
            </span>
            <span className="block text-[10px] text-white/30 mt-1">
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
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <m.div
            className="absolute inset-0 bg-black/92 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <m.div
            className="relative z-10 w-full"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <div className="flex justify-end max-w-[640px] mx-auto px-4 mb-4">
              <button
                onClick={onClose}
                className="p-2 text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors font-mono text-xs uppercase tracking-[0.4em] border border-[#D4AF37]/25 px-4 py-2"
                aria-label="Close navigation"
              >
                [ CLOSE ]
              </button>
            </div>

            <NavGrid onNavigate={handleNavigate} onOpenModal={handleOpenModal} />
          </m.div>
        </m.div>
      )}
    </AnimatePresence>

      {/* Research Disclaimer */}
      <AnimatePresence>
        {showResearchDisclaimer && (
          <m.div
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowResearchDisclaimer(false) }}
          >
            <m.div
              className="max-w-[540px] w-[90vw]"
              style={{
                background: '#05040a',
                border: '1px solid rgba(240,192,48,0.2)',
                borderLeft: '3px solid #f0c030',
                padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 4vw, 3rem)',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="font-mono text-[0.6rem] tracking-[0.4em] uppercase text-[#3a7090] mb-4">
                // Research Archive
              </div>
              <div className="font-serif text-xl text-[#f0c030] tracking-[0.15em] mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
                Disclaimer
              </div>
              <p className="font-mono text-sm text-white/75 leading-8 mb-6">
                You are entering the <span className="text-[#f0c030]">Research Archive</span>.
                This section contains academic analysis, community-sourced investigation,
                and speculative theories about the Qubic protocol and its origins.
                <br /><br />
                Content is provided for educational and research purposes only.
                Claims tagged <span className="text-[#5bc8f5]">[HYPOTHESIS]</span> are
                unverified. Always verify information independently.
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => { setShowResearchDisclaimer(false); router.push('/docs') }}
                  className="font-mono text-[0.7rem] tracking-[0.3em] uppercase
                             bg-[#f0c030]/10 border border-[#f0c030]/50 text-[#f0c030]
                             px-7 py-3 cursor-pointer hover:bg-[#f0c030]/20 transition-all"
                >
                  I Understand &mdash; Enter
                </button>
                <button
                  onClick={() => setShowResearchDisclaimer(false)}
                  className="font-mono text-[0.7rem] tracking-[0.3em] uppercase
                             bg-transparent border border-white/15 text-white/50
                             px-7 py-3 cursor-pointer hover:border-white/30 transition-all"
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
