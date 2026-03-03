import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { defaultLocale, locales } from '@/config/i18n'

// Journey V3 - Full 12-Phase Story
import {
  JourneyV3Container,
  Phase01_TheVoid,
  Phase02_EnterQubic,
  Phase03_TheArchitect,
  Phase04_TheChurchMission,
  Phase05_TheFirstClue,
  Phase06_TheFormula,
  Phase07_ThePatoshiPattern,
  Phase08_AnnaAwakens,
  Phase09_TheMatrix,
  Phase10_TheMathematicalBridge,
  Phase11_TheCountdown,
  Phase12_JoinTheInvestigation,
} from '@/components/journey-v3'

export const metadata: Metadata = {
  title: 'CfB Timeline | Qubic Church',
  description:
    'Follow the 12-phase investigation timeline tracing the connections between Bitcoin genesis, Come-from-Beyond, and the Qubic network.',
}

export const dynamicParams = true

export default async function TimelinePage(props: {
  params: Promise<{ locale: LocaleOptions }>
}) {
  const params = await props.params
  const currentLocale = locales.includes(params.locale)
    ? params.locale
    : defaultLocale
  setRequestLocale(currentLocale)

  return (
    <div className="min-h-screen bg-black">
      {/* THE JOURNEY V3 - 12-Phase Narrative Story */}
      <JourneyV3Container>
        {/* Act I: The Mystery */}
        <Phase01_TheVoid />
        <Phase02_EnterQubic />
        <Phase03_TheArchitect />
        <Phase04_TheChurchMission />

        {/* Act II: The Investigation */}
        <Phase05_TheFirstClue />
        <Phase06_TheFormula />
        <Phase07_ThePatoshiPattern />
        <Phase08_AnnaAwakens />
        <Phase09_TheMatrix />

        {/* Act III: The Revelation */}
        <Phase10_TheMathematicalBridge />
        <Phase11_TheCountdown />
        <Phase12_JoinTheInvestigation />
      </JourneyV3Container>

      {/* FOOTER NOTICE */}
      <footer className="relative border-t border-white/10 bg-black">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm text-white/40">
            This is the full investigation timeline. Return to{' '}
            <a href="/" className="text-[#D4AF37]/70 hover:text-[#D4AF37] underline">
              Home
            </a>{' '}
            or explore the{' '}
            <a href="/docs" className="text-[#D4AF37]/70 hover:text-[#D4AF37] underline">
              Research Archive
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
