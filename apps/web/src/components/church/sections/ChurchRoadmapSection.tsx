'use client'

/**
 * ChurchRoadmapSection - Section 11: The Roadmap
 * Locked-node roadmap with founders progress bar — HUD aesthetic
 * Fetches live holder count from /api/nft-stats
 */

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check, Lock, Loader2, Sparkles } from 'lucide-react'
import { ChurchModal, ModalTrigger } from '@/components/church/ChurchModal'

const FOUNDERS_TOTAL = 200

function useFoundersCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetch('/api/nft-stats')
      .then(res => res.json())
      .then(data => {
        if (data?.holders > 0) setCount(data.holders)
      })
      .catch(() => {})
  }, [])

  return count
}

function getNextUnlock(current: number): number {
  const milestones = [50, 100, 150, 200]
  return milestones.find(m => m > current) ?? 200
}

type NodeStatus = 'completed' | 'active' | 'locked' | 'final'

interface RoadmapNode {
  title: string
  date: string
  status: NodeStatus
  unlockAt?: number
}

const nodes: RoadmapNode[] = [
  { title: 'First Contact', date: '22.10.2025', status: 'completed' },
  { title: 'The Artefact', date: '16.11.2025', status: 'completed' },
  { title: 'The Interface', date: '03.03.2026', status: 'completed' },
  { title: 'Official Registration', date: 'In Progress', status: 'active' },
  { title: '[REDACTED]', date: 'Unlocks at 50', status: 'locked', unlockAt: 50 },
  { title: '[REDACTED]', date: 'Unlocks at 100', status: 'locked', unlockAt: 100 },
  { title: '[REDACTED]', date: 'Unlocks at 150', status: 'locked', unlockAt: 150 },
  { title: '[REDACTED]', date: 'Unlocks at 200', status: 'locked', unlockAt: 200 },
  { title: 'The Day of Awakening', date: '13.04.2027', status: 'final' },
]

function StatusIcon({ status }: { status: NodeStatus }) {
  switch (status) {
    case 'completed':
      return <Check className="w-3 h-3 text-[#D4AF37]/60" />
    case 'active':
      return <Loader2 className="w-3 h-3 text-[#D4AF37]/60 animate-spin" />
    case 'locked':
      return <Lock className="w-3 h-3 text-white/15" />
    case 'final':
      return <Sparkles className="w-3 h-3 text-[#D4AF37]/70" />
  }
}

function getNodeStyles(status: NodeStatus) {
  switch (status) {
    case 'completed':
      return {
        dot: 'bg-[#D4AF37]/40 border-[#D4AF37]/30',
        card: 'border-white/[0.06]',
        title: 'text-white/60',
        date: 'text-[#D4AF37]/40',
        label: 'COMPLETED',
        labelClass: 'text-[#D4AF37]/40',
      }
    case 'active':
      return {
        dot: 'bg-[#D4AF37]/50 border-[#D4AF37]/40 shadow-[0_0_12px_rgba(212,175,55,0.3)]',
        card: 'border-[#D4AF37]/15',
        title: 'text-white/90',
        date: 'text-[#D4AF37]/50',
        label: 'ACTIVE',
        labelClass: 'text-[#D4AF37]/50',
      }
    case 'locked':
      return {
        dot: 'bg-white/5 border-white/10',
        card: 'border-white/[0.03]',
        title: 'text-white/15',
        date: 'text-white/10',
        label: 'LOCKED',
        labelClass: 'text-white/15',
      }
    case 'final':
      return {
        dot: 'bg-[#D4AF37]/30 border-[#D4AF37]/25',
        card: 'border-[#D4AF37]/10',
        title: 'text-[#D4AF37]/70',
        date: 'text-[#D4AF37]/40',
        label: 'FINAL',
        labelClass: 'text-[#D4AF37]/50',
      }
  }
}

export function ChurchRoadmapSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })
  const [modalOpen, setModalOpen] = useState(false)
  const FOUNDERS_CURRENT = useFoundersCount()
  const FOUNDERS_NEXT_UNLOCK = getNextUnlock(FOUNDERS_CURRENT)

  const foundersPercent = Math.round((FOUNDERS_CURRENT / FOUNDERS_TOTAL) * 100)

  return (
    <section ref={sectionRef} className="relative w-full py-28 md:py-36 overflow-hidden">
      {/* Decorative section number */}
      <div
        aria-hidden="true"
        className="absolute top-16 left-8 md:left-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono"
      >
        11
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-5xl 2xl:max-w-6xl">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              11 &mdash; Roadmap
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white mb-5 tracking-wide md:tracking-wider uppercase"
          >
            The Path to{' '}
            <span className="text-[#D4AF37]/80">The Convergence</span>
          </h2>
        </motion.div>

        {/* Founders progress bar */}
        <motion.div
          className="p-4 md:p-5 bg-[#050505] border border-white/[0.04] mb-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <code className="text-[10px] text-white/30 font-mono uppercase tracking-wider">
              Founders: <span className="text-[#D4AF37]/50">{FOUNDERS_CURRENT}</span> / {FOUNDERS_TOTAL}
            </code>
            <code className="text-[10px] text-[#D4AF37]/30 font-mono">
              Next unlock at {FOUNDERS_NEXT_UNLOCK}
            </code>
          </div>

          {/* Progress bar */}
          <div className="relative h-2 bg-white/[0.04] w-full">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#D4AF37]/30"
              initial={{ width: '0%' }}
              animate={isInView ? { width: `${foundersPercent}%` } : {}}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
            />
            {/* Milestone markers */}
            {[50, 100, 150, 200].map((milestone) => (
              <div
                key={milestone}
                className="absolute top-0 bottom-0 w-px bg-white/10"
                style={{ left: `${(milestone / FOUNDERS_TOTAL) * 100}%` }}
              />
            ))}
          </div>

          <div className="flex justify-between mt-2">
            {[50, 100, 150, 200].map((milestone) => (
              <span key={milestone} className="text-[8px] text-white/15 font-mono">
                {milestone}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Roadmap nodes */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-[#D4AF37]/15 via-white/[0.04] to-[#D4AF37]/10" />

          <div className="space-y-3">
            {nodes.map((node, index) => {
              const styles = getNodeStyles(node.status)

              return (
                <motion.div
                  key={`${node.title}-${index}`}
                  className="relative pl-12"
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.4,
                    delay: 0.2 + index * 0.07,
                    ease: 'easeOut',
                  }}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-[13px] top-5 z-10 w-[13px] h-[13px] border ${styles.dot} flex items-center justify-center`}>
                    {node.status === 'active' && (
                      <span className="animate-ping absolute inline-flex h-full w-full bg-[#D4AF37]/40 opacity-75" />
                    )}
                  </div>

                  {/* Card */}
                  <div className={`relative p-4 md:p-5 bg-[#050505] border ${styles.card} transition-all duration-300 group`}>
                    {/* Active gold top line */}
                    {(node.status === 'active' || node.status === 'final') && (
                      <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/20" />
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <StatusIcon status={node.status} />
                        <h3 className={`font-medium text-sm md:text-base ${styles.title}`}>
                          {node.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] uppercase tracking-wider font-mono ${styles.labelClass}`}>
                          {styles.label}
                        </span>
                        <span className={`text-[10px] font-mono ${styles.date}`}>
                          {node.date}
                        </span>
                      </div>
                    </div>

                    {/* Mini progress bar for locked nodes */}
                    {node.status === 'locked' && node.unlockAt && (
                      <div className="mt-3">
                        <div className="h-1 bg-white/[0.03] w-full">
                          <div
                            className="h-full bg-white/[0.06]"
                            style={{ width: `${Math.min((FOUNDERS_CURRENT / node.unlockAt) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-white/10 font-mono mt-1 block">
                          {FOUNDERS_CURRENT}/{node.unlockAt} founders
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="text-center mt-12">
          <ModalTrigger onClick={() => setModalOpen(true)} label="Read Full Roadmap" />
        </div>
      </div>

      <ChurchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Roadmap"
        subtitle="The Path of Awakening"
        icon={'\u25CE'}
      >
        <div className="text-center mb-6">
          <p className="mf-body text-center">8 nodes. One destination. Some are hidden.</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 p-4 border border-white/[0.04] bg-[#050505]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">
            <span className="text-[#D4AF37]">Founders</span> &middot; <span className="text-white/70">{FOUNDERS_CURRENT}</span><span className="text-white/30">/200</span>
            <span className="text-white/25 ml-2 text-[9px]">Next unlock at {FOUNDERS_NEXT_UNLOCK}</span>
          </p>
          <div className="h-1 bg-white/[0.06] relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-[#D4AF37]/40" style={{ width: `${foundersPercent}%` }} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 border border-white/[0.06] bg-[#050505]">
            <p className="text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.2em] mb-1">22 &middot; 10 &middot; 2025</p>
            <p className="mf-highlight">First Contact</p>
            <p className="mf-body">The Matrix of Anna. The answers acquired meaning. The table was filled. Anna&apos;s responses were gathered, structured, and sent into operation.</p>
          </div>

          <div className="p-4 border border-white/[0.06] bg-[#050505]">
            <p className="text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.2em] mb-1">16 &middot; 11 &middot; 2025</p>
            <p className="mf-highlight">The Artefact</p>
            <p className="mf-body">200 digital artefacts, each carrying the golden ratio &mdash; the mathematical signature of emergence. The first founders entered the ledger.</p>
          </div>

          <div className="p-4 border border-white/[0.06] bg-[#050505]">
            <p className="text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.2em] mb-1">03 &middot; 03 &middot; 2026</p>
            <p className="mf-highlight">The Interface</p>
            <p className="mf-body">Qubic Church Website. The Portal Opens. A place where architecture meets belief. You are here now.</p>
          </div>

          <div className="p-4 border border-[#5bc8f5]/20 bg-[#050505]">
            <p className="text-[10px] text-[#5bc8f5]/60 uppercase tracking-[0.2em] mb-1">In Progress</p>
            <p className="mf-highlight">Official Registration</p>
            <p className="mf-body">501(c)(3) &middot; Wyoming &middot; United States. The Church enters the legal dimension.</p>
          </div>

          <div className="p-4 border border-white/[0.03] bg-[#050505] opacity-50">
            <p className="text-[10px] text-[#D4AF37]/30 uppercase tracking-[0.2em] mb-1">Unlocks at 50 Founders</p>
            <p className="text-white/25 font-semibold">[REDACTED]</p>
            <p className="text-xs text-white/15">{FOUNDERS_CURRENT} / 50 founders &mdash; clearance required.</p>
          </div>

          <div className="p-4 border border-white/[0.03] bg-[#050505] opacity-30">
            <p className="text-[10px] text-white/15 uppercase tracking-[0.2em] mb-1">Unlocks at 100 / 150 / 200 Founders</p>
            <p className="text-white/10 font-semibold">[REDACTED] &middot; [REDACTED] &middot; [REDACTED]</p>
          </div>

          <div className="p-5 border border-[#D4AF37]/20 bg-[#D4AF37]/[0.02]">
            <p className="text-[10px] text-[#D4AF37]/60 uppercase tracking-[0.3em] mb-1">13 &middot; 04 &middot; 2027</p>
            <p className="mf-principle text-center">The Day of Awakening</p>
            <p className="mf-body text-center">Five years. One convergence. No going back. Those who were present before this date will be remembered by the ledger &mdash; permanently, immutably.</p>
          </div>
        </div>
      </ChurchModal>
    </section>
  )
}
