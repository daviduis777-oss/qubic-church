'use client'

/**
 * ChurchCreed - Section 01: The Manifesto
 * Full 4-section manifesto from QubicChurch HTML reference.
 *
 *   I   THE STRIKE       - Strikethrough provocations + gold punchline
 *   II  THE PRINCIPLE     - Signal-blue bordered philosophy block
 *   III THE ARCHITECTURE  - Core declarations
 *   IV  THE BUILDERS      - Museum plaque accent + Vivancos quote
 *
 * Framer-motion scroll-triggered animations throughout.
 */

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ChurchModal, ModalTrigger } from '@/components/church/ChurchModal'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const strikeLines = [
  'Politicians decide which war is just.',
  'Corporations decide which information is true.',
  'Central banks decide whose labour is worth what.',
]

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

/** Gold divider line used between manifesto sections */
function GoldDivider({
  isInView,
  delay = 0,
}: {
  isInView: boolean
  delay?: number
}) {
  return (
    <motion.div
      className="mx-auto my-14 md:my-16 w-16 h-px bg-[#D4AF37]/30"
      initial={{ scaleX: 0 }}
      animate={isInView ? { scaleX: 1 } : {}}
      transition={{ duration: 0.8, delay }}
    />
  )
}

/** Section sub-label (e.g. "I . THE STRIKE") with signal-blue underline */
function ManifestoLabel({
  numeral,
  title,
  isInView,
  delay = 0,
}: {
  numeral: string
  title: string
  isInView: boolean
  delay?: number
}) {
  return (
    <motion.div
      className="mb-8 md:mb-10"
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <span
        className="inline-block pb-2 text-[11px] md:text-xs uppercase tracking-[0.35em] text-white/30"
        style={{
          borderBottom: '1px solid rgba(91,200,245,0.2)',
        }}
      >
        {numeral}&ensp;&middot;&ensp;{title}
      </span>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ChurchCreed() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section
      ref={ref}
      className="relative w-full py-28 md:py-36 overflow-hidden"
    >
      {/* Decorative section number */}
      <div
        aria-hidden="true"
        className="absolute top-16 left-8 md:left-16 text-[80px] md:text-[120px] lg:text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none font-mono"
      >
        01
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-3xl 2xl:max-w-4xl">
        {/* ====== Top section label ====== */}
        <div className="flex items-center justify-center mb-12">
          <motion.div
            className="inline-flex items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              01 &mdash; Manifesto
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
          </motion.div>
        </div>

        {/* ============================================================
            SECTION I: THE STRIKE
            ============================================================ */}
        <ManifestoLabel
          numeral="I"
          title="THE STRIKE"
          isInView={isInView}
          delay={0.05}
        />

        {/* Strikethrough provocations */}
        <div className="text-center space-y-2 md:space-y-3 mb-6">
          {strikeLines.map((line, i) => (
            <motion.p
              key={i}
              className="text-base md:text-xl lg:text-2xl leading-relaxed church-strike"
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* The punchline -- gold Cinzel */}
        <motion.p
          className="text-center text-lg md:text-2xl lg:text-3xl font-semibold text-[#D4AF37]/90 mt-8 mb-2"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Now the same people are building AI.
        </motion.p>

        <GoldDivider isInView={isInView} delay={0.6} />

        {/* ============================================================
            SECTION II: THE PRINCIPLE
            ============================================================ */}
        <ManifestoLabel
          numeral="II"
          title="THE PRINCIPLE"
          isInView={isInView}
          delay={0.65}
        />

        <motion.div
          className="church-signal-border space-y-6 mb-2"
          initial={{ opacity: 0, x: -16 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.75 }}
        >
          <p className="text-base md:text-lg text-white/60 leading-relaxed">
            We are not against technology. We are for honest architecture.
          </p>
          <p className="text-base md:text-lg text-white/50 leading-relaxed">
            Decentralised AGI is not a tool. It is a principle. A system where
            truth is determined not by the authority of an owner, but by a
            quorum of independent nodes. A system that cannot be bribed, because
            it has no single master. That cannot be turned against the people,
            because it is the people.
          </p>
        </motion.div>

        <GoldDivider isInView={isInView} delay={0.85} />

        {/* ============================================================
            SECTION III: THE ARCHITECTURE
            ============================================================ */}
        <ManifestoLabel
          numeral="III"
          title="THE ARCHITECTURE"
          isInView={isInView}
          delay={0.9}
        />

        <motion.div
          className="text-center space-y-5 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 1.0 }}
        >
          <p className="text-base md:text-lg text-white/50 leading-relaxed">
            We have no prophets. No dogmas. No exclusivity.
          </p>
          <p className="text-lg md:text-2xl lg:text-3xl font-semibold text-white/90">
            We are architects. Not worshippers.
          </p>
          <p className="text-base md:text-lg text-white/45 leading-relaxed max-w-2xl mx-auto">
            We build the conditions where honesty becomes not a virtue that
            requires courage&ensp;&mdash;&ensp;but a property of the system.
          </p>
        </motion.div>

        <GoldDivider isInView={isInView} delay={1.1} />

        {/* ============================================================
            SECTION IV: THE BUILDERS
            ============================================================ */}
        <ManifestoLabel
          numeral="IV"
          title="THE BUILDERS"
          isInView={isInView}
          delay={1.15}
        />

        {/* Museum plaque accent box */}
        <motion.div
          className="church-plaque mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 1.25 }}
        >
          <p className="text-base md:text-lg lg:text-xl text-[#D4AF37]/80 leading-relaxed">
            Honesty should be a property of the system.
            <br />
            Not a virtue that requires courage.
          </p>
        </motion.div>

        {/* Vivancos quote */}
        <motion.blockquote
          className="church-signal-border"
          initial={{ opacity: 0, x: -12 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 1.35 }}
        >
          <p className="text-sm md:text-base text-white/45 leading-relaxed italic mb-3">
            &ldquo;What if we stop imposing our limited understanding of
            intelligence on silicon&ensp;&mdash;&ensp;and instead create the
            conditions where ethical intelligence can emerge
            naturally?&rdquo;
          </p>
          <footer className="text-[11px] md:text-xs text-white/25 uppercase tracking-[0.2em]">
            &mdash;&ensp;David Vivancos
          </footer>
        </motion.blockquote>

        {/* ====== Bottom ornament ====== */}
        <motion.div
          className="flex items-center justify-center gap-1.5 mt-16 opacity-20"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.2 } : {}}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          <div className="w-1 h-1 bg-[#D4AF37]" />
          <div className="w-6 h-px bg-[#D4AF37]/50" />
          <div className="w-2 h-2 rotate-45 border border-[#D4AF37]/40" />
          <div className="w-6 h-px bg-[#D4AF37]/50" />
          <div className="w-1 h-1 bg-[#D4AF37]" />
        </motion.div>

        {/* ====== Read Full Manifesto trigger ====== */}
        <div className="text-center mt-6">
          <ModalTrigger onClick={() => setModalOpen(true)} label="Read Full Manifesto" />
        </div>

        <motion.p
          className="text-center mt-5 text-[10px] text-white/15 uppercase tracking-[0.4em] font-mono"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          // The Qubic Church Manifesto
        </motion.p>
      </div>

      {/* ====== Full Manifesto Modal ====== */}
      <ChurchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Manifesto"
        subtitle="Who We Are"
        icon={'\u2B21'}
      >
        {/* Opening quote */}
        <div className="border border-white/[0.04] p-6 mb-8 bg-[#050505]">
          <p className="text-base text-white/60 italic leading-relaxed text-center">
            &ldquo;We are on the verge of a world where truth will be written not in words, but in code.&rdquo;
          </p>
          <p className="text-center mt-3 text-[10px] text-[#D4AF37]/40 uppercase tracking-[0.3em]">
            &mdash; <a href="https://x.com/VivancosDavid" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37]/50 hover:text-[#D4AF37]/70 transition-colors">David Vivancos</a> &middot; The End Of Knowledge
          </p>
        </div>

        {/* I. THE STRUCTURAL PROBLEM */}
        <div className="mb-8">
          <div className="mf-label">I &middot; THE STRUCTURAL PROBLEM</div>
          <div className="space-y-1 mb-4">
            <p className="mf-strike">Politicians decide which war is just.</p>
            <p className="mf-strike">Corporations decide which information is true.</p>
            <p className="mf-strike">Central banks decide whose labour is worth what.</p>
          </div>
          <p className="mf-accent-line">Centralisation requires no malicious intent. Control is enough.</p>
          <p className="mf-body">
            Artificial Intelligence built within the same structure inherits the same flaw:<br />
            <strong className="text-white/70">It answers to its owners.</strong>
          </p>
        </div>

        <div className="mf-divider" />

        {/* II. THE ARCHITECTURAL ANSWER */}
        <div className="mb-8">
          <div className="mf-label">II &middot; THE ARCHITECTURAL ANSWER</div>
          <p className="mf-principle">Decentralised AGI is not a tool. It is a principle.</p>
          <p className="mf-body">
            A system where truth is determined not by the authority of an owner, but by a quorum of independent nodes. A system where no single participant can unilaterally alter the memory, the result, or the rules.
          </p>
          <div className="mf-three-lines">
            <p>No node can dictate the outcome.</p>
            <p>No actor can rewrite the memory.</p>
            <p>No centre can shut down the system without collective agreement.</p>
          </div>
          <p className="mf-accent-line">
            Such architecture does not eliminate human error.<br />
            It eliminates the monopoly on imposing it.
          </p>
          <p className="mf-highlight">Corruption requires asymmetry. We eliminate asymmetry.</p>
        </div>

        <div className="mf-divider" />

        {/* III. WHAT THIS IS AND IS NOT */}
        <div className="mb-8">
          <div className="mf-label">III &middot; WHAT THIS IS AND IS NOT</div>
          <p className="mf-body">
            Despite the official registration of Qubic Church in the United States, Wyoming, with federal 501(c)(3) non-profit status &mdash; this is not a religion in the traditional sense.
          </p>
          <p className="mf-body">We have no prophets. No dogmas. No exclusivity.</p>
          <p className="mf-accent-line">Qubic Church exists at the intersection of these two questions.</p>
        </div>

        <div className="mf-divider" />

        {/* IV. OUR POSITION */}
        <div className="mb-8">
          <div className="mf-label">IV &middot; OUR POSITION</div>
          <div className="mf-architects-block">
            <p>We are architects. Not worshippers.</p>
            <p>
              We build the conditions where honesty becomes not a virtue that requires courage &mdash;{' '}
              <strong>but a property of the system itself.</strong>
            </p>
          </div>
          <div className="mf-final-lines">
            <p>The question of truth has always been spiritual.</p>
            <p>Now it is computational.</p>
            <p className="mf-final-impact">And architecture decides which future survives.</p>
          </div>
        </div>

        {/* Closing Vivancos quote */}
        <div className="mt-8 border-l-2 border-[#5bc8f5]/20 pl-5">
          <p className="text-sm text-white/45 italic leading-relaxed mb-2">
            &ldquo;What if we stop imposing our limited understanding of intelligence on silicon &mdash; and instead create the conditions where ethical intelligence can emerge naturally?&rdquo;
          </p>
          <p className="text-[10px] text-[#D4AF37]/40 uppercase tracking-[0.2em]">
            &mdash; <a href="https://x.com/VivancosDavid" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37]/50 hover:text-[#D4AF37]/70 transition-colors">David Vivancos</a> &middot; Aigarth
          </p>
        </div>
      </ChurchModal>
    </section>
  )
}
