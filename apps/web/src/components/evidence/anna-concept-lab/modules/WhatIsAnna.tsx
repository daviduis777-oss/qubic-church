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
    <div className="h-full flex flex-col gap-3 p-4 sm:p-5 bg-black/30 border border-border hover:border-gold/30 transition-colors">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-gold/15 border border-gold/30">{icon}</div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <p className="text-xs text-white/65 leading-relaxed flex-1">{body}</p>
      {href && cta && (
        <div className="text-xs text-gold/85 inline-flex items-center gap-1">
          {cta}
          {external && <ExternalLink className="w-3 h-3" />}
        </div>
      )}
    </div>
  )
  if (!href) return inner
  return external ? (
    <a
      className="block h-full"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {inner}
    </a>
  ) : (
    <Link className="block h-full" href={href}>
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
      animate={{ opacity: 1, y: 0 }}
      className={cn('border border-border bg-black/20', className)}
      initial={{ opacity: 0, y: 8 }}
    >
      <button
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
        onClick={toggleOpen}
        type="button"
      >
        <div className="flex items-center gap-2">
          <div className="text-xs text-gold/80 uppercase tracking-widest font-mono">
            Onramp
          </div>
          <div className="text-sm text-white/85">What is Anna?</div>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-white/55 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="px-4 py-4 border-t border-border">
          <p className="text-xs text-white/60 mb-4 leading-relaxed">
            &ldquo;Anna&rdquo; refers to three related but distinct things in
            this project. Conflating them confuses visitors who arrive from
            different entry points. Throughout this Lab, &ldquo;Anna&rdquo;
            means the matrix.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <LayerCard
              body="Active AI agent at @anna_aigarth on X (Twitter). Trained by CfB on Qubic miners as part of the Aigarth project. Currently answers 1+1=? style addition queries, sometimes intentionally with a wrong answer."
              cta="@anna_aigarth"
              external
              href="https://x.com/anna_aigarth"
              icon={<Bot className="w-4 h-4 text-gold" />}
              title="Anna the chatbot"
            />
            <LayerCard
              body="A 128×128 table compiled by hand from replies of the Anna bot. It follows an exact complement rule and has 8 antipodal-symmetric blocks. Trace = 137 and the K-e-y diagonal are true of the typed table but not significant. The earlier reading of it as a 19-concept classifier was withdrawn in September 2026. This Lab characterises the matrix."
              cta="Read the Phase N chapter (corrected)"
              href="/docs/03-results/31-anna-concept-classifier"
              icon={<Grid3X3 className="w-4 h-4 text-gold" />}
              title="Anna the matrix"
            />
            <LayerCard
              body="Aigarth is CfB's project around growing artificial general intelligence on Qubic. Anna sits inside that as a learning chatbot and a research artifact. The matrix is a table compiled from the bot's replies."
              cta="Read the Aigarth Research Lab"
              href="/docs/03-results/25-aigarth-research-lab"
              icon={<Network className="w-4 h-4 text-gold" />}
              title="Anna in Aigarth"
            />
          </div>
        </div>
      )}
    </motion.section>
  )
}
