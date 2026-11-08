import { ArrowRight, ExternalLink } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { FaqList } from '@/components/ui/faq'
import { PageHeader, SectionHeading } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'

// =============================================================================
// DATA
// =============================================================================

// QUBIC markets as counted on 4 October 2026 (Cointribune, "How to buy Qubic in 2026"). A list, not a
// recommendation: availability, fees and regional rules change, and deposits can be paused.
const exchanges = [
  { name: 'Gate', url: 'https://www.gate.com/trade/QUBIC_USDT' },
  { name: 'MEXC', url: 'https://www.mexc.com/exchange/QUBIC_USDT' },
  { name: 'LBank', url: 'https://www.lbank.com' },
  { name: 'Bitget', url: 'https://www.bitget.com/spot/QUBICUSDT', note: 'Deposits and withdrawals of QUBIC were suspended on 4 October 2026.' },
  { name: 'XT.com', url: 'https://www.xt.com' },
  { name: 'DigiFinex', url: 'https://www.digifinex.com' },
  { name: 'BYDFi', url: 'https://www.bydfi.com' },
  { name: 'SafeTrade', url: 'https://safe.trade' },
  { name: 'BitKan', url: 'https://bitkan.com', note: 'Subject to a UK FCA warning.' },
] as { name: string; url: string; note?: string }[]

const steps = [
  {
    step: 1,
    title: 'Get a Wallet',
    description:
      'Download the official Qubic Wallet to store your QUBIC safely.',
    action: { label: 'Download Wallet', url: 'https://wallet.qubic.org' },
    details: [
      'Available as web wallet (wallet.qubic.org)',
      'Your seed (55 lowercase letters) is your QUBIC: write it down offline and never share it',
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
      'Register on an exchange that lists QUBIC (see the list below)',
      'Check that QUBIC deposits and withdrawals are open there',
      'Buy QUBIC and withdraw to your wallet address',
    ],
  },
  {
    step: 3,
    title: 'Get an Anna NFT',
    description:
      'The Anna Aigarth collection: 200 hand-made Annas on Qubic, on QubicBay.',
    action: { label: 'Browse NFTs', url: 'https://qubicbay.io/collections/7' },
    details: [
      'Visit QubicBay.com and connect your wallet',
      'Browse the Anna Aigarth collection (200 NFTs)',
      'Each Anna gives its holder the status of a founder of Qubic Church. And not only that.',
    ],
  },
]

const faqs = [
  {
    q: 'What is Qubic?',
    a: 'Qubic is a decentralised network launched on 13 April 2022 by Come-from-Beyond. It is run by 676 computors and secured by Useful Proof of Work: the computation miners do to keep the network also trains Aigarth, its research project toward a new kind of artificial intelligence. See What is Qubic? on this site.',
  },
  {
    q: 'What makes Qubic different from other blockchains?',
    a: 'Mining work is put to use: it evolves Aigarth\'s networks, which use ternary states (+1, 0, -1). Transfers between people carry no fee, and the network lives in weekly epochs that change every Wednesday around 12:00 UTC.',
  },
  {
    q: 'What are Anna NFTs?',
    a: 'A collection of 200 hand-made Annas on Qubic. Each Anna gives its holder the status of a founder of Qubic Church. And not only that.',
  },
  {
    q: 'Is Qubic safe?',
    a: 'Your QUBIC is only as safe as your seed. Keep it offline, never type it into a website you did not open yourself, and never share it: no one from Qubic or Qubic Church will ever ask for it. The official wallet is at wallet.qubic.org.',
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
        lede="A wallet, where QUBIC is traded, and the Anna Aigarth collection, step by step. Nothing here is financial advice."
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
          lede="Markets with QUBIC as counted on 4 October 2026. A list, not a recommendation: check fees, local rules and that deposits are open before you send anything."
          title="Where to buy"
        />
        <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
          {exchanges.map(exchange => (
            <a
              className="group flex flex-col bg-card p-6 transition-colors duration-150 ease-out hover:bg-surface-2"
              href={exchange.url}
              key={exchange.name}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-gold">
                  {exchange.name}
                </h3>
                <ExternalLink
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-colors group-hover:text-gold"
                />
              </div>
              {exchange.note && <p className="mt-2 text-sm leading-relaxed text-fg-2">{exchange.note}</p>}
            </a>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Source:{' '}
          <a className="underline decoration-gold/40 underline-offset-4 hover:text-gold" href="https://www.cointribune.com/en/how-to-buy-qubic-in-2026-exchanges-fees-and-kyc/" rel="noopener noreferrer" target="_blank">
            Cointribune, How to buy Qubic in 2026
          </a>
          .
        </p>
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
