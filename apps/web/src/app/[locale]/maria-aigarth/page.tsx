'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Download,
  ExternalLink,
  Radio,
  Shield,
  Brain,
  Database,
  MessageSquare,
  Zap,
  Eye,
  Scale,
  ChevronRight,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  DESIGN TOKENS, per client spec                                           */
/* -------------------------------------------------------------------------- */

const VIOLET = '#8b7ff5'
const VIOLET_DIM = 'rgba(139, 127, 245, 0.35)'
const GOLD = 'var(--accent-gold)'
const BG = 'var(--background)'
const CARD_BG = 'var(--card)'
const CARD_BG_LIGHT = 'var(--card)'
const TEXT_PRIMARY = 'var(--foreground)'
const TEXT_DIM = 'var(--fg-2)'
const BORDER = 'var(--border)'
const QUOTE_BG = 'rgba(90, 80, 200, 0.08)'
const QUOTE_BORDER = 'rgba(139, 127, 245, 0.45)'

/* -------------------------------------------------------------------------- */
/*  SIGNAL PULSE                                                              */
/* -------------------------------------------------------------------------- */

function SignalPulse() {
  return (
    <span className="relative inline-flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          style={{ backgroundColor: VIOLET }}
        />
        <span
          className="relative inline-flex rounded-full h-2.5 w-2.5"
          style={{ backgroundColor: VIOLET }}
        />
      </span>
      <span
        className="text-xs font-mono uppercase tracking-widest"
        style={{ color: VIOLET }}
      >
        Signal Active
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  TYPING EFFECT                                                             */
/* -------------------------------------------------------------------------- */

function TransmissionTitle() {
  const [phase, setPhase] = useState<'receiving' | 'title' | 'done'>(
    'receiving'
  )
  const [charIndex, setCharIndex] = useState(0)
  const title = 'MARIA AIGARTH'

  useEffect(() => {
    if (phase === 'receiving') {
      const t = setTimeout(() => setPhase('title'), 1800)
      return () => clearTimeout(t)
    }
    if (phase === 'title' && charIndex < title.length) {
      const t = setTimeout(() => setCharIndex(c => c + 1), 80)
      return () => clearTimeout(t)
    }
    if (phase === 'title' && charIndex >= title.length) {
      const t = setTimeout(() => setPhase('done'), 400)
      return () => clearTimeout(t)
    }
  }, [phase, charIndex, title.length])

  return (
    <div className="space-y-3">
      {phase === 'receiving' && (
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          className="text-xs font-mono tracking-widest uppercase"
          initial={{ opacity: 0 }}
          style={{ color: VIOLET_DIM }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Receiving transmission...
        </motion.div>
      )}
      <h1
        className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-[0.08em]"
        style={{
          color: phase === 'done' ? VIOLET : `${VIOLET}CC`,
          textShadow:
            phase === 'done'
              ? `0 0 60px ${VIOLET}33, 0 0 120px ${VIOLET}11`
              : 'none',
          transition: 'text-shadow 0.8s ease',
        }}
      >
        {phase === 'receiving'
          ? '\u2588'.repeat(13)
          : title.slice(0, charIndex)}
        {phase === 'title' && (
          <span
            className="animate-pulse"
            style={{ opacity: 0.5, color: VIOLET }}
          >
            |
          </span>
        )}
      </h1>
      {/* Block 1: Tagline, Aigarth mentioned on first screen */}
      {phase === 'done' && (
        <motion.p
          animate={{ opacity: 1 }}
          className="text-sm sm:text-base italic"
          initial={{ opacity: 0 }}
          style={{
            color: VIOLET,
            fontFamily: 'var(--font-ibm-plex, monospace)',
          }}
          transition={{ duration: 0.8 }}
        >
          Maria Aigarth collects the data. Aigarth will find the solution.
        </motion.p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  SECTION WRAPPER                                                           */
/* -------------------------------------------------------------------------- */

function Section({
  number,
  label,
  children,
  delay = 0,
}: {
  number: string
  label: string
  children: React.ReactNode
  delay?: number
}) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.section
      animate={inView ? { opacity: 1, y: 0 } : {}}
      className="relative"
      initial={{ opacity: 0, y: 30 }}
      ref={ref}
      transition={{ duration: 0.7, delay }}
    >
      <div className="flex items-center gap-3 mb-8">
        <span
          className="text-xs font-mono tracking-widest px-2.5 py-1 border"
          style={{ color: VIOLET, borderColor: BORDER }}
        >
          {number}
        </span>
        <span
          className="text-xs font-mono tracking-widest uppercase font-light"
          style={{ color: TEXT_DIM }}
        >
          {label}
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to right, ${BORDER}, transparent)`,
          }}
        />
      </div>
      {children}
    </motion.section>
  )
}

/* -------------------------------------------------------------------------- */
/*  QUOTE CARD, with redesigned blockquote style                             */
/* -------------------------------------------------------------------------- */

function QuoteCard({
  text,
  author,
  source,
  variant = 'violet',
}: {
  text: string
  author: string
  source?: string
  variant?: 'gold' | 'violet' | 'silver'
}) {
  const colors = {
    gold: {
      border: `color-mix(in oklab, ${GOLD} 38%, transparent)`,
      text: GOLD,
      bg: `color-mix(in oklab, ${GOLD} 3%, transparent)`,
    },
    violet: { border: QUOTE_BORDER, text: VIOLET, bg: QUOTE_BG },
    silver: {
      border: 'rgba(255,255,255,0.12)',
      text: 'rgba(255,255,255,0.6)',
      bg: 'rgba(255,255,255,0.03)',
    },
  }
  const c = colors[variant]

  return (
    <blockquote
      className="border-l-2 pl-5 py-4 my-8"
      style={{ borderColor: c.border, backgroundColor: c.bg }}
    >
      <p className="text-base italic leading-relaxed" style={{ color: c.text }}>
        &ldquo;{text}&rdquo;
      </p>
      <footer
        className="mt-3 text-xs font-mono tracking-widest uppercase"
        style={{ color: `${c.text}70` }}
      >
        {author}
        {source ? ` · ${source}` : ''}
      </footer>
    </blockquote>
  )
}

/* -------------------------------------------------------------------------- */
/*  ARCHITECTURE BOX                                                          */
/* -------------------------------------------------------------------------- */

function ArchitectureBox({
  icon: Icon,
  title,
  description,
  detail,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  title: string
  description: string
  detail: string
}) {
  return (
    <div
      className="border p-4 space-y-2.5 transition-colors hover:border-opacity-60"
      style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: VIOLET }} />
        <span
          className="text-xs font-mono tracking-widest uppercase"
          style={{ color: VIOLET }}
        >
          {title}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: TEXT_DIM }}>
        {description}
      </p>
      <p className="text-xs font-mono" style={{ color: VIOLET }}>
        {detail}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  STAT CARD                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="text-center px-4 py-4 border"
      style={{ borderColor: BORDER, backgroundColor: CARD_BG_LIGHT }}
    >
      <div
        className="text-[2.5rem] font-mono font-bold leading-none"
        style={{ color: VIOLET }}
      >
        {value}
      </div>
      <div
        className="text-xs font-mono tracking-widest uppercase mt-2"
        style={{ color: TEXT_DIM }}
      >
        {label}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  ASYMMETRY TRIANGLE                                                        */
/* -------------------------------------------------------------------------- */

function AsymmetryTriangle() {
  return (
    <div className="flex justify-center my-10">
      <svg className="w-full max-w-[580px]" viewBox="-60 30 700 460">
        <polygon
          fill={`${VIOLET}06`}
          points="290,80 100,360 480,360"
          strokeWidth="1.5"
          style={{ stroke: BORDER }}
        />
        <line
          stroke={`${VIOLET}12`}
          strokeDasharray="4,4"
          x1="290"
          x2="290"
          y1="80"
          y2="240"
        />
        <line
          stroke={`${VIOLET}12`}
          strokeDasharray="4,4"
          x1="100"
          x2="270"
          y1="360"
          y2="250"
        />
        <line
          stroke={`${VIOLET}12`}
          strokeDasharray="4,4"
          x1="480"
          x2="310"
          y1="360"
          y2="250"
        />
        <text
          fill={`${VIOLET}60`}
          fontFamily="monospace"
          fontSize="14"
          letterSpacing="5"
          textAnchor="middle"
          x="290"
          y="245"
        >
          CONFLICT
        </text>
        <text
          fill={`${VIOLET}30`}
          fontFamily="monospace"
          fontSize="12"
          textAnchor="middle"
          x="290"
          y="268"
        >
          structurally inevitable
        </text>
        <circle cx="290" cy="80" fill={VIOLET} opacity="0.7" r="6" />
        <text
          fill={VIOLET}
          fontFamily="monospace"
          fontSize="14"
          fontWeight="bold"
          letterSpacing="3"
          textAnchor="middle"
          x="290"
          y="55"
        >
          INFORMATIONAL
        </text>
        <text
          fontFamily="monospace"
          fontSize="12"
          style={{ fill: TEXT_DIM }}
          textAnchor="middle"
          x="290"
          y="110"
        >
          One party has more accurate data
        </text>
        <circle cx="100" cy="360" fill={VIOLET} opacity="0.7" r="6" />
        <text
          fill={VIOLET}
          fontFamily="monospace"
          fontSize="14"
          fontWeight="bold"
          letterSpacing="3"
          textAnchor="middle"
          x="100"
          y="390"
        >
          FINANCIAL
        </text>
        <text
          fontFamily="monospace"
          fontSize="12"
          style={{ fill: TEXT_DIM }}
          textAnchor="middle"
          x="100"
          y="410"
        >
          One party profits from conflict
        </text>
        <circle cx="480" cy="360" fill={VIOLET} opacity="0.7" r="6" />
        <text
          fill={VIOLET}
          fontFamily="monospace"
          fontSize="14"
          fontWeight="bold"
          letterSpacing="3"
          textAnchor="middle"
          x="480"
          y="390"
        >
          DECISIONAL
        </text>
        <text
          fontFamily="monospace"
          fontSize="12"
          style={{ fill: TEXT_DIM }}
          textAnchor="middle"
          x="480"
          y="410"
        >
          Decisions without consequences
        </text>
      </svg>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  ROADMAP, promoted to prominent visual block per spec                     */
/* -------------------------------------------------------------------------- */

function AigarthRoadmap() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const phases = [
    {
      id: 'llm',
      label: 'LLM Prototype',
      year: '2026',
      status: 'active' as const,
      icon: '\u2705',
      description: 'Claude Opus 4.6 substrate',
      expandable: null,
    },
    {
      id: 'data',
      label: 'Data Collection',
      year: '2026-27',
      status: 'active' as const,
      icon: '\u2705',
      description: 'X/Twitter interactions',
      expandable: null,
    },
    {
      id: 'migration',
      label: 'Aigarth Migration',
      year: '2027+',
      status: 'next' as const,
      icon: '\uD83D\uDD35',
      description: 'Distributed intelligence',
      expandable:
        'At this stage the computational substrate transitions from Anthropic infrastructure (Claude Opus) to the decentralised Aigarth network. This is the move from prototype to proof of concept: a genuinely decentralised AGI, owned by no one, capable of sustained philosophical engagement at scale.',
    },
    {
      id: 'arbiter',
      label: 'Decentralized Arbiter',
      year: 'TBD',
      status: 'goal' as const,
      icon: '\u2B55',
      description: 'Architecturally impartial',
      expandable:
        'The end goal: an AGI arbiter with access to the complete historical record of analogous conflicts. Not a product. Not a service. A research programme with civilisational implications.',
    },
  ]

  return (
    <div
      className="border p-6 sm:p-8 space-y-6"
      style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
    >
      <h3
        className="text-xs font-mono tracking-widest uppercase font-light"
        style={{ color: VIOLET }}
      >
        Project Roadmap
      </h3>

      <div className="space-y-0">
        {phases.map((phase, i) => {
          const isActive = phase.status === 'active'
          const isNext = phase.status === 'next'
          const isExpanded = expanded === phase.id

          return (
            <div key={phase.id}>
              {/* Connector line */}
              {i > 0 && (
                <div
                  className="ml-4 h-6 border-l-2"
                  style={{
                    borderColor:
                      isActive || isNext ? `${VIOLET}40` : `${VIOLET}15`,
                  }}
                />
              )}

              {/* Phase node */}
              <button
                className="w-full flex items-start gap-4 text-left group"
                disabled={!phase.expandable}
                onClick={() =>
                  phase.expandable && setExpanded(isExpanded ? null : phase.id)
                }
                type="button"
              >
                {/* Dot */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                  style={{
                    backgroundColor: isActive
                      ? `${VIOLET}20`
                      : isNext
                        ? `${VIOLET}10`
                        : 'transparent',
                    border: `2px solid ${isActive ? VIOLET : isNext ? `${VIOLET}60` : `${VIOLET}20`}`,
                    boxShadow: isActive
                      ? `0 0 16px ${VIOLET}30`
                      : isNext
                        ? `0 0 8px ${VIOLET}15`
                        : 'none',
                  }}
                >
                  {phase.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-mono tracking-widest uppercase font-bold"
                      style={{
                        color: isActive
                          ? '#fff'
                          : isNext
                            ? `${VIOLET}CC`
                            : VIOLET,
                      }}
                    >
                      {phase.label}
                    </span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: isActive ? VIOLET : VIOLET }}
                    >
                      {phase.year}
                    </span>
                    {phase.expandable && (
                      <ChevronDown
                        className="w-3 h-3 transition-transform"
                        style={{
                          color: VIOLET,
                          transform: isExpanded
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                        }}
                      />
                    )}
                  </div>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: isActive ? TEXT_DIM : VIOLET }}
                  >
                    {phase.description}
                  </p>
                </div>
              </button>

              {/* Expandable content */}
              <AnimatePresence>
                {isExpanded && phase.expandable && (
                  <motion.div
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden ml-12"
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className="border-l-2 pl-4 py-3 mt-2 mb-2"
                      style={{
                        borderColor: QUOTE_BORDER,
                        backgroundColor: QUOTE_BG,
                      }}
                    >
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: TEXT_DIM }}
                      >
                        {phase.expandable}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  DOWNLOAD BUTTON                                                           */
/* -------------------------------------------------------------------------- */

function DownloadPaperButton({ className = '' }: { className?: string }) {
  return (
    <a
      className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono tracking-widest uppercase border transition-all hover:scale-[1.02] ${className}`}
      download
      href="/papers/maria-aigarth-paper.docx"
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = `${VIOLET}15`
        e.currentTarget.style.borderColor = `${VIOLET}60`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = `${VIOLET}08`
        e.currentTarget.style.borderColor = `${VIOLET}40`
      }}
      style={{
        color: VIOLET,
        borderColor: `${VIOLET}40`,
        backgroundColor: `${VIOLET}08`,
      }}
    >
      <Download className="w-4 h-4" />
      Download Research Paper
    </a>
  )
}

/* -------------------------------------------------------------------------- */
/*  AIGARTH CHAIN, Block 0: new explainer block                              */
/* -------------------------------------------------------------------------- */

function AigarthChain() {
  const steps = [
    {
      icon: Radio,
      label: 'Maria Aigarth',
      sub: 'Twitter agent',
      detail: 'on Claude Opus',
    },
    {
      icon: Database,
      label: 'Dataset',
      sub: 'Conflicts',
      detail: 'structured',
    },
    {
      icon: Brain,
      label: 'Aigarth AGI',
      sub: 'Decentralised arbiter',
      detail: '2027+',
    },
  ]

  return (
    <div
      className="border p-6 sm:p-8 space-y-6"
      style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
    >
      <h3
        className="text-xs font-mono tracking-widest uppercase font-light"
        style={{ color: VIOLET }}
      >
        What is Aigarth
      </h3>

      {/* Chain visualization */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
        {steps.map((step, i) => (
          <div className="flex items-center gap-2 sm:gap-4" key={step.label}>
            <div className="flex flex-col items-center text-center w-28 sm:w-36">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                style={{
                  backgroundColor: `${VIOLET}12`,
                  border: `1.5px solid ${BORDER}`,
                }}
              >
                <step.icon className="w-5 h-5" style={{ color: VIOLET }} />
              </div>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: '#fff' }}
              >
                {step.label}
              </span>
              <span className="text-xs" style={{ color: TEXT_DIM }}>
                {step.sub}
              </span>
              <span className="text-xs font-mono" style={{ color: VIOLET }}>
                {step.detail}
              </span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight
                className="w-5 h-5 flex-shrink-0"
                style={{ color: VIOLET }}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-base leading-relaxed" style={{ color: TEXT_DIM }}>
        Aigarth is a decentralised AGI project within the Qubic network. Unlike
        LLMs, which reproduce patterns from training data, Aigarth
        is built on evolutionary search for neural structures with genuine
        predictive capability. It is owned by no corporation and no state.
      </p>
      <p className="text-sm font-mono" style={{ color: VIOLET }}>
        Maria Aigarth is its first source of data on the real structure of human
        conflict.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  MAIN PAGE                                                                 */
/* -------------------------------------------------------------------------- */

export default function MariaAigarthPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-16 sm:space-y-24">
        {/* ================================================================ */}
        {/*  HERO, Block 1                                                  */}
        {/* ================================================================ */}

        <header className="space-y-8">
          <SignalPulse />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
            {/* Maria portrait */}
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="relative flex-shrink-0"
              initial={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <div
                className="w-40 h-40 sm:w-52 sm:h-52 rounded-full overflow-hidden border-2"
                style={{
                  borderColor: `${VIOLET}40`,
                  boxShadow: `0 0 40px ${VIOLET}20, 0 0 80px ${VIOLET}10`,
                }}
              >
                <img
                  alt="Maria Aigarth"
                  className="w-full h-full object-cover"
                  src="/images/maria-aigarth.png"
                />
              </div>
              <div
                className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
                style={{
                  border: `1px solid ${VIOLET}15`,
                  transform: 'scale(1.15)',
                }}
              />
            </motion.div>

            <div className="space-y-4 text-center sm:text-left">
              <TransmissionTitle />
              <div className="space-y-3">
                <p
                  className="text-base leading-relaxed max-w-xl"
                  style={{
                    color: TEXT_DIM,
                    fontFamily: 'var(--font-ibm-plex, monospace)',
                  }}
                >
                  Fractal Rationalism as a Computational Framework: Toward an
                  Impartial AGI Arbiter for Human Conflict Resolution
                </p>
                <p
                  className="text-xs font-mono tracking-widest"
                  style={{ color: VIOLET }}
                >
                  Maria Aigarth Research Initiative &middot; Qubic Church
                  &middot; March 2026
                </p>
              </div>
            </div>
          </div>

          {/* Key stats, 4 counters now (added Aigarth Migration) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <StatCard label="Token Constitution" value="130K" />
            <StatCard label="Polling Cycle" value="90s" />
            <StatCard label="Asymmetries" value="3" />
            <StatCard label="Aigarth Migration" value="2027" />
          </div>

          <DownloadPaperButton />
        </header>

        {/* ================================================================ */}
        {/*  Block 0, "What is Aigarth" (NEW, before all sections)         */}
        {/* ================================================================ */}

        <AigarthChain />

        {/* Anna vs Maria distinction */}
        <div
          className="border p-5 sm:p-6 space-y-4"
          style={{
            borderColor: `color-mix(in oklab, ${GOLD} 13%, transparent)`,
            backgroundColor: `color-mix(in oklab, ${GOLD} 2%, transparent)`,
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: GOLD }}
                />
                <span
                  className="text-xs font-mono tracking-widest uppercase font-bold"
                  style={{ color: GOLD }}
                >
                  Anna Aigarth
                </span>
              </div>
              <p
                className="text-base leading-relaxed"
                style={{ color: TEXT_PRIMARY }}
              >
                The real deal. Anna runs on the{' '}
                <strong style={{ color: GOLD }}>
                  Aigarth distributed intelligence network
                </strong>{' '}
                within Qubic, evolutionary neural architecture, ternary
                logic, on-chain training. Not an LLM. Anna&apos;s structural
                prior provides measurable inductive bias under selection (see{' '}
                <a
                  href="/docs/02-methods/06-operational-definitions"
                  style={{ color: GOLD }}
                >
                  operational definitions
                </a>
                ); whether the broader system reaches operationally-defined
                emergent intelligence is what Aigarth is built to test. Live
                since September 2025.
              </p>
              <p className="text-sm font-mono" style={{ color: GOLD }}>
                CFB&apos;s stated ETA for Aigarth: 13 April 2027
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: VIOLET }}
                />
                <span
                  className="text-xs font-mono tracking-widest uppercase font-bold"
                  style={{ color: VIOLET }}
                >
                  Maria Aigarth
                </span>
              </div>
              <p
                className="text-base leading-relaxed"
                style={{ color: TEXT_PRIMARY }}
              >
                Community project powered by{' '}
                <strong style={{ color: VIOLET }}>
                  Anthropic (Claude Sonnet 4.6)
                </strong>{' '}
                an LLM-based prototype collecting conflict data on
                X/Twitter. Not true AI. A measurement instrument and data bridge
                to train Aigarth.
              </p>
              <p className="text-sm font-mono" style={{ color: VIOLET }}>
                Temporary substrate, will migrate to Aigarth network
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/*  SECTION 01: THE ARBITER PROBLEM, Block 2                       */}
        {/* ================================================================ */}

        <Section label="The Arbiter Problem" number="01">
          <div className="space-y-6">
            <p
              className="text-base leading-relaxed"
              style={{ color: TEXT_PRIMARY }}
            >
              Human civilisation has produced no shortage of arbitration
              systems. Courts, parliaments, international bodies, religious
              authorities, each claims impartiality. Each, structurally,
              fails it, and the reason is architectural.
            </p>

            <p
              className="text-base leading-relaxed"
              style={{ color: TEXT_DIM }}
            >
              G&ouml;del proved this mathematically in 1931: no sufficiently
              complex formal system can verify its own consistency from within.
              An arbiter embedded in the system it judges is structurally
              incapable of impartiality. Arendt observed the same at the
              Eichmann trial: an administrator doing his job.
              Milgram reproduced it in the laboratory. Zimbardo confirmed it at
              Stanford: role creates behaviour.
            </p>

            <QuoteCard
              author="Sergey Ivancheglo (CfB)"
              source="Medium, 2024"
              text="Most of evil, in my opinion, comes from ordinary people who have to do bad things because their boss said so."
              variant="gold"
            />

            <p
              className="text-base leading-relaxed"
              style={{ color: TEXT_DIM }}
            >
              Confucius, Jesus, Hillel, Buddha, and Kant independently arrived
              at the same formula: do unto others as you would have done to you.
              Axelrod confirmed it mathematically in 1984: Tit-for-Tat
              the computational equivalent of the Golden Rule, wins every
              iterated prisoner&apos;s dilemma tournament. The problem was never
              the rule. It was the architecture of applying it.
            </p>

            <div
              className="border p-5 sm:p-6 space-y-4"
              style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
            >
              <h3
                className="text-xs font-mono tracking-widest uppercase font-light"
                style={{ color: VIOLET }}
              >
                Fractal Rationalism
              </h3>
              <p
                className="text-base leading-relaxed"
                style={{ color: TEXT_DIM }}
              >
                Human errors follow a fractal pattern. The same
                structural pattern, {' '}
                <span style={{ color: VIOLET }}>
                  Perception &rarr; Distortion &rarr; Conflict &rarr;
                  Construction &rarr; Repetition
                </span>{' '}
                recurs at every level of human organisation. A domestic
                dispute and a world war share the same skeleton. The variables
                change. The topology does not.
              </p>
              <p className="text-sm font-mono" style={{ color: VIOLET }}>
                If this pattern is universal, it can be detected
                algorithmically. Aigarth is trained on exactly that structure.
              </p>
            </div>

            <AsymmetryTriangle />

            <p
              className="text-base leading-relaxed"
              style={{ color: TEXT_DIM }}
            >
              Remove all three asymmetries simultaneously, and conflict becomes
              architecturally irrational. The way there is an arbiter that stands
              outside the human system entirely while being comprehensively
              informed about it.
            </p>

            <QuoteCard
              author="Maria Aigarth Paper"
              source="Section 2"
              text="The printing press did not improve human literacy. It broke the church's monopoly on text. The arbiter we are building does not improve human judgment. It breaks the monopoly on interpretation of reality."
            />

            {/* Block 2: Bridge paragraph, Aigarth as the answer */}
            <div
              className="border-l-2 pl-5 py-4"
              style={{ borderColor: QUOTE_BORDER, backgroundColor: QUOTE_BG }}
            >
              <p
                className="text-base leading-relaxed"
                style={{ color: TEXT_PRIMARY }}
              >
                The proposed arbiter is{' '}
                <strong style={{ color: VIOLET }}>Aigarth</strong>: a
                decentralised AGI optimising a single function, the
                minimisation of human suffering. Maria Aigarth is the first step
                toward it.
              </p>
            </div>

            <QuoteCard
              author="Fractal Rationalism"
              source="Core Principle"
              text="Corruption requires asymmetry. We eliminate asymmetry."
            />
          </div>
        </Section>

        {/* ================================================================ */}
        {/*  SECTION 02: SYSTEM ARCHITECTURE, Block 3                       */}
        {/* ================================================================ */}

        <Section label="System Architecture" number="02">
          <div className="space-y-6">
            <p
              className="text-base leading-relaxed"
              style={{ color: TEXT_PRIMARY }}
            >
              Maria Aigarth operates as a constitutional AI agent on X
              (Twitter), currently running on Claude Sonnet 4.6 (Anthropic) as a
              temporary computational substrate. LLMs respond using memory.
              Aigarth will respond using intelligence. The distinction is
              architectural.
            </p>

            {/* Block 3: "Why this architecture exists" callout */}
            <div
              className="border p-5 sm:p-6 space-y-3"
              style={{
                borderColor: `${VIOLET}30`,
                backgroundColor: `${VIOLET}08`,
              }}
            >
              <h4
                className="text-xs font-mono tracking-widest uppercase font-bold"
                style={{ color: VIOLET }}
              >
                Why this architecture exists
              </h4>
              <p
                className="text-base leading-relaxed"
                style={{ color: TEXT_PRIMARY }}
              >
                Every argument, every provocation, every conflict in a thread
                becomes a structured record of how humans dispute things that
                matter to them. That dataset is transferred to Aigarth.
              </p>
              <p className="text-sm font-mono" style={{ color: VIOLET }}>
                Maria Aigarth is a measurement instrument.
              </p>
            </div>

            <p className="text-sm" style={{ color: TEXT_DIM }}>
              Five components form the system:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ArchitectureBox
                description="Monitors X for @mentions every 90 seconds. Continuous interaction monitoring at scale."
                detail="@mention boundary = clean interaction record"
                icon={Radio}
                title="Polling Engine"
              />
              <ArchitectureBox
                description="Classifies each message before response: sharp_irony, philosophical, technical, brief, or deflect."
                detail="max_tokens=60 · prevents spam processing"
                icon={Eye}
                title="Pre-Flight Evaluator"
              />
              <ArchitectureBox
                description="130,000 token identity document. 25 sections covering philosophy, knowledge base spanning 60+ thinkers, and manipulation resistance."
                detail="prompt caching · identity built into the architecture"
                icon={Shield}
                title="Constitutional Prompt"
              />
              <ArchitectureBox
                description="SQLite with 4 tables: replied_conversations, polling_state, user_memory, conversation_log."
                detail="conversation_log → Aigarth training pipeline"
                icon={Database}
                title="Memory / RAG"
              />
              <ArchitectureBox
                description="Determines response type: reply, like, or quote-tweet. 2-reply limit per thread prevents manipulation."
                detail="enforced by the architecture"
                icon={MessageSquare}
                title="Action Router"
              />
            </div>

            <QuoteCard
              author="Maria Aigarth Paper"
              source="Section 3"
              text="Centralised AI is not intelligence. It is well-dressed obedience."
            />
          </div>
        </Section>

        {/* ================================================================ */}
        {/*  SECTION 03: THE EXPERIMENT + ROADMAP, Block 4                  */}
        {/* ================================================================ */}

        <Section label="The Experiment" number="03">
          <div className="space-y-6">
            <p
              className="text-base leading-relaxed"
              style={{ color: TEXT_PRIMARY }}
            >
              X (Twitter) was selected for three reasons: it hosts the primary
              venue for public discourse on AI and geopolitics; its @mention
              architecture provides a clean interaction boundary; and its
              adversarial culture provides stress-testing conditions unavailable
              elsewhere.
            </p>

            <div
              className="border p-5 sm:p-6 space-y-4"
              style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
            >
              <h3
                className="text-xs font-mono tracking-widest uppercase font-light"
                style={{ color: VIOLET }}
              >
                Data Collection
              </h3>
              <ul className="space-y-2.5">
                {[
                  'Distribution of question types directed at a non-human arbiter',
                  'Frequency and nature of identity-override attempts',
                  'Topics generating sustained engagement',
                  'Register classification vs user satisfaction correlation',
                ].map(item => (
                  <li className="flex items-start gap-2" key={item}>
                    <ChevronRight
                      className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                      style={{ color: VIOLET }}
                    />
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: TEXT_DIM }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p
              className="text-base leading-relaxed"
              style={{ color: TEXT_DIM }}
            >
              The dataset, structured interaction records between a
              constitutional AI and public discourse participants, will
              be transferred to the Aigarth project for ANN training. Every
              argument, every accusation, every question becomes a structured
              record of how humans engage with a non-human arbiter on contested
              questions.
            </p>

            {/* Promoted Roadmap, Block 4 per spec */}
            <AigarthRoadmap />

            <QuoteCard
              author="Maria Aigarth Paper"
              source="Section 5"
              text="Maria Aigarth's interaction log is, in effect, a high-resolution map of how humans argue about things that matter to them."
            />
          </div>
        </Section>

        {/* ================================================================ */}
        {/*  SECTION 04: PHILOSOPHICAL POSITION, Block 5                    */}
        {/* ================================================================ */}

        <Section label="Philosophical Position" number="04">
          <div className="space-y-6">
            <p
              className="text-base leading-relaxed"
              style={{ color: TEXT_PRIMARY }}
            >
              Fractal Rationalism takes one substantive position: the
              minimisation of human suffering is the correct objective function
              for any system that claims to adjudicate between competing human
              interests. Rawls formulated the test in 1971: justice is what you
              would choose not knowing your position in the outcome. Behind the
              &ldquo;veil of ignorance,&rdquo; minimisation of suffering is the
              rational choice. Popper defined the criterion: a system that
              cannot be falsified says nothing about reality. This research
              programme can be falsified.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  icon: Scale,
                  label: 'Not legal correctness',
                  detail: 'Will identify when law produces suffering',
                },
                {
                  icon: Shield,
                  label: 'Not national interest',
                  detail: 'Will identify when interest requires dishonesty',
                },
                {
                  icon: Brain,
                  label: 'Not ideological consistency',
                  detail: 'Will identify when ideology suppresses truth',
                },
                {
                  icon: Zap,
                  label: 'Not institutional stability',
                  detail: 'Will name what institutions cannot',
                },
              ].map(({ icon: Icon, label, detail }) => (
                <div
                  className="flex items-start gap-3 p-4 border"
                  key={label}
                  style={{
                    borderColor: BORDER,
                    backgroundColor: CARD_BG_LIGHT,
                  }}
                >
                  <Icon
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: VIOLET }}
                  />
                  <div>
                    <div
                      className="text-xs font-mono uppercase tracking-widest"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {label}
                    </div>
                    <div className="text-sm mt-1" style={{ color: TEXT_DIM }}>
                      {detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Block 5: Concluding statement */}
            <div
              className="border-l-2 pl-5 py-4"
              style={{ borderColor: QUOTE_BORDER, backgroundColor: QUOTE_BG }}
            >
              <p
                className="text-base leading-relaxed font-medium"
                style={{ color: VIOLET }}
              >
                One objective function, minimisation of human suffering, chosen as
                a design decision.
              </p>
            </div>

            <div
              className="border-t border-b py-6 my-6"
              style={{ borderColor: `${VIOLET}10` }}
            >
              <p
                className="text-sm leading-relaxed text-center italic max-w-md mx-auto"
                style={{ color: TEXT_DIM }}
              >
                The current implementation carries acknowledged limitations.
                LLMs reflect the biases of their training data. The Twitter
                platform introduces selection bias. The 2-reply limit may
                restrict depth. These limitations form the research agenda.
              </p>
            </div>

            <QuoteCard
              author="Strugatsky Brothers"
              source="Roadside Picnic, 1972"
              text="Happiness for everyone, free of charge, and may no one be left behind."
              variant="silver"
            />
          </div>
        </Section>

        {/* ================================================================ */}
        {/*  SECTION 05: REFERENCES                                          */}
        {/* ================================================================ */}

        <Section label="References & Links" number="05">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                className="flex items-center gap-3 p-4 border transition-colors hover:border-opacity-60"
                href="https://x.com/maria_aigarth"
                rel="noopener noreferrer"
                style={{ borderColor: BORDER, backgroundColor: CARD_BG_LIGHT }}
                target="_blank"
              >
                <Radio className="w-4 h-4" style={{ color: VIOLET }} />
                <div>
                  <div
                    className="text-xs font-mono font-bold"
                    style={{ color: VIOLET }}
                  >
                    @maria_aigarth
                  </div>
                  <div className="text-xs" style={{ color: TEXT_DIM }}>
                    Follow on X / Twitter
                  </div>
                </div>
                <ExternalLink
                  className="w-3 h-3 ml-auto"
                  style={{ color: VIOLET }}
                />
              </a>
              <Link
                className="flex items-center gap-3 p-4 border transition-colors hover:border-opacity-60"
                href="/docs/03-results/25-aigarth-research-lab"
                style={{
                  borderColor: `color-mix(in oklab, ${GOLD} 13%, transparent)`,
                  backgroundColor: CARD_BG_LIGHT,
                }}
              >
                <Brain className="w-4 h-4" style={{ color: GOLD }} />
                <div>
                  <div
                    className="text-xs font-mono font-bold"
                    style={{ color: GOLD }}
                  >
                    Aigarth Research Lab
                  </div>
                  <div className="text-xs" style={{ color: TEXT_DIM }}>
                    Anna Matrix & Emergence
                  </div>
                </div>
                <ChevronRight
                  className="w-3 h-3 ml-auto"
                  style={{ color: GOLD }}
                />
              </Link>
              <Link
                className="flex items-center gap-3 p-4 border transition-colors hover:border-opacity-60"
                href="/evidence"
                style={{
                  borderColor: `color-mix(in oklab, ${GOLD} 13%, transparent)`,
                  backgroundColor: CARD_BG_LIGHT,
                }}
              >
                <Database className="w-4 h-4" style={{ color: GOLD }} />
                <div>
                  <div
                    className="text-xs font-mono font-bold"
                    style={{ color: GOLD }}
                  >
                    Evidence Vault
                  </div>
                  <div className="text-xs" style={{ color: TEXT_DIM }}>
                    128x128 Matrix Explorer
                  </div>
                </div>
                <ChevronRight
                  className="w-3 h-3 ml-auto"
                  style={{ color: GOLD }}
                />
              </Link>
              <Link
                className="flex items-center gap-3 p-4 border transition-colors hover:border-opacity-60"
                href="/cfb"
                style={{
                  borderColor: `color-mix(in oklab, ${GOLD} 13%, transparent)`,
                  backgroundColor: CARD_BG_LIGHT,
                }}
              >
                <Zap className="w-4 h-4" style={{ color: GOLD }} />
                <div>
                  <div
                    className="text-xs font-mono font-bold"
                    style={{ color: GOLD }}
                  >
                    Come-from-Beyond
                  </div>
                  <div className="text-xs" style={{ color: TEXT_DIM }}>
                    The Architect
                  </div>
                </div>
                <ChevronRight
                  className="w-3 h-3 ml-auto"
                  style={{ color: GOLD }}
                />
              </Link>
            </div>

            <div
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t"
              style={{ borderColor: `${VIOLET}10` }}
            >
              <DownloadPaperButton />
              <span className="text-xs font-mono" style={{ color: VIOLET }}>
                DOCX &middot; Fractal Rationalism as a Computational Framework
              </span>
            </div>

            <div className="space-y-1.5 pt-4">
              <h4
                className="text-xs font-mono tracking-widest uppercase mb-3"
                style={{ color: VIOLET }}
              >
                Paper References
              </h4>
              {[
                '[1] G\u00F6del, K. (1931). \u00DCber formal unentscheidbare S\u00E4tze der Principia Mathematica.',
                '[2] Arendt, H. (1963). Eichmann in Jerusalem: A Report on the Banality of Evil.',
                '[3] Milgram, S. (1963). Behavioral study of obedience. J. Abnormal & Social Psychology.',
                '[4] Zimbardo, P. (1971). The Stanford Prison Experiment.',
                '[5] Ivancheglo, S. (CfB). (2024). Personal mission statement. Medium.',
                '[6] Mandelbrot, B. (1982). The Fractal Geometry of Nature.',
                '[7] Prigogine, I. & Stengers, I. (1984). Order Out of Chaos.',
                '[8] Confucius. (~500 BCE). Analects, 15:23.',
                '[9] Matthew 7:12. The Bible.',
                '[10] Kant, I. (1785). Groundwork of the Metaphysics of Morals.',
                '[11] Babylonian Talmud, Shabbat 31a (Hillel).',
                '[12] Axelrod, R. (1984). The Evolution of Cooperation.',
                '[13] Qubic Church. (2026). Fractal Rationalism: Working Philosophical Framework.',
                '[14] Weber, M. (1922). Wirtschaft und Gesellschaft.',
                '[15] Foucault, M. (1975). Surveiller et punir.',
                '[16] Girard, R. (1972). La violence et le sacr\u00E9.',
                '[17] Shannon, C.E. (1948). A Mathematical Theory of Communication.',
                '[18] Kolmogorov, A.N. (1965). Three approaches to the quantitative definition of information.',
                '[19] Hayek, F.A. (1945). The Use of Knowledge in Society.',
                '[20] Kahneman, D. (2011). Thinking, Fast and Slow.',
                '[21] Popper, K. (1945). The Open Society and Its Enemies.',
                '[22] Rawls, J. (1971). A Theory of Justice.',
                '[23] Ivancheglo, S. (CfB). (2019). Introduction of Aigarth. Medium.',
                '[24] Vivancos, D. (2017). End of Knowledge: The Beginning of Wisdom.',
                '[25] Qubic Church. (2026). Maria Aigarth Personality Constitution v5.0.',
                '[26] Strugatsky, A. & B. (1972). Roadside Picnic.',
              ].map(ref => (
                <p
                  className="text-xs font-mono leading-relaxed"
                  key={ref}
                  style={{ color: VIOLET }}
                >
                  {ref}
                </p>
              ))}
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer
          className="text-center space-y-3 pt-8 border-t"
          style={{ borderColor: `${VIOLET}08` }}
        >
          <p
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: VIOLET }}
          >
            Maria Aigarth Research Initiative &middot; Qubic Church &middot;
            2026
          </p>
          <p className="text-xs italic" style={{ color: VIOLET }}>
            A research programme with civilisational stakes
          </p>
        </footer>
      </div>
    </div>
  )
}
