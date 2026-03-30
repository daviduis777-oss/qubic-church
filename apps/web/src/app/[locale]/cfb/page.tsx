'use client'

/**
 * Come-from-Beyond Dossier Page
 * An archive of eras, personas, and technological shifts.
 * From the emergence of distributed systems thinking to the frontier of decentralized intelligence.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import Link from 'next/link'
import { ChevronDown, Lock, AlertTriangle, ArrowLeft } from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  CONSTANTS                                                                 */
/* -------------------------------------------------------------------------- */

const GOLD = '#f0c030'
const GOLD_DIM = 'rgba(240, 192, 48, 0.35)'
const VOID = '#030303'
const WARM_WHITE = '#f5f0e8'

const IDENTITIES = [
  { name: 'COME-FROM-BEYOND', label: '// IDENTITY: COME-FROM-BEYOND', color: '#f0c030' },
  { name: 'SERGEY IVANCHEGLO', label: '// BIRTH NAME: SERGEY IVANCHEGLO', color: '#f0c030' },
  { name: 'BCNEXT', label: '// ALIAS: BCNEXT — NXT ARCHITECT', color: '#5bc8f5' },
  { name: 'SATOSHI NAKAMOTO?', label: '// HYPOTHESIS: SATOSHI NAKAMOTO', color: '#ff4444' },
  { name: 'MARIA???', label: '// SHADOW: MARIA??? — BLOCK #264', color: '#ff9944' },
  { name: 'COME-FROM-BEYOND', label: '// IDENTITY: COME-FROM-BEYOND', color: '#f0c030' },
  { name: 'CFB', label: '// ALIAS: CfB — QUBIC FOUNDER', color: '#f0c030' },
  { name: '???', label: '// IDENTITY: [REDACTED]', color: '#888' },
  { name: 'COME-FROM-BEYOND', label: '// IDENTITY: COME-FROM-BEYOND', color: '#f0c030' },
] as const

/* -------------------------------------------------------------------------- */
/*  ERA DATA                                                                  */
/* -------------------------------------------------------------------------- */

interface EraData {
  id: string
  number: string
  title: string
  subtitle: string
  years: string
  tags: { label: string; variant?: 'default' | 'red' }[]
  narrative: string
  coreIdea: string
  dossierItems: string[]
  architecturalImpact: string
  isApex?: boolean
  isLore?: boolean
  isLocked?: boolean
  loreWarning?: string
}

const ERAS: EraData[] = [
  {
    id: 'era-1',
    number: 'I',
    title: 'THE ARCHITECT',
    subtitle: 'Sergey Ivancheglo',
    years: 'Pre-2012',
    tags: [
      { label: 'Distributed systems engineer' },
      { label: 'Artificial life \u2192 distributed computing' },
      { label: 'Systems architect' },
    ],
    narrative:
      'Long before decentralization became ideology, it was mathematics. Before it was a market, it was a field of study in distributed systems theory, cellular automata, and artificial life. He did not start in crypto. He started in the substrate beneath it \u2014 studying how complexity emerges from simple, distributed rules. How local interactions produce global intelligence. How systems without a leader can still converge.',
    coreIdea: 'Intelligence is not built. It emerges.',
    dossierItems: [
      'Active in early internet forums on distributed computing and artificial life simulation',
      'Known under the handle Hobo.369 in early cryptography and systems communities',
      'Engaged with concepts of self-replicating programs, viral computing, and emergent behavior',
      'Posted extensively on Bitcointalk in the early years, demonstrating deep understanding of consensus mechanisms',
      'Background in mathematics and systems engineering, not finance or economics',
      'The intellectual trajectory points clearly: from artificial life \u2192 distributed consensus \u2192 decentralized intelligence',
    ],
    architecturalImpact:
      'Built the mental framework that later powered half of the crypto industry. The thread between artificial life research and blockchain consensus is a direct line \u2014 one he walked years before the public caught up.',
  },
  {
    id: 'era-2',
    number: 'II',
    title: 'THE NEXT EVOLUTION',
    subtitle: 'BCNext',
    years: '2013\u20132015',
    tags: [
      { label: 'Proof-of-Stake architect' },
      { label: 'Energy-efficient consensus' },
      { label: 'Anonymous builder' },
    ],
    narrative:
      'Under the pseudonym BCNext, he built one of the first pure Proof-of-Stake systems in history. NXT was not a fork. It was written from scratch \u2014 a full blockchain platform with its own consensus, asset exchange, messaging system, and marketplace. While Bitcoin was proving that decentralized money was possible, BCNext was already asking: what if the energy cost was unnecessary? What if we could achieve the same security guarantees through stake, not heat?',
    coreIdea: 'Bitcoin was a prototype. He was already building version 2.',
    dossierItems: [
      'NXT launched in late 2013 as one of the first 100% Proof-of-Stake cryptocurrencies',
      'Written entirely from scratch in Java \u2014 not forked from Bitcoin',
      'Included built-in features: decentralized asset exchange, messaging, voting system, marketplace',
      'BCNext remained anonymous throughout the NXT era, disappearing after initial development',
      'The NXT codebase later spawned Ardor, Ignis, and influenced dozens of other projects',
      'Reached significant market capitalization and active community during 2014\u20132015',
      'Demonstrated that a single architect could design and launch an entire blockchain ecosystem',
    ],
    architecturalImpact:
      'Proved consensus does not require energy waste. NXT was the prototype for an entire generation of PoS systems. The architecture \u2014 modular, feature-rich, written from zero \u2014 set a template that Ethereum and others would later follow.',
  },
  {
    id: 'era-3',
    number: 'III',
    title: 'THE TANGLE MIND',
    subtitle: 'Come-from-Beyond',
    years: '2015\u20132019',
    tags: [
      { label: 'DAG pioneer' },
      { label: 'Tangle / non-linear DLT' },
      { label: 'Public architect' },
    ],
    narrative:
      'The blockchain was not sacred. Under his hands, the ledger itself was redesigned from first principles. The Tangle \u2014 a Directed Acyclic Graph \u2014 replaced the linear chain with a mesh of transactions that validate each other. No miners. No blocks. No fees. Every user simultaneously acts as a validator. The structure scales not despite usage, but because of it. More transactions make the network faster, not slower.',
    coreIdea: 'The blockchain is a line. Reality is a web. He built the web.',
    dossierItems: [
      'Co-founded IOTA in 2015 with the Tangle as its core data structure',
      'The Tangle is a DAG where each transaction validates two previous transactions',
      'Eliminated the need for miners, blocks, and transaction fees entirely',
      'IOTA reached a peak market capitalization exceeding $10 billion in late 2017',
      'Designed for the Internet of Things (IoT) \u2014 machine-to-machine micropayments',
      'Introduced ternary computing concepts to the blockchain space (trits and trytes)',
      'The Curl hash function, designed by CfB, was the subject of intense cryptographic debate',
      'Departed from the IOTA Foundation to focus on new architectures \u2014 what would become Qubic',
    ],
    architecturalImpact:
      'Challenged the linear blockchain paradigm at global scale. Proved that consensus structures are not limited to chains. The Tangle demonstrated that distributed ledger technology could be reimagined from the data structure level up.',
  },
  {
    id: 'era-4',
    number: 'IV',
    title: 'THE INTELLIGENT TISSUE',
    subtitle: 'CfB \u00b7 Qubic',
    years: '2019\u2013present',
    tags: [
      { label: 'Qubic founder' },
      { label: 'Useful PoW \u2192 decentralized intelligence' },
      { label: 'AGI architect' },
    ],
    narrative:
      'This is the culmination. Everything before \u2014 the viruses, the stakes, the tangles \u2014 was prologue. Qubic is not another blockchain. It is a machine that thinks. 676 Computors form a quorum-based network where Proof of Work is not wasted on hashing puzzles \u2014 it is spent training artificial intelligence. The energy that Bitcoin burns for security, Qubic redirects toward intelligence. Every cycle of computation produces something: a smarter network, a more capable oracle, a step closer to decentralized AGI.',
    coreIdea: 'Energy spent must think. Every computation must matter.',
    dossierItems: [
      '676 Computors form the backbone of the Qubic network \u2014 a quorum-based consensus system',
      'Useful Proof of Work: mining energy trains AI models instead of solving arbitrary hash puzzles',
      'Oracle Machines enable the network to interface with external reality \u2014 bridging on-chain and off-chain',
      'The architecture supports Smart Contracts executed by the full quorum (not individual nodes)',
      'Aigarth: the AI training framework built into the protocol \u2014 a 128x128 ternary neural matrix',
      'Neuraxon: next-generation AI architecture for decentralized cognitive processing',
      'The Anna Matrix \u2014 a 128\u00d7128 ternary structure \u2014 shows 99.58% point symmetry, suggesting deep architectural intent',
      'IPO (Initial Public Offering) mechanism for launching Smart Contracts, funded by the community',
      'Transaction throughput designed for massive scale: 40M+ transfers per second theoretical capacity',
    ],
    architecturalImpact:
      'Shifted the conversation from distributed ledgers to distributed intelligence. Qubic is the first protocol where the consensus mechanism itself is a cognitive process. This is not a blockchain with AI features \u2014 it is an AI system with blockchain properties.',
    isApex: true,
  },
  {
    id: 'era-5',
    number: 'V',
    title: 'THE SHADOW ARCHIVE',
    subtitle: 'MARIA hypothesis',
    years: '~2009',
    tags: [
      { label: 'Unverified identity' },
      { label: 'Early-era patterns' },
      { label: 'Speculation', variant: 'red' },
    ],
    narrative:
      'Some questions cannot be answered. They can only be held. The MARIA hypothesis exists in the space between on-chain forensics and community folklore. It is not a claim \u2014 it is a collection of patterns, timestamps, and behavioral observations that some community researchers have assembled. We present it here not as evidence, but as an open file.',
    coreIdea: 'Speculation \u2260 proof. But patterns exist.',
    dossierItems: [
      'Community researchers have noted timing correlations between early Bitcoin mining patterns and later CfB-associated activity',
      'The name "MARIA" appears in certain on-chain metadata and forum signatures from the 2009\u20132011 era',
      'Behavioral analysis of early Bitcointalk posts shows stylistic similarities, but stylometry is not proof',
      'Certain wallet patterns from the Satoshi-era show operational security practices consistent with later CfB behavior',
      'The 676 number (26\u00b2) appears in multiple contexts: Qubic Computors, ARK token supply factor, and early block patterns',
      'None of these observations constitute cryptographic proof \u2014 they are correlations, not causations',
      'The community treats this as an open research question, not a settled matter',
    ],
    architecturalImpact:
      'If any connection were ever proven, it would rewrite the history of cryptocurrency. But extraordinary claims require extraordinary evidence. The file remains open.',
    isLore: true,
    loreWarning:
      'UNVERIFIED \u00b7 COMMUNITY LORE \u2014 no cryptographic proof is provided here. The following is presented as community research and speculation, not established fact.',
  },
  {
    id: 'era-6',
    number: 'VI',
    title: 'THE ORIGIN QUESTION',
    subtitle: '[CLASSIFIED]',
    years: '\u2588\u2588\u2588\u2588',
    tags: [],
    narrative: '',
    coreIdea: 'We do not claim. We observe. We question.',
    dossierItems: [],
    architecturalImpact: '',
    isLocked: true,
  },
]

/* -------------------------------------------------------------------------- */
/*  GLITCH TEXT COMPONENT                                                     */
/* -------------------------------------------------------------------------- */

function useIdentityGlitch() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isGlitching, setIsGlitching] = useState(false)
  const [displayText, setDisplayText] = useState<string>(IDENTITIES[0].name)
  const [displayColor, setDisplayColor] = useState<string>(IDENTITIES[0].color)
  const [displayLabel, setDisplayLabel] = useState<string>(IDENTITIES[0].label)

  useEffect(() => {
    function scheduleNext() {
      const current = IDENTITIES[currentIndex] ?? IDENTITIES[0]
      // Vary timing: longer on COME-FROM-BEYOND, shorter on ???
      let delay: number
      if (current.name === 'COME-FROM-BEYOND') {
        delay = 3500 + Math.random() * 2000
      } else if (current.name === '???') {
        delay = 1200 + Math.random() * 800
      } else {
        delay = 1800 + Math.random() * 1500
      }

      const timer = setTimeout(() => {
        const nextIndex = (currentIndex + 1) % IDENTITIES.length
        const next = IDENTITIES[nextIndex] ?? IDENTITIES[0]

        // Phase 1: start glitch, flash random color
        setIsGlitching(true)
        const flashColors: string[] = ['#ff4444', '#5bc8f5', '#ff9944', '#fff']
        setDisplayColor(flashColors[Math.floor(Math.random() * flashColors.length)] ?? '#fff')

        // Phase 2: set new text while "glitching"
        setTimeout(() => {
          setDisplayText(next.name)
          setDisplayColor(next.color)
        }, 140)

        // Phase 3: end glitch, show final state
        setTimeout(() => {
          setIsGlitching(false)
          setDisplayLabel(next.label)
          setCurrentIndex(nextIndex)
        }, 280)
      }, delay)

      return timer
    }

    const timer = scheduleNext()
    return () => clearTimeout(timer)
  }, [currentIndex])

  return { displayText, displayColor, displayLabel, isGlitching }
}

function IdentityGlitchName({ text, color, isGlitching }: { text: string; color: string; isGlitching: boolean }) {
  return (
    <span
      className="inline-block relative"
      style={{
        color,
        textShadow: isGlitching
          ? '-5px 0 rgba(255,0,60,0.7), 5px 0 rgba(0,180,255,0.7), 0 0 20px rgba(255,0,60,0.3)'
          : `0 0 30px ${color}66`,
        transition: 'color 0.15s, text-shadow 0.1s',
        whiteSpace: 'nowrap',
        minWidth: '100%',
      }}
    >
      {text}
      {isGlitching && (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              color: 'rgba(255, 0, 60, 0.6)',
              clipPath: 'inset(15% 0 40% 0)',
              transform: 'translateX(-6px)',
            }}
          >
            {text}
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              color: 'rgba(0, 180, 255, 0.5)',
              clipPath: 'inset(60% 0 15% 0)',
              transform: 'translateX(6px)',
            }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  BLINKING CURSOR                                                           */
/* -------------------------------------------------------------------------- */

function BlinkingCursor() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const id = setInterval(() => setVisible(v => !v), 530)
    return () => clearInterval(id)
  }, [])
  return (
    <span
      style={{
        opacity: visible ? 1 : 0,
        color: GOLD,
        transition: 'opacity 0.08s',
      }}
    >
      |
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  TAG CHIP                                                                  */
/* -------------------------------------------------------------------------- */

function Tag({
  label,
  variant = 'default',
}: {
  label: string
  variant?: 'default' | 'red'
}) {
  const isRed = variant === 'red'
  return (
    <span
      className="inline-block text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-sm mr-1.5 mb-1.5"
      style={{
        fontFamily: 'var(--font-ibm-plex), monospace',
        background: isRed
          ? 'rgba(220, 50, 50, 0.12)'
          : 'rgba(240, 192, 48, 0.08)',
        color: isRed ? '#e55' : 'rgba(240, 192, 48, 0.7)',
        border: `1px solid ${isRed ? 'rgba(220, 50, 50, 0.2)' : 'rgba(240, 192, 48, 0.15)'}`,
      }}
    >
      {label}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  ACCORDION DOSSIER                                                         */
/* -------------------------------------------------------------------------- */

function DossierAccordion({
  architecturalImpact,
  items,
}: {
  architecturalImpact: string
  items: string[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6">
      <button
        aria-expanded={open}
        className="flex items-center gap-2 group cursor-pointer"
        onClick={() => setOpen(!open)}
        style={{
          fontFamily: 'var(--font-ibm-plex), monospace',
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(240, 192, 48, 0.5)',
          background: 'none',
          border: 'none',
          padding: 0,
        }}
        type="button"
      >
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="inline-flex"
          transition={{ duration: 0.25 }}
        >
          <ChevronDown size={14} />
        </motion.span>
        <span className="group-hover:text-[#f0c030] transition-colors duration-200">
          {open ? 'Close Dossier' : 'Open Dossier'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div
              className="mt-4 pt-4"
              style={{ borderTop: '1px solid rgba(240, 192, 48, 0.08)' }}
            >
              <div
                className="text-[10px] uppercase tracking-[0.2em] mb-3"
                style={{
                  fontFamily: 'var(--font-ibm-plex), monospace',
                  color: 'rgba(240, 192, 48, 0.4)',
                }}
              >
                {'// DOSSIER ENTRIES'}
              </div>

              <ul className="space-y-2.5">
                {items.map((item, i) => (
                  <motion.li
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 text-sm leading-relaxed"
                    initial={{ opacity: 0, x: -10 }}
                    key={`dossier-${item.slice(0, 20)}-${i}`}
                    style={{
                      fontFamily: 'var(--font-ibm-plex), monospace',
                      color: 'rgba(245, 240, 232, 0.55)',
                    }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                  >
                    <span
                      className="mt-2 shrink-0 w-1 h-1 rounded-full"
                      style={{ background: GOLD_DIM }}
                    />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>

              {architecturalImpact && (
                <div
                  className="mt-6 p-4 rounded-sm"
                  style={{
                    background: 'rgba(240, 192, 48, 0.03)',
                    border: '1px solid rgba(240, 192, 48, 0.08)',
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-[0.2em] mb-2"
                    style={{
                      fontFamily: 'var(--font-ibm-plex), monospace',
                      color: 'rgba(240, 192, 48, 0.4)',
                    }}
                  >
                    Architectural Impact
                  </div>
                  <p
                    className="text-sm leading-relaxed italic"
                    style={{
                      fontFamily: 'var(--font-cormorant), serif',
                      color: 'rgba(245, 240, 232, 0.6)',
                    }}
                  >
                    {architecturalImpact}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  ERA CARD                                                                  */
/* -------------------------------------------------------------------------- */

function EraCard({ era }: { era: EraData }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  if (era.isLocked) {
    return <LockedEraCard era={era} />
  }

  return (
    <motion.div
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      className="relative scroll-mt-32"
      id={era.id}
      initial={{ opacity: 0, y: 40 }}
      ref={ref}
      style={{
        padding: '2px',
        borderRadius: '4px',
        background: era.isApex
          ? 'linear-gradient(135deg, rgba(240, 192, 48, 0.25), rgba(240, 192, 48, 0.05), rgba(240, 192, 48, 0.15))'
          : 'transparent',
        boxShadow: era.isApex
          ? '0 0 40px rgba(240, 192, 48, 0.08), inset 0 0 40px rgba(240, 192, 48, 0.03)'
          : 'none',
      }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div
        className="relative rounded-[3px] p-6 sm:p-8"
        style={{
          background: era.isApex
            ? 'linear-gradient(135deg, rgba(12, 10, 3, 0.98), rgba(20, 16, 5, 0.95))'
            : 'rgba(255, 255, 255, 0.02)',
          border: era.isApex ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        {/* Era number + title header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div
              className="text-[10px] uppercase tracking-[0.25em] mb-1"
              style={{
                fontFamily: 'var(--font-ibm-plex), monospace',
                color: era.isApex ? GOLD : 'rgba(240, 192, 48, 0.4)',
              }}
            >
              Era {era.number} &mdash; {era.years}
            </div>

            <h3
              className="text-2xl sm:text-3xl tracking-wide"
              style={{
                fontFamily: "'Bebas Neue', var(--font-display), sans-serif",
                color: WARM_WHITE,
              }}
            >
              {era.title}
            </h3>

            <div
              className="text-xs mt-1"
              style={{
                fontFamily: 'var(--font-ibm-plex), monospace',
                color: 'rgba(240, 192, 48, 0.45)',
              }}
            >
              {era.subtitle}
            </div>
          </div>

          {era.isApex && (
            <div
              className="text-[9px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-sm shrink-0 mt-1"
              style={{
                fontFamily: 'var(--font-ibm-plex), monospace',
                background: 'rgba(240, 192, 48, 0.1)',
                color: GOLD,
                border: '1px solid rgba(240, 192, 48, 0.25)',
              }}
            >
              APEX
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mb-5 flex flex-wrap">
          {era.tags.map(tag => (
            <Tag key={tag.label} label={tag.label} variant={tag.variant} />
          ))}
        </div>

        {/* Lore warning */}
        {era.isLore && era.loreWarning && (
          <div
            className="flex items-start gap-3 p-3.5 rounded-sm mb-5"
            style={{
              background: 'rgba(220, 50, 50, 0.06)',
              border: '1px solid rgba(220, 50, 50, 0.15)',
            }}
          >
            <AlertTriangle
              className="shrink-0 mt-0.5"
              size={16}
              style={{ color: '#e55' }}
            />
            <p
              className="text-xs leading-relaxed"
              style={{
                fontFamily: 'var(--font-ibm-plex), monospace',
                color: 'rgba(220, 100, 100, 0.8)',
              }}
            >
              {era.loreWarning}
            </p>
          </div>
        )}

        {/* Narrative */}
        <p
          className="text-sm sm:text-[15px] leading-[1.8] mb-5"
          style={{
            fontFamily: 'var(--font-ibm-plex), monospace',
            color: 'rgba(245, 240, 232, 0.55)',
          }}
        >
          {era.narrative}
        </p>

        {/* Core idea */}
        <div
          className="pl-4 mb-4"
          style={{ borderLeft: '2px solid rgba(240, 192, 48, 0.2)' }}
        >
          <div
            className="text-[9px] uppercase tracking-[0.2em] mb-1.5"
            style={{
              fontFamily: 'var(--font-ibm-plex), monospace',
              color: 'rgba(240, 192, 48, 0.35)',
            }}
          >
            Core Idea
          </div>
          <p
            className="text-base sm:text-lg italic leading-relaxed"
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              color: GOLD,
              textShadow: '0 0 20px rgba(240, 192, 48, 0.15)',
            }}
          >
            &ldquo;{era.coreIdea}&rdquo;
          </p>
        </div>

        {/* Accordion */}
        {era.dossierItems.length > 0 && (
          <DossierAccordion
            architecturalImpact={era.architecturalImpact}
            items={era.dossierItems}
          />
        )}
      </div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  LOCKED ERA CARD                                                           */
/* -------------------------------------------------------------------------- */

function LockedEraCard({ era }: { era: EraData }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      className="relative scroll-mt-32"
      id={era.id}
      initial={{ opacity: 0, y: 40 }}
      ref={ref}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div
        className="relative rounded-[3px] p-6 sm:p-8 overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.015)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        {/* Blur overlay */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{
            backdropFilter: 'blur(4px)',
            background: 'rgba(3, 3, 3, 0.6)',
          }}
        >
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Lock size={32} style={{ color: 'rgba(240, 192, 48, 0.4)' }} />
          </motion.div>

          <div
            className="mt-4 px-5 py-2 rounded-sm"
            style={{
              border: '1px solid rgba(220, 50, 50, 0.3)',
              background: 'rgba(220, 50, 50, 0.06)',
            }}
          >
            <span
              className="text-xs uppercase tracking-[0.3em]"
              style={{
                fontFamily: 'var(--font-ibm-plex), monospace',
                color: 'rgba(220, 80, 80, 0.8)',
              }}
            >
              ACCESS DENIED
            </span>
          </div>

          <div
            className="mt-4 text-lg tracking-[0.15em]"
            style={{
              fontFamily: "'Bebas Neue', var(--font-display), sans-serif",
              color: 'rgba(245, 240, 232, 0.25)',
            }}
          >
            SATOSHI NAKAMOTO
          </div>

          <div
            className="mt-2 text-[10px] tracking-[0.15em]"
            style={{
              fontFamily: 'var(--font-ibm-plex), monospace',
              color: 'rgba(240, 192, 48, 0.3)',
            }}
          >
            Cryptographic proof required.
          </div>
        </div>

        {/* Redacted background content */}
        <div aria-hidden="true" className="relative z-0 select-none">
          <div
            className="text-[10px] uppercase tracking-[0.25em] mb-1"
            style={{
              fontFamily: 'var(--font-ibm-plex), monospace',
              color: 'rgba(240, 192, 48, 0.15)',
            }}
          >
            Era {era.number} &mdash; {era.years}
          </div>

          <h3
            className="text-2xl sm:text-3xl tracking-wide mb-4"
            style={{
              fontFamily: "'Bebas Neue', var(--font-display), sans-serif",
              color: 'rgba(245, 240, 232, 0.08)',
            }}
          >
            {era.title}
          </h3>

          {/* Redacted lines */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div className="flex gap-2 mb-2" key={`redacted-row-${i}`}>
              {[0, 1, 2].slice(0, 3 + (i % 3)).map(j => (
                <div
                  className="h-3 rounded-sm"
                  key={`redacted-block-${i}-${j}`}
                  style={{
                    width: `${40 + ((i * 17 + j * 31) % 80)}px`,
                    background: 'rgba(245, 240, 232, 0.04)',
                  }}
                />
              ))}
            </div>
          ))}

          <div className="mt-6">
            <div
              className="pl-4"
              style={{ borderLeft: '2px solid rgba(240, 192, 48, 0.06)' }}
            >
              <p
                className="text-base italic"
                style={{
                  fontFamily: 'var(--font-cormorant), serif',
                  color: 'rgba(240, 192, 48, 0.12)',
                }}
              >
                &ldquo;{era.coreIdea}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  TIMELINE SIDEBAR                                                          */
/* -------------------------------------------------------------------------- */

function TimelineSidebar({ activeEra }: { activeEra: string }) {
  return (
    <nav
      aria-label="Era timeline navigation"
      className="hidden lg:block sticky top-32 self-start"
      style={{ width: '240px', flexShrink: 0 }}
    >
      <div
        className="text-[9px] uppercase tracking-[0.3em] mb-6"
        style={{
          fontFamily: 'var(--font-ibm-plex), monospace',
          color: 'rgba(240, 192, 48, 0.35)',
        }}
      >
        Timeline
      </div>

      <div className="relative pl-5">
        {/* Vertical gold line */}
        <div
          className="absolute left-[7px] top-0 bottom-0 w-px"
          style={{ background: 'rgba(240, 192, 48, 0.12)' }}
        />

        {ERAS.map(era => {
          const isActive = activeEra === era.id
          return (
            <a
              className="relative flex items-start gap-3 mb-6 group no-underline"
              href={`#${era.id}`}
              key={era.id}
              onClick={e => {
                e.preventDefault()
                const el = document.getElementById(era.id)
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
            >
              {/* Dot */}
              <div
                className="absolute left-[-13px] top-[6px] w-[9px] h-[9px] rounded-full transition-all duration-300"
                style={{
                  background: isActive ? GOLD : 'rgba(240, 192, 48, 0.15)',
                  boxShadow: isActive
                    ? '0 0 10px rgba(240, 192, 48, 0.4)'
                    : 'none',
                  border: isActive
                    ? `1px solid ${GOLD}`
                    : '1px solid rgba(240, 192, 48, 0.2)',
                }}
              />

              <div>
                <div
                  className="text-[9px] uppercase tracking-[0.15em] mb-0.5 transition-colors duration-200"
                  style={{
                    fontFamily: 'var(--font-ibm-plex), monospace',
                    color: isActive
                      ? 'rgba(240, 192, 48, 0.7)'
                      : 'rgba(240, 192, 48, 0.25)',
                  }}
                >
                  Era {era.number}
                </div>
                <div
                  className="text-xs leading-snug transition-colors duration-200"
                  style={{
                    fontFamily: 'var(--font-ibm-plex), monospace',
                    color: isActive
                      ? 'rgba(245, 240, 232, 0.8)'
                      : 'rgba(245, 240, 232, 0.3)',
                  }}
                >
                  {era.title}
                </div>
                <div
                  className="text-[10px] mt-0.5 transition-colors duration-200"
                  style={{
                    fontFamily: 'var(--font-ibm-plex), monospace',
                    color: isActive
                      ? 'rgba(245, 240, 232, 0.35)'
                      : 'rgba(245, 240, 232, 0.15)',
                  }}
                >
                  {era.years}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/*  HEADER                                                                    */
/* -------------------------------------------------------------------------- */

function PageHeader() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const identity = useIdentityGlitch()

  return (
    <header
      className="relative pt-24 sm:pt-32 pb-12 sm:pb-16 px-6 sm:px-12 lg:px-20 overflow-hidden"
      ref={ref}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Background watermark */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none hidden lg:block"
        style={{
          right: '-2rem',
          top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: "'Bebas Neue', var(--font-display), sans-serif",
          fontSize: '18rem',
          color: 'rgba(255,255,255,0.015)',
          lineHeight: 1,
          letterSpacing: '-0.05em',
        }}
      >
        ARCHIVE
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Eyebrow */}
        <motion.div
          animate={isInView ? { opacity: 1 } : {}}
          className="flex items-center gap-4 mb-8 sm:mb-10"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="h-px w-10"
            style={{ background: GOLD, opacity: 0.5 }}
          />
          <span
            className="text-[10px] sm:text-[11px] uppercase tracking-[0.4em] sm:tracking-[0.55em]"
            style={{
              fontFamily: 'var(--font-ibm-plex), monospace',
              color: 'rgba(240, 192, 48, 0.7)',
            }}
          >
            Qubic Church &middot; Dossier Archive &middot; Open Investigation
          </span>
          <div
            className="h-px w-10"
            style={{ background: GOLD, opacity: 0.5 }}
          />
        </motion.div>

        {/* Main title block — left aligned like reference */}
        <motion.div
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <h1
            style={{
              fontFamily: "'Bebas Neue', var(--font-display), sans-serif",
              fontSize: 'clamp(4rem, 9vw, 11rem)',
              lineHeight: 0.9,
              letterSpacing: '0.02em',
              color: WARM_WHITE,
              marginBottom: '0.5rem',
            }}
          >
            THE EVOLUTION
            <span
              className="block"
              style={{
                fontSize: 'clamp(3rem, 6.5vw, 7.5rem)',
                lineHeight: 1,
                minHeight: '1em',
              }}
            >
              <IdentityGlitchName
                text={identity.displayText}
                color={identity.displayColor}
                isGlitching={identity.isGlitching}
              />
            </span>
          </h1>
        </motion.div>

        {/* Identity label — updates with each identity */}
        <motion.div
          animate={isInView ? { opacity: 1 } : {}}
          className="mb-8 sm:mb-10"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <span
            className="text-xs sm:text-sm"
            style={{
              fontFamily: 'var(--font-ibm-plex), monospace',
              color: 'rgba(240, 192, 48, 0.35)',
              transition: 'opacity 0.15s',
            }}
          >
            {identity.displayLabel}
            <BlinkingCursor />
          </span>
        </motion.div>

        {/* Description + disclaimer row */}
        <motion.div
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-col sm:flex-row items-end justify-between gap-6 sm:gap-8 mt-6"
          initial={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p
            className="text-base sm:text-lg leading-[1.8] max-w-xl"
            style={{
              fontFamily: "'Cormorant Garamond', var(--font-serif), serif",
              color: 'rgba(245, 240, 232, 0.55)',
            }}
          >
            An archive of eras, personas, and technological shifts. From the
            emergence of distributed systems thinking to the frontier of
            decentralized intelligence.
          </p>

          <div
            className="sm:max-w-[260px] text-[11px] leading-relaxed p-3.5 rounded-sm shrink-0"
            style={{
              fontFamily: 'var(--font-ibm-plex), monospace',
              color: 'rgba(245, 240, 232, 0.3)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            Facts + community lore. Speculation is labeled. No claim is made
            beyond what is publicly documented.
          </div>
        </motion.div>

        {/* Gold gradient rule */}
        <motion.div
          animate={isInView ? { scaleX: 1 } : {}}
          className="mt-12 sm:mt-16 h-px"
          initial={{ scaleX: 0 }}
          style={{
            background: `linear-gradient(to right, transparent, ${GOLD_DIM}, transparent)`,
          }}
          transition={{ duration: 0.8, delay: 0.7 }}
        />
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/*  DISCLAIMER BLOCK                                                          */
/* -------------------------------------------------------------------------- */

function DisclaimerBlock() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      animate={isInView ? { opacity: 1 } : {}}
      className="max-w-3xl mx-auto px-6 py-16"
      initial={{ opacity: 0 }}
      ref={ref}
      transition={{ duration: 0.8 }}
    >
      <div
        className="h-px mb-10"
        style={{
          background: `linear-gradient(to right, transparent, ${GOLD_DIM}, transparent)`,
        }}
      />

      <div
        className="text-[10px] uppercase tracking-[0.25em] mb-4"
        style={{
          fontFamily: 'var(--font-ibm-plex), monospace',
          color: 'rgba(240, 192, 48, 0.3)',
        }}
      >
        {'// Disclaimer'}
      </div>

      <p
        className="text-xs sm:text-sm leading-[1.9]"
        style={{
          fontFamily: 'var(--font-ibm-plex), monospace',
          color: 'rgba(245, 240, 232, 0.3)',
        }}
      >
        This page documents publicly available information, on-chain data, forum
        archives, behavioral patterns, and community interpretations. No
        definitive claim is made regarding the identity of Satoshi Nakamoto or
        any undisclosed connection between public personas. Where speculation
        appears, it is explicitly labeled. This archive is maintained as a
        community resource for open research and historical documentation.
      </p>

      <div
        className="h-px mt-10"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(255,255,255,0.04), transparent)',
        }}
      />
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  FOOTER                                                                    */
/* -------------------------------------------------------------------------- */

function PageFooter() {
  return (
    <div className="text-center pb-20 pt-4">
      <motion.span
        animate={{ opacity: 1 }}
        className="text-xs"
        initial={{ opacity: 0 }}
        style={{
          fontFamily: 'var(--font-ibm-plex), monospace',
          color: 'rgba(245, 240, 232, 0.12)',
        }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        thankful_for_today.
      </motion.span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  HOME BUTTON                                                               */
/* -------------------------------------------------------------------------- */

function HomeButton() {
  return (
    <Link
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-sm no-underline group transition-all duration-300"
      href="/"
      style={{
        fontFamily: 'var(--font-ibm-plex), monospace',
        fontSize: '11px',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'rgba(240, 192, 48, 0.5)',
        background: 'rgba(3, 3, 3, 0.8)',
        border: '1px solid rgba(240, 192, 48, 0.15)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <ArrowLeft
        className="group-hover:-translate-x-0.5 transition-transform duration-200"
        size={12}
      />
      <span className="group-hover:text-[#f0c030] transition-colors duration-200">
        HOME
      </span>
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/*  MAIN PAGE                                                                 */
/* -------------------------------------------------------------------------- */

export default function CfbPage() {
  const [activeEra, setActiveEra] = useState('era-1')

  // Intersection Observer to track active era for timeline sidebar
  useEffect(() => {
    const observers: IntersectionObserver[] = []

    for (const era of ERAS) {
      const el = document.getElementById(era.id)
      if (!el) continue

      const observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveEra(era.id)
            }
          }
        },
        {
          rootMargin: '-30% 0px -60% 0px',
          threshold: 0,
        }
      )

      observer.observe(el)
      observers.push(observer)
    }

    return () => {
      for (const obs of observers) {
        obs.disconnect()
      }
    }
  }, [])

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: VOID,
        color: WARM_WHITE,
      }}
    >
      {/* Subtle radial gradient background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(240, 192, 48, 0.02) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <PageHeader />

      {/* Main two-column layout */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-8">
        <div className="flex gap-12">
          {/* Sticky timeline nav (desktop only) */}
          <TimelineSidebar activeEra={activeEra} />

          {/* Era cards */}
          <div className="flex-1 min-w-0 space-y-8 sm:space-y-10">
            {ERAS.map(era => (
              <EraCard era={era} key={era.id} />
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <DisclaimerBlock />

      {/* Footer */}
      <PageFooter />

      {/* Home button */}
      <HomeButton />
    </div>
  )
}
