import { ArrowRight, ExternalLink } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { FaqList } from '@/components/ui/faq'
import { PageHeader, SectionHeading } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'

// =============================================================================
// DATA
// =============================================================================

const exchanges = [
  {
    name: 'SafeTrade',
    url: 'https://safe.trade/trading/qubiceth',
    type: 'CEX',
    pairs: ['QUBIC/ETH', 'QUBIC/BTC'],
    description: 'Primary exchange for QUBIC trading',
  },
  {
    name: 'Bitget',
    url: 'https://www.bitget.com/spot/QUBICUSDT',
    type: 'CEX',
    pairs: ['QUBIC/USDT'],
    description: 'Large exchange with high liquidity',
  },
  {
    name: 'Gate.io',
    url: 'https://www.gate.io/trade/QUBIC_USDT',
    type: 'CEX',
    pairs: ['QUBIC/USDT'],
    description: 'Popular exchange with global reach',
  },
  {
    name: 'MEXC',
    url: 'https://www.mexc.com/exchange/QUBIC_USDT',
    type: 'CEX',
    pairs: ['QUBIC/USDT'],
    description: 'High volume, low fees',
  },
]

const steps = [
  {
    step: 1,
    title: 'Get a Wallet',
    description:
      'Download the official Qubic Wallet to store your QUBIC safely.',
    action: { label: 'Download Wallet', url: 'https://wallet.qubic.org' },
    details: [
      'Available as web wallet (wallet.qubic.org)',
      'Your private key = your QUBIC. Back it up!',
      'Copy your wallet address (60 characters, all uppercase)',
    ],
  },
  {
    step: 2,
    title: 'Buy QUBIC',
    description:
      'Purchase QUBIC on any supported exchange and withdraw to your wallet.',
    action: { label: 'See Exchanges', url: '#exchanges' },
    details: [
      'Register on an exchange (Bitget, Gate.io, MEXC, SafeTrade)',
      'Deposit USDT, ETH, or BTC',
      'Buy QUBIC and withdraw to your wallet address',
    ],
  },
  {
    step: 3,
    title: 'Get an Anna NFT',
    description:
      'Buy an Anna NFT on QubicBay to join the community and support independent research.',
    action: { label: 'Browse NFTs', url: 'https://qubicbay.io/collections/7' },
    details: [
      'Visit QubicBay.com and connect your wallet',
      'Browse the Anna Aigarth collection (200 NFTs)',
      'Purchase = community membership + research access',
    ],
  },
]

const faqs = [
  {
    q: 'What is Qubic?',
    a: 'Qubic is a Layer 1 blockchain powered by Useful Proof of Work (UPoW). Instead of wasting energy on meaningless calculations, Qubic miners train AI models. It features the first ternary neural network architecture and aims to build Aigarth, an artificial general intelligence.',
  },
  {
    q: 'What makes Qubic different from other blockchains?',
    a: 'Qubic uses Useful Proof of Work where mining power trains AI neural networks. It has no transaction fees, instant finality, and runs on ternary logic (0, 1, -1) instead of binary. The network processes over 40M transfers per second.',
  },
  {
    q: 'What are Anna NFTs?',
    a: 'Anna NFTs are a collection of 200 unique digital artworks on the Qubic blockchain, each tied to the research of the 128x128 neural matrix called Anna. Holding an NFT grants community access and tiered research benefits.',
  },
  {
    q: 'Is Qubic safe?',
    a: 'Qubic is a public, decentralized blockchain. Your funds are secured by your private key. Always back up your seed phrase and never share it. The official wallet at wallet.qubic.org is the recommended way to store QUBIC.',
  },
  {
    q: 'How much QUBIC do I need for an NFT?',
    a: 'NFT prices vary on QubicBay marketplace. Check the current floor price at qubicbay.io/collections/7.',
  },
]

// =============================================================================
// PAGE
// =============================================================================

const SECTION = 'mx-auto w-full max-w-5xl px-4 sm:px-6 py-16 md:py-24'

export default function GetQubicPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow="Getting started"
        lede="Your guide to buying QUBIC, setting up a wallet, and joining the Qubic Church community. From zero to NFT holder in 10 minutes."
        title="Get Qubic"
      />

      {/* Steps */}
      <section className={SECTION}>
        <SectionHeading label="Steps" title="Three steps to begin" />
        <ol className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
          {steps.map(step => {
            const external = step.action.url.startsWith('http')
            return (
              <li className="flex gap-5 py-8" key={step.step}>
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center border border-gold/40 font-mono text-sm text-gold tabular-nums"
                >
                  {step.step}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 leading-relaxed text-fg-2">
                    {step.description}
                  </p>
                  <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-border">
                    {step.details.map(detail => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  <a
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'mt-5 gap-2'
                    )}
                    href={step.action.url}
                    rel={external ? 'noopener noreferrer' : undefined}
                    target={external ? '_blank' : undefined}
                  >
                    {step.action.label}
                    {external ? (
                      <ExternalLink aria-hidden="true" className="size-3.5" />
                    ) : (
                      <ArrowRight aria-hidden="true" className="size-3.5" />
                    )}
                  </a>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Exchanges */}
      <section className={cn(SECTION, 'scroll-mt-14')} id="exchanges">
        <SectionHeading
          label="Exchanges"
          lede="Available on multiple exchanges worldwide."
          title="Where to buy"
        />
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
          {exchanges.map(exchange => (
            <a
              className="group flex flex-col bg-card p-6 transition-colors duration-150 ease-out hover:bg-surface-2"
              href={exchange.url}
              key={exchange.name}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-gold">
                  {exchange.name}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {exchange.type}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">
                {exchange.description}
              </p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <p className="font-mono text-sm text-muted-foreground">
                  {exchange.pairs.join(' · ')}
                </p>
                <ExternalLink
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-colors group-hover:text-gold"
                />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-16 md:py-24">
        <SectionHeading label="Knowledge" title="Frequently asked questions" />
        <FaqList items={faqs} />
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-16 text-center md:py-24">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Ready to join?
        </h2>
        <p className="mt-3 text-fg-2">
          Get your QUBIC, grab an Anna NFT, and join the research community.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            className={cn(
              buttonVariants({ variant: 'primary', size: 'lg' }),
              'gap-2'
            )}
            href="https://wallet.qubic.org"
            rel="noopener noreferrer"
            target="_blank"
          >
            Get your wallet
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
          <a
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'gap-2'
            )}
            href="https://qubicbay.io/collections/7"
            rel="noopener noreferrer"
            target="_blank"
          >
            Browse Anna NFTs
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </div>
      </section>
    </div>
  )
}
