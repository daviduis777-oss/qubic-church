'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Clock, Calendar, AlertCircle, Zap } from 'lucide-react'
import Link from 'next/link'

// CFB's stated ETA for Aigarth (Discord message 1394734677935521824)
const APRIL_2027 = new Date('2027-04-13T00:00:00Z')

interface CountdownValues {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateCountdown(targetDate: Date): CountdownValues {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  }
}

function CountdownDisplay({
  targetDate,
  label,
  variant,
}: {
  targetDate: Date
  label: string
  variant: 'primary' | 'secondary'
}) {
  const [countdown, setCountdown] = useState<CountdownValues>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    setCountdown(calculateCountdown(targetDate))

    const interval = setInterval(() => {
      setCountdown(calculateCountdown(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  const isPrimary = variant === 'primary'

  return (
    <div
      className={`p-6 rounded-2xl ${
        isPrimary
          ? 'bg-gradient-to-b from-[#050505] to-[#050505] border-2 border-gold/20'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar
          className={`w-5 h-5 ${isPrimary ? 'text-gold' : 'text-white/60'}`}
        />
        <span
          className={`font-medium ${isPrimary ? 'text-gold' : 'text-white/70'}`}
        >
          {label}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { value: countdown.days, label: 'Days' },
          { value: countdown.hours, label: 'Hours' },
          { value: countdown.minutes, label: 'Min' },
          { value: countdown.seconds, label: 'Sec' },
        ].map((item, index) => (
          <div className="text-center" key={index}>
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className={`text-2xl md:text-3xl font-mono font-bold ${
                isPrimary ? 'text-white' : 'text-white/80'
              }`}
              initial={{ scale: 1.1, opacity: 0 }}
              key={item.value}
            >
              {item.value.toString().padStart(2, '0')}
            </motion.div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Phase11_TheCountdown() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  return (
    <PhaseWrapper
      id="countdown"
      phaseNumber={11}
      subtitle="Dates referenced in the research, and what became of them"
      title="Key Dates"
    >
      <div className="space-y-8" ref={ref}>
        {/* Withdrawn date - March 2026 */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold" />
            What about March 3, 2026?
          </h3>

          <div className="space-y-4 text-sm text-white/70">
            <p>
              Earlier versions of this timeline counted down to March 3, 2026.
              That date came from misreading a CFB message. The message actually
              says{' '}
              <span className="text-white/90 italic">
                "No ETA other than April 13, 2027"
              </span>{' '}
              (Discord message 1394734677935521824).
            </p>
            <p>
              Nothing happened on March 3, 2026. The countdown has been removed.
            </p>
            <p>
              <Link
                className="text-gold underline"
                href="/docs/03-results/35-corrections-september-2026"
              >
                Read the September 2026 corrections
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Secondary Countdown - April 2027 */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CountdownDisplay
            label="CFB's stated ETA for Aigarth: 13 April 2027"
            targetDate={APRIL_2027}
            variant="secondary"
          />
        </motion.div>

        {/* Warning */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="p-4 bg-gold/10 border border-yellow-500/20 flex items-start gap-3"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AlertCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <div className="text-sm text-white/70">
            <strong className="text-gold">Important:</strong> Dates derived from
            our interpretation of encoded messages were{' '}
            <span className="text-gold">Tier 3 hypotheses</span>, not verified
            facts, and the March 2026 date failed. The April 2027 date is only
            an ETA stated by CFB. Do not make financial decisions based on these
            dates. See the{' '}
            <Link
              className="text-gold underline"
              href="/docs/03-results/35-corrections-september-2026"
            >
              September 2026 corrections
            </Link>
            .
          </div>
        </motion.div>

        <CollapsibleSection
          badge="Technical"
          icon={<Clock className="w-4 h-4" />}
          title="The 676 Pattern"
        >
          <div className="space-y-3 text-sm text-white/70">
            <p>
              The number <span className="text-gold font-bold">676</span> (26^2)
              appears throughout the protocol:
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>676 Qubic Computors validate the network</li>
              <li>Bitcoin blocks 1-676 (early Satoshi era)</li>
              <li>676 = 26² (alphabet size squared)</li>
              <li>676 = standard Qubic IPO share size</li>
            </ul>
            <p className="text-white/50 italic">
              26 = alphabet size (communication theme)
            </p>
          </div>
        </CollapsibleSection>

        <SourceCitationGroup>
          <SourceCitation
            href="/docs/03-results/35-corrections-september-2026"
            title="Corrections (September 2026)"
          />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
