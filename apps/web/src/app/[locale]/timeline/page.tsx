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
    'The 12-phase story of the community investigation into Come-from-Beyond and Qubic, including the claims that were later withdrawn.',
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
      <footer className="relative border-t border-border bg-black">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            This is the full investigation timeline. Return to{' '}
            <a
              className="font-medium text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold"
              href="/"
            >
              Home
            </a>{' '}
            or explore the{' '}
            <a
              className="font-medium text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold"
              href="/docs"
            >
              Research Archive
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
