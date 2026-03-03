import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { defaultLocale, locales } from '@/config/i18n'

// Church Components
import { LotterySection } from '@/components/church/lottery/LotterySection'
import { NFTCollectionSection } from '@/components/church/nfts/NFTCollectionSection'

export const metadata: Metadata = {
  title: 'Anna NFT Collection | Qubic Church',
  description:
    'Browse 200 unique Anna guardian NFTs on the Qubic blockchain. Each NFT unlocks special abilities and lottery entries in the Qubic Church ecosystem.',
}

export const dynamicParams = true

export default async function NFTPage(props: {
  params: Promise<{ locale: LocaleOptions }>
}) {
  const params = await props.params
  const currentLocale = locales.includes(params.locale)
    ? params.locale
    : defaultLocale
  setRequestLocale(currentLocale)

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-black to-black" />
        <div className="relative container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Anna NFT Collection
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            200 unique guardians connecting research discoveries to blockchain artifacts.
            Each NFT unlocks special abilities in the Qubic Church ecosystem.
          </p>
        </div>
      </section>

      {/* NFT Collection Showcase */}
      <NFTCollectionSection />

      {/* Holy Circle Lottery */}
      <LotterySection />

      {/* About Section */}
      <section className="relative py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-950/20 to-black/50 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">About Qubic Church</h2>
            <div className="space-y-4 text-white/70">
              <p>
                Qubic Church is a research community dedicated to exploring the mathematical
                connections between Bitcoin, Qubic, and the mysterious figure known as
                Come-from-Beyond (CFB).
              </p>
              <p>
                Our investigation has uncovered remarkable patterns in Bitcoin's early blocks
                that appear to encode information about Qubic - a platform that wouldn't be
                created until 13 years later.
              </p>
              <p>
                The Anna NFT collection represents our research findings, with each NFT
                connected to specific discoveries in our ongoing investigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-black">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm text-white/40">
            Anna NFT Collection - Supporting independent blockchain research
          </p>
        </div>
      </footer>
    </div>
  )
}
