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
  { label: 'MISSION', modal: 'mission', icon: '\u2295', description: '9 Objectives', isPrimary: true },
  { label: 'ANNA MATRIX', href: '/evidence', icon: '\u25C8', description: 'Neural Grid' },
  { label: 'RESEARCH', href: '/docs', icon: '\u2261', description: 'Sacred Archive' },
  { label: 'DASHBOARD', href: '/monitoring', icon: '\u25CE', description: 'Live Data' },
  { label: 'MINE QUBIC', href: '/mine-qubic', icon: '\u2338', description: 'Start Mining' },
  { label: 'GENESIS', modal: 'genesis', icon: '\u2726', description: 'Origin Story' },
  { label: 'ROADMAP', modal: 'roadmap', icon: '\u25CE', description: 'Timeline' },
]

const GOLD = '#D4AF37'
const GOLD_BRIGHT = '#f0c030'

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function piePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 0 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

function DesktopWheel({
  onNavigate,
  onOpenModal,
}: {
  onNavigate: (href: string) => void
  onOpenModal?: (modalId: string) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  const CX = 410
  const CY = 410
  const R = 385
  const INNER_R = 155
  const segmentAngle = 360 / SEGMENTS.length
  const LABEL_R = 272

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 820 820" className="absolute inset-0 w-full h-full">
        {/* Decorative outer rings */}
        <circle cx={CX} cy={CY} r={405} fill="none" stroke={`${GOLD_BRIGHT}10`} strokeWidth={1} />
        <circle cx={CX} cy={CY} r={398} fill="none" stroke={`${GOLD_BRIGHT}20`} strokeWidth={0.5} />
        <circle cx={CX} cy={CY} r={390} fill="none" stroke={`${GOLD_BRIGHT}0d`} strokeWidth={8} />

        {/* Segments */}
        {SEGMENTS.map((seg, i) => {
          const startAngle = i * segmentAngle
          const endAngle = (i + 1) * segmentAngle
          const isHovered = hovered === i

          let fill: string
          let stroke: string
          let strokeWidth: number

          if (seg.isCfb) {
            fill = isHovered ? `${GOLD_BRIGHT}30` : `${GOLD_BRIGHT}14`
            stroke = `${GOLD_BRIGHT}e6`
            strokeWidth = isHovered ? 3 : 2.5
          } else if (seg.isPrimary) {
            fill = isHovered ? `${GOLD_BRIGHT}18` : `${GOLD_BRIGHT}08`
            stroke = isHovered ? `${GOLD_BRIGHT}e6` : `${GOLD_BRIGHT}99`
            strokeWidth = isHovered ? 2 : 1.5
          } else {
            fill = isHovered ? `${GOLD_BRIGHT}18` : 'rgba(15,12,25,0.92)'
            stroke = isHovered ? `${GOLD_BRIGHT}e6` : `${GOLD_BRIGHT}33`
            strokeWidth = isHovered ? 2 : 1
          }

          return (
            <path
              key={i}
              d={piePath(CX, CY, R, startAngle, endAngle)}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              className="cursor-pointer"
              style={{ transition: 'fill 0.25s ease, stroke 0.25s ease, stroke-width 0.25s ease' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => {
                if (seg.modal && onOpenModal) {
                  onOpenModal(seg.modal)
                } else if (seg.href) {
                  onNavigate(seg.href)
                }
              }}
            />
          )
        })}

        {/* Inner circle */}
        <circle cx={CX} cy={CY} r={INNER_R} fill="rgba(3,2,8,0.98)" stroke={`${GOLD_BRIGHT}59`} strokeWidth={1} />
        <circle cx={CX} cy={CY} r={148} fill="none" stroke={`${GOLD_BRIGHT}14`} strokeWidth={0.5} />
      </svg>

      {/* Segment labels layer */}
      <div className="absolute inset-0 pointer-events-none">
        {SEGMENTS.map((seg, i) => {
          const midAngle = (i + 0.5) * segmentAngle
          const anchor = polarToCartesian(CX, CY, LABEL_R, midAngle)
          const isHovered = hovered === i

          const iconSize = seg.isCfb ? '2rem' : seg.isPrimary ? '1.8rem' : '1.6rem'
          const nameSize = seg.isCfb ? '0.65rem' : '0.58rem'
          const iconOpacity = isHovered ? 1 : seg.isCfb ? 1 : seg.isPrimary ? 0.9 : 0.7
          const nameOpacity = isHovered ? 1 : seg.isCfb ? 1 : seg.isPrimary ? 0.9 : 0.7

          // Percentage-based positioning (relative to 820x820 viewBox)
          const topPct = (anchor.y / 820) * 100
          const leftPct = (anchor.x / 820) * 100

          return (
            <div
              key={i}
              className="absolute flex items-center justify-center"
              style={{
                top: `${topPct}%`,
                left: `${leftPct}%`,
                transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.15)' : 'scale(1)'}`,
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                textAlign: 'center',
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  style={{
                    fontSize: iconSize,
                    lineHeight: 1,
                    color: GOLD_BRIGHT,
                    opacity: iconOpacity,
                    filter: isHovered ? `drop-shadow(0 0 8px ${GOLD_BRIGHT}cc)` : seg.isCfb ? `drop-shadow(0 0 6px ${GOLD_BRIGHT}99)` : 'none',
                    transition: 'opacity 0.25s ease, filter 0.25s ease',
                  }}
                >
                  {seg.icon}
                </span>
                <span
                  className="font-mono uppercase whitespace-nowrap"
                  style={{
                    fontSize: nameSize,
                    color: GOLD_BRIGHT,
                    opacity: nameOpacity,
                    letterSpacing: seg.isCfb ? '0.28em' : '0.2em',
                    textShadow: isHovered
                      ? `0 0 12px ${GOLD_BRIGHT}b3`
                      : `0 2px 6px rgba(0,0,0,1)`,
                    transition: 'opacity 0.25s ease, filter 0.25s ease',
                  }}
                >
                  {seg.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Center hub */}
      <div
        className="absolute flex flex-col items-center justify-center gap-2 pointer-events-none z-10"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '26.8%',
          height: '26.8%',
          borderRadius: '50%',
        }}
      >
        <span
          style={{
            fontSize: '1.6rem',
            lineHeight: 1,
            color: GOLD_BRIGHT,
            filter: `drop-shadow(0 0 12px ${GOLD_BRIGHT}80)`,
          }}
        >
          {'\u2B21'}
        </span>
        <span
          className="font-mono uppercase"
          style={{
            fontSize: '0.7rem',
            color: GOLD_BRIGHT,
            letterSpacing: '0.45em',
            opacity: 0.9,
            marginTop: '4px',
          }}
        >
          NAVIGATE
        </span>
        <span
          className="font-mono uppercase"
          style={{
            fontSize: '0.48rem',
            color: `${GOLD_BRIGHT}66`,
            letterSpacing: '0.4em',
          }}
        >
          {hovered !== null && SEGMENTS[hovered]
            ? SEGMENTS[hovered].description.toUpperCase()
            : 'SELECT PATH'}
        </span>
      </div>
    </div>
  )
}

function MobileNavGrid({
  onNavigate,
  onOpenModal,
}: {
  onNavigate: (href: string) => void
  onOpenModal?: (modalId: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4 max-w-sm mx-auto max-h-[70vh] overflow-y-auto">
      {SEGMENTS.map((seg) => {
        return (
          <button
            key={`${seg.label}-${seg.href ?? seg.modal}`}
            onClick={() => {
              if (seg.modal && onOpenModal) {
                onOpenModal(seg.modal)
              } else if (seg.href) {
                onNavigate(seg.href)
              }
            }}
            className={`p-3 border transition-all text-center
                       bg-[#050505] hover:bg-[#D4AF37]/5 active:scale-95
                       ${seg.isCfb || seg.isPrimary ? 'border-[#D4AF37]/25' : 'border-[#D4AF37]/15'}
                       hover:border-[#D4AF37]/40`}
          >
            <span className="block text-xl mx-auto mb-1.5" style={{ color: `${GOLD_BRIGHT}cc` }}>{seg.icon}</span>
            <span
              className="text-[9px] font-medium uppercase tracking-[0.1em] block"
              style={{ color: `${GOLD_BRIGHT}cc` }}
            >
              {seg.label}
            </span>
            <span className="block text-[8px] text-white/30 mt-0.5">
              {seg.description}
            </span>
          </button>
        )
      })}
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

  // Close on Escape
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
            className="relative z-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 md:right-4 p-2 text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors font-mono text-xs uppercase tracking-[0.4em] border border-[#D4AF37]/25 px-4 py-2"
              aria-label="Close navigation"
            >
              [ CLOSE ]
            </button>

            {/* Desktop: SVG Wheel */}
            <div
              className="hidden md:flex items-center justify-center"
              style={{ width: 'min(720px, 65vh)', height: 'min(720px, 65vh)' }}
            >
              <DesktopWheel onNavigate={handleNavigate} onOpenModal={handleOpenModal} />
            </div>

            {/* Mobile: Grid */}
            <div className="md:hidden">
              <MobileNavGrid onNavigate={handleNavigate} onOpenModal={handleOpenModal} />
            </div>
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
