'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ExternalLink, ChevronDown, Bot, Grid3X3, Network } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'anna-lab-v1.what-is-anna-collapsed'

interface LayerCardProps {
  icon: React.ReactNode
  title: string
  body: string
  href?: string
  external?: boolean
  cta?: string
}

function LayerCard({ icon, title, body, href, external, cta }: LayerCardProps) {
  const inner = (
    <div className="h-full flex flex-col gap-3 p-4 sm:p-5 bg-black/30 border border-white/[0.06] hover:border-[#D4AF37]/30 transition-colors">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30">{icon}</div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <p className="text-xs text-white/65 leading-relaxed flex-1">{body}</p>
      {href && cta && (
        <div className="text-[11px] text-[#D4AF37]/85 inline-flex items-center gap-1">
          {cta}
          {external && <ExternalLink className="w-3 h-3" />}
        </div>
      )}
    </div>
  )
  if (!href) return inner
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">
      {inner}
    </a>
  ) : (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  )
}

export function WhatIsAnna({ className }: { className?: string }) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY) === 'true') setOpen(false)
  }, [])

  const toggleOpen = () => {
    const next = !open
    setOpen(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next ? 'false' : 'true')
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('border border-white/[0.06] bg-black/20', className)}
    >
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-[#D4AF37]/80 uppercase tracking-[0.2em] font-mono">Onramp</div>
          <div className="text-sm text-white/85">What is Anna?</div>
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-white/55 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <p className="text-xs text-white/60 mb-4 leading-relaxed">
            &ldquo;Anna&rdquo; refers to three related but distinct things in this project. Conflating them confuses
            visitors who arrive from different entry points. Throughout this Lab, &ldquo;Anna&rdquo; means the matrix.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <LayerCard
              icon={<Bot className="w-4 h-4 text-[#D4AF37]" />}
              title="Anna the chatbot"
              body="Active AI agent at @anna_aigarth on X (Twitter). Trained by CfB on Qubic miners as part of the Aigarth project. Currently answers 1+1=? style addition queries — sometimes intentionally with a wrong answer."
              href="https://x.com/anna_aigarth"
              external
              cta="@anna_aigarth"
            />
            <LayerCard
              icon={<Grid3X3 className="w-4 h-4 text-[#D4AF37]" />}
              title="Anna the matrix"
              body="A 128×128 designed reference substrate. Has 8 antipodal-symmetric blocks, integer landmarks (trace=137, K-e-y ASCII diagonal), and runs as a 19-concept classifier under the production HyperIdentity scoring algorithm. This Lab characterises the matrix."
              href="/docs/03-results/31-anna-concept-classifier"
              cta="Read the Concept Classifier paper"
            />
            <LayerCard
              icon={<Network className="w-4 h-4 text-[#D4AF37]" />}
              title="Anna in Aigarth"
              body="Aigarth is CfB's project around growing artificial general intelligence on Qubic. Anna sits inside that — a designed reference + a learning chatbot + a research artifact. The matrix is one designed artifact within Aigarth."
              href="/docs/03-results/25-aigarth-research-lab"
              cta="Read the Aigarth Research Lab"
            />
          </div>
        </div>
      )}
    </motion.section>
  )
}
