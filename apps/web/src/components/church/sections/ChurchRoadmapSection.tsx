'use client'

/**
 * ChurchRoadmapSection - Section 11: The Roadmap
 * Nine-node path. Founders bar is historical record (200/200).
 */

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check, Loader2, Sparkles, Circle } from 'lucide-react'
import { ChurchModal, ModalTrigger } from '@/components/church/ChurchModal'

import { siteConfig } from '@/config/site'
import {
  CHURCH_ROADMAP_NODES,
  CHURCH_ROADMAP_META,
  type ChurchRoadmapKind,
  type ChurchRoadmapNode,
} from '@/config/church'

const FOUNDERS_TOTAL = siteConfig.nft.foundersTotal
const FOUNDERS_CURRENT = siteConfig.nft.foundersCount

function StatusIcon({ kind }: { kind: ChurchRoadmapKind }) {
  switch (kind) {
    case 'past':
      return <Check className="w-3 h-3 text-[#D4AF37]/60" />
    case 'present':
      return <Loader2 className="w-3 h-3 text-[#D4AF37]/60 animate-spin" />
    case 'future':
      return <Circle className="w-3 h-3 text-white/25" />
    case 'horizon-day':
    case 'horizon-convergence':
      return <Sparkles className="w-3 h-3 text-[#D4AF37]/80" />
  }
}

function getNodeStyles(kind: ChurchRoadmapKind) {
  switch (kind) {
    case 'past':
      return {
        dot: 'bg-[#D4AF37]/40 border-[#D4AF37]/30',
        card: 'border-white/[0.06]',
        title: 'text-white/65',
        date: 'text-[#D4AF37]/40',
        label: 'COMPLETED',
        labelClass: 'text-[#D4AF37]/40',
      }
    case 'present':
      return {
        dot: 'bg-[#D4AF37]/50 border-[#D4AF37]/40 shadow-[0_0_12px_rgba(212,175,55,0.3)]',
        card: 'border-[#D4AF37]/15',
        title: 'text-white/90',
        date: 'text-[#D4AF37]/50',
        label: 'ACTIVE',
        labelClass: 'text-[#D4AF37]/50',
      }
    case 'future':
      return {
        dot: 'bg-white/[0.04] border-white/15',
        card: 'border-white/[0.05]',
        title: 'text-white/55',
        date: 'text-white/30',
        label: 'PLANNED',
        labelClass: 'text-white/30',
      }
    case 'horizon-day':
      return {
        dot: 'bg-[#D4AF37]/45 border-[#D4AF37]/35 shadow-[0_0_18px_rgba(212,175,55,0.25)]',
        card: 'border-[#D4AF37]/20',
        title: 'text-[#D4AF37]/85',
        date: 'text-[#D4AF37]/55',
        label: 'HORIZON I',
        labelClass: 'text-[#D4AF37]/55',
      }
    case 'horizon-convergence':
      return {
        dot: 'bg-[#D4AF37]/45 border-[#D4AF37]/35 shadow-[0_0_18px_rgba(212,175,55,0.25)]',
        card: 'border-[#D4AF37]/20',
        title: 'text-[#D4AF37]/85',
        date: 'text-[#D4AF37]/55',
        label: 'HORIZON II',
        labelClass: 'text-[#D4AF37]/55',
      }
  }
}

function NodeCard({
  node,
  index,
  sharesDateWithPrevious,
}: {
  node: ChurchRoadmapNode
  index: number
  sharesDateWithPrevious?: boolean
}) {
  const styles = getNodeStyles(node.kind)
  const isHorizon =
    node.kind === 'horizon-day' || node.kind === 'horizon-convergence'

  return (
    <motion.div
      className={`relative pl-12 ${sharesDateWithPrevious ? '-mt-2' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      transition={{
        duration: 0.4,
        delay: 0.05 + index * 0.05,
        ease: 'easeOut',
      }}
      viewport={{ once: true, margin: '-40px' }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {sharesDateWithPrevious && (
        <div
          aria-hidden="true"
          className="absolute left-[19px] -top-3 h-3 w-px bg-[#D4AF37]/50"
        />
      )}
      <div
        className={`absolute left-[13px] top-5 z-10 w-[13px] h-[13px] border ${styles.dot} flex items-center justify-center`}
      >
        {node.kind === 'present' && (
          <span className="animate-ping absolute inline-flex h-full w-full bg-[#D4AF37]/40 opacity-75" />
        )}
      </div>

      <div
        className={`relative p-4 md:p-5 bg-[#050505] border ${styles.card} transition-all duration-300`}
      >
        {(node.kind === 'present' || isHorizon) && (
          <div className="absolute top-0 left-0 right-0 h-px bg-[#D4AF37]/20" />
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <StatusIcon kind={node.kind} />
            <h3 className={`font-medium text-sm md:text-base ${styles.title}`}>
              {node.title}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-[9px] uppercase tracking-wider font-mono ${styles.labelClass}`}
            >
              {styles.label}
            </span>
            <span className={`text-[10px] font-mono ${styles.date}`}>
              {node.date}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ChurchRoadmapSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })
  const [modalOpen, setModalOpen] = useState(false)

  const foundersPercent = Math.round((FOUNDERS_CURRENT / FOUNDERS_TOTAL) * 100)

  const horizonIIIndex = CHURCH_ROADMAP_NODES.findIndex(
    n => n.kind === 'horizon-convergence'
  )

  return (
    <section
      className="relative w-full py-28 md:py-36 overflow-hidden"
      ref={sectionRef}
    >
      <div
        aria-hidden="true"
        className="absolute top-16 left-8 md:left-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono"
      >
        11
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-5xl 2xl:max-w-6xl">
        <motion.div
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              11 &mdash; Roadmap
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white mb-4 tracking-wide md:tracking-wider uppercase">
            The Path of <span className="text-[#D4AF37]/80">Awakening</span>
          </h2>
          <p className="text-[11px] md:text-xs uppercase tracking-[0.4em] text-white/40 font-mono">
            {CHURCH_ROADMAP_META.tagline}
          </p>
        </motion.div>

        <motion.div
          animate={isInView ? { opacity: 1 } : {}}
          className="p-4 md:p-5 bg-[#050505] border border-white/[0.04] mb-10"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <code className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
              Founders &middot;{' '}
              <span className="text-[#D4AF37]/70">{FOUNDERS_CURRENT}</span> /{' '}
              {FOUNDERS_TOTAL}
            </code>
            <code className="text-[10px] text-emerald-400/55 font-mono uppercase tracking-wider">
              Sold out
            </code>
          </div>

          <div className="relative h-2 bg-white/[0.04] w-full">
            <motion.div
              animate={isInView ? { width: `${foundersPercent}%` } : {}}
              className="absolute inset-y-0 left-0 bg-[#D4AF37]/35"
              initial={{ width: '0%' }}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
            />
            {[50, 100, 150, 200].map(milestone => (
              <div
                className="absolute top-0 bottom-0 w-px bg-white/10"
                key={milestone}
                style={{ left: `${(milestone / FOUNDERS_TOTAL) * 100}%` }}
              />
            ))}
          </div>

          <div className="flex justify-between mt-2">
            {[0, 50, 100, 150, 200].map(milestone => (
              <span
                className="text-[8px] text-white/20 font-mono"
                key={milestone}
              >
                {milestone}
              </span>
            ))}
          </div>

          <p className="mt-4 text-[10px] md:text-[11px] text-white/35 font-mono uppercase tracking-[0.25em]">
            {CHURCH_ROADMAP_META.foundersInscribedNote}
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-[#D4AF37]/15 via-white/[0.04] to-[#D4AF37]/20" />

          <div className="space-y-3">
            {CHURCH_ROADMAP_NODES.map((node, index) => {
              const sharesDateWithPrevious =
                index > 0 &&
                CHURCH_ROADMAP_NODES[index - 1]?.dateCompact === node.dateCompact
              return (
                <div key={`${node.title}-${index}`}>
                  {index === horizonIIIndex && (
                    <div className="relative pl-12 my-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-grow bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent" />
                        <span className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#D4AF37]/50">
                          {CHURCH_ROADMAP_META.horizonTwoLabel}
                        </span>
                        <div className="h-px flex-grow bg-gradient-to-l from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent" />
                      </div>
                    </div>
                  )}
                  <NodeCard
                    index={index}
                    node={node}
                    sharesDateWithPrevious={
                      sharesDateWithPrevious && index !== horizonIIIndex
                    }
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-center mt-12">
          <ModalTrigger
            label="Read Full Roadmap"
            onClick={() => setModalOpen(true)}
          />
        </div>
      </div>

      <ChurchModal
        icon={'◎'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        subtitle="The Path of Awakening"
        title="Roadmap"
      >
        <div className="text-center mb-6">
          <p className="mf-body text-center">{CHURCH_ROADMAP_META.tagline}</p>
        </div>

        <div className="mb-8 p-4 border border-white/[0.04] bg-[#050505]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">
            <span className="text-[#D4AF37]">Founders</span> &middot;{' '}
            <span className="text-white/70">{FOUNDERS_CURRENT}</span>
            <span className="text-white/30">/{FOUNDERS_TOTAL}</span>
            <span className="text-emerald-400/60 ml-2 text-[9px]">
              SOLD OUT
            </span>
          </p>
          <div className="h-1 bg-white/[0.06] relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[#D4AF37]/40"
              style={{ width: `${foundersPercent}%` }}
            />
          </div>
          <p className="mt-3 text-[10px] text-white/35 uppercase tracking-[0.25em] font-mono">
            {CHURCH_ROADMAP_META.foundersInscribedNote}
          </p>
        </div>

        <div className="space-y-4">
          {CHURCH_ROADMAP_NODES.map((node, index) => {
            const isHorizon =
              node.kind === 'horizon-day' || node.kind === 'horizon-convergence'
            const showHorizonBreak = node.kind === 'horizon-convergence'
            const sharesDateWithPrevious =
              index > 0 &&
              CHURCH_ROADMAP_NODES[index - 1]?.dateCompact === node.dateCompact &&
              !showHorizonBreak

            return (
              <div
                className={sharesDateWithPrevious ? '-mt-2' : ''}
                key={`modal-${node.title}-${index}`}
              >
                {sharesDateWithPrevious && (
                  <div
                    aria-hidden="true"
                    className="mx-auto h-3 w-px bg-[#D4AF37]/50"
                  />
                )}
                {showHorizonBreak && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="h-px flex-grow bg-gradient-to-r from-[#D4AF37]/20 to-transparent" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#D4AF37]/50">
                      {CHURCH_ROADMAP_META.horizonTwoLabel}
                    </span>
                    <div className="h-px flex-grow bg-gradient-to-l from-[#D4AF37]/20 to-transparent" />
                  </div>
                )}
                <div
                  className={
                    isHorizon
                      ? 'p-5 border border-[#D4AF37]/20 bg-[#D4AF37]/[0.02]'
                      : node.kind === 'present'
                        ? 'p-4 border border-[#5bc8f5]/20 bg-[#050505]'
                        : 'p-4 border border-white/[0.06] bg-[#050505]'
                  }
                >
                  <p
                    className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${
                      isHorizon
                        ? 'text-[#D4AF37]/60'
                        : node.kind === 'present'
                          ? 'text-[#5bc8f5]/60'
                          : 'text-[#D4AF37]/50'
                    }`}
                  >
                    {node.date}
                  </p>
                  <p
                    className={
                      isHorizon ? 'mf-principle text-center' : 'mf-highlight'
                    }
                  >
                    {node.title}
                  </p>
                  <p className={`mf-body ${isHorizon ? 'text-center' : ''}`}>
                    <span className="italic text-[#5bc8f5]/70">
                      {node.subtitle}
                    </span>{' '}
                    {node.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ChurchModal>
    </section>
  )
}
