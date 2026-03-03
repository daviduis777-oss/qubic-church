'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from '@/navigation'
import {
  Database,
  Binary,
  Coins,
  Grid3X3,
  Shield,
  ExternalLink,
  Github,
  BookOpen,
  MessageCircle,
  Sparkles,
} from 'lucide-react'

const FOOTER_STATS = [
  {
    value: 21953,
    label: 'Patoshi',
    icon: Coins,
    color: 'text-[#D4AF37]',
  },
  {
    value: 23765,
    label: 'Qubic',
    icon: Binary,
    color: 'text-[#D4AF37]',
  },
  {
    value: 1004767,
    label: 'Bitcoin',
    icon: Database,
    color: 'text-[#D4AF37]',
  },
]

const QUICK_LINKS = [
  {
    label: 'Documentation',
    href: '/docs',
    icon: BookOpen,
  },
  {
    label: 'NFT Collection',
    href: '/nft',
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
    href: 'https://github.com/qubic',
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
        {/* Main Stats */}
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        >
          {FOOTER_STATS.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className={`p-2 bg-muted/50 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-2xl font-bold font-mono ${stat.color}`}>
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.label} Addresses</div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Total Records Banner */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-mono text-lg text-primary font-bold">
              {(1050515).toLocaleString()}
            </span>
            <span className="text-primary/80">Records Verified On-Chain</span>
          </div>
        </motion.div>

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
