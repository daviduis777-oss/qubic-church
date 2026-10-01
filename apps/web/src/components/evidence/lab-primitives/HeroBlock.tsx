'use client'

import { TypedText } from './TypedText'
import { CountUp } from './CountUp'
import { FadeSection } from './FadeSection'

export interface HeroStat {
  label: string
  value: string
  sub?: string
  /** If provided, the value is animated via CountUp toward this target. */
  countUpTarget?: number
  /** Override formatter for the count-up animation. */
  countUpFormatter?: (n: number) => string
}

export interface HeroBlockProps {
  eyebrow: string
  headline: string
  tagline: string
  stats: HeroStat[]
  /** Optional accent color override; defaults to gold */
  accent?: string
}

export function HeroBlock({
  eyebrow,
  headline,
  tagline,
  stats,
  accent = '#D4AF37',
}: HeroBlockProps) {
  return (
    <FadeSection>
      <div className="relative border border-border overflow-hidden">
        <div className="p-5 sm:p-8 lg:p-10 bg-gradient-to-br from-gold/[0.05] to-transparent">
          <div
            className="text-xs uppercase tracking-widest font-mono mb-2"
            style={{ color: `${accent}80` }}
          >
            {eyebrow}
          </div>
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight max-w-3xl">
            <TypedText delay={500} text={headline} />
          </h2>
          <p className="text-white/55 text-xs sm:text-sm mt-3 max-w-3xl leading-relaxed">
            {tagline}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-border">
          {stats.map(s => (
            <div
              className="p-4 sm:p-5 lg:p-6 text-center border-r border-border last:border-0 border-b lg:border-b-0 border-border"
              key={s.label}
            >
              <div
                className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono"
                style={{ color: accent }}
              >
                {s.countUpTarget !== undefined ? (
                  <CountUp
                    formatNumber={s.countUpFormatter}
                    target={s.countUpTarget}
                  />
                ) : (
                  s.value
                )}
              </div>
              <div className="text-xs sm:text-xs text-white/55 uppercase tracking-wider mt-1.5">
                {s.label}
              </div>
              {s.sub && (
                <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </FadeSection>
  )
}
