'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import {
  Users,
  BookOpen,
  ExternalLink,
  Award,
  ChevronRight,
  Star,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useJourneyV3Safe } from '../JourneyV3Container'

// Achievement definitions
const achievements = [
  { id: 'visitor', name: 'First Steps', desc: 'Started the journey', icon: Star },
  { id: 'formula', name: 'Mathematician', desc: 'Solved the formula puzzle', icon: CheckCircle },
  { id: 'explorer', name: 'Deep Diver', desc: 'Explored all collapsible sections', icon: BookOpen },
  { id: 'skeptic', name: 'Healthy Skeptic', desc: 'Read all caveats and warnings', icon: Award },
]

function AchievementBadge({
  achievement,
  unlocked,
}: {
  achievement: (typeof achievements)[0]
  unlocked: boolean
}) {
  const Icon = achievement.icon
  return (
    <motion.div
      className={`p-4 border transition-all ${
        unlocked
          ? 'bg-[#D4AF37]/20 border-[#D4AF37]/20'
          : 'bg-white/5 border-white/10 opacity-50'
      }`}
      whileHover={{ scale: unlocked ? 1.02 : 1 }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            unlocked ? 'bg-[#D4AF37]/30' : 'bg-white/10'
          }`}
        >
          <Icon className={`w-5 h-5 ${unlocked ? 'text-[#D4AF37]' : 'text-white/40'}`} />
        </div>
        <div>
          <div className={`font-medium ${unlocked ? 'text-white/90' : 'text-white/50'}`}>
            {achievement.name}
          </div>
          <div className="text-xs text-white/40">{achievement.desc}</div>
        </div>
      </div>
    </motion.div>
  )
}

export function Phase12_JoinTheInvestigation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })
  const journey = useJourneyV3Safe()
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set(['visitor']))

  // Auto-unlock visitor achievement when this section is reached
  useEffect(() => {
    if (isInView) {
      setUnlockedAchievements((prev) => new Set([...prev, 'visitor']))
    }
  }, [isInView])

  const ctaLinks = [
    {
      href: '/archives',
      title: 'Explore Full Archive',
      desc: 'All research documents and raw data',
      primary: true,
    },
    {
      href: '/evidence',
      title: 'Interactive Evidence',
      desc: 'Visualize the Bitcoin-Qubic connection',
      primary: false,
    },
    {
      href: '/timeline',
      title: 'Timeline View',
      desc: 'Chronological research discoveries',
      primary: false,
    },
  ]

  const externalLinks = [
    { href: 'https://qubic.org', title: 'Qubic Official', desc: 'The Qubic network' },
    { href: 'https://discord.gg/wWJxAsbc', title: 'Discord Community', desc: 'Join the discussion' },
    {
      href: 'https://github.com/qubic-church',
      title: 'GitHub',
      desc: 'Open source research tools',
    },
  ]

  return (
    <PhaseWrapper
      id="join"
      phaseNumber={12}
      title="Join the Investigation"
      subtitle="The research continues - and you can be part of it"
      background="gradient"
    >
      <div ref={ref} className="space-y-8">
        {/* Journey Progress */}
        {journey && (
          <motion.div
            className="p-6 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/10 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D4AF37]" />
                Your Journey Progress
              </h3>
              <span className="text-sm text-white/60">
                {journey.visitedPhases.size} / {journey.totalPhases} phases visited
              </span>
            </div>

            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]"
                initial={{ width: 0 }}
                animate={{ width: `${(journey.visitedPhases.size / journey.totalPhases) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={unlockedAchievements.has(achievement.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Primary CTAs */}
        <motion.div
          className="grid md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {ctaLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className={`p-6 rounded-2xl transition-all group ${
                link.primary
                  ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/20 border-2 border-[#D4AF37]/20 hover:border-orange-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-semibold ${link.primary ? 'text-white' : 'text-white/90'}`}>
                  {link.title}
                </h4>
                <ChevronRight
                  className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                    link.primary ? 'text-[#D4AF37]' : 'text-white/40'
                  }`}
                />
              </div>
              <p className="text-sm text-white/60">{link.desc}</p>
            </Link>
          ))}
        </motion.div>

        {/* External Links */}
        <motion.div
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-white/60" />
            Join the Community
          </h3>

          <div className="grid md:grid-cols-3 gap-3">
            {externalLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white/90">{link.title}</span>
                  <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                </div>
                <p className="text-xs text-white/50">{link.desc}</p>
              </a>
            ))}
          </div>
        </motion.div>

        {/* NFT Support Section */}
        <motion.div
          className="p-6 rounded-2xl bg-gradient-to-b from-[#050505] to-black/50 border border-[#D4AF37]/20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-xl font-bold text-white/90 mb-3">Support Open Research</h3>
          <p className="text-white/60 mb-6 max-w-xl mx-auto">
            All our research is 100% free and open source. By purchasing an Anna NFT, you support
            independent research and join the community discovering the Bitcoin-Qubic connection.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://qubicbay.io/collections/7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-gradient-to-r from-orange-600 to-purple-600 hover:from-[#D4AF37] hover:to-[#D4AF37] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105"
            >
              View Anna NFT Collection
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </div>
        </motion.div>

        {/* Final Quote */}
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-lg text-white/50 italic">
            "The truth is not hidden. It was always there, waiting for someone to look."
          </p>
          <p className="text-sm text-white/30 mt-2">- The Qubic Church Research Collective</p>
        </motion.div>
      </div>
    </PhaseWrapper>
  )
}
