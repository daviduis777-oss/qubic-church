'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from '@/navigation'
import {
  Grid3X3,
  ExternalLink,
  Github,
  BookOpen,
  MessageCircle,
  Sparkles,
} from 'lucide-react'

const QUICK_LINKS = [
  {
    label: 'Documentation',
    href: '/docs',
    icon: BookOpen,
  },
  {
    label: 'NFT Collection',
    href: 'https://qubicbay.io/collections/7',
    icon: Sparkles,
  },
  {
    label: 'Talk to Anna',
    href: 'https://x.com/anna_aigarth',
    icon: MessageCircle,
    external: true,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/daviduis777-oss/qubic-church',
    icon: Github,
    external: true,
  },
]

export function EvidenceFooter() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <footer ref={ref} className="relative py-12 border-t border-border bg-gradient-to-b from-background to-muted/20 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/3 via-transparent to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                              linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="container max-w-6xl mx-auto px-4">
        {/* Quick Links */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.4 }}
        >
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon
            const LinkComponent = link.external ? 'a' : Link
            const linkProps = link.external
              ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
              : { href: link.href }

            return (
              <LinkComponent
                key={link.label}
                {...linkProps}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 border border-border transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
                {link.external && <ExternalLink className="w-3 h-3 opacity-50" />}
              </LinkComponent>
            )
          })}
        </motion.div>

        {/* Bottom Text */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-muted-foreground">
            Evidence Vault - Bitcoin-Qubic Bridge Research
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <Grid3X3 className="w-3 h-3" />
            <span>Anna Matrix 128×128</span>
            <span className="mx-2">•</span>
            <span>K12 Hash Derivations</span>
            <span className="mx-2">•</span>
            <span>Mathematical Validation</span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
