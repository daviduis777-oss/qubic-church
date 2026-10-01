import { ArrowRight, ExternalLink } from 'lucide-react'

import { table as Table } from '@/components/docs/mdx-components/table'
import { td as Td } from '@/components/docs/mdx-components/td'
import { th as Th } from '@/components/docs/mdx-components/th'
import { tr as Tr } from '@/components/docs/mdx-components/tr'
import { buttonVariants } from '@/components/ui/button'
import { FaqList } from '@/components/ui/faq'
import { PageHeader, SectionHeading } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'
import { Link } from '@/navigation'

// =============================================================================
// DATA
// =============================================================================

const comparisonData = [
  {
    feature: 'Consensus',
    qubic: 'Useful Proof of Work',
    monero: 'RandomX PoW',
  },
  {
    feature: 'Energy Usage',
    qubic: 'Trains AI models',
    monero: 'Meaningless hashes',
  },
  { feature: 'Algorithm', qubic: 'AI Training Tasks', monero: 'RandomX' },
  { feature: 'Block Time', qubic: '~1 second (ticks)', monero: '~2 minutes' },
  { feature: 'Transaction Fees', qubic: 'Zero fees', monero: 'Variable fees' },
  {
    feature: 'Mining Software',
    qubic: 'Pool clients (e.g. Qubic.li)',
    monero: 'XMRig',
  },
  { feature: 'CPU Mining', qubic: 'Optimized', monero: 'Optimized' },
  { feature: 'GPU Mining', qubic: 'Supported (CUDA)', monero: 'Not efficient' },
  {
    feature: 'Purpose',
    qubic: 'Building AGI (Aigarth)',
    monero: 'Privacy payments',
  },
]

const pools = [
  {
    name: 'Qubic.li',
    url: 'https://app.qubic.li',
    description:
      'The oldest and largest Qubic pool, with its own mining client and dashboard.',
    payout: 'PPS, Solo',
    features: [
      'Qubic.li client for Windows and Linux',
      'Web dashboard',
      'CPU and GPU (CUDA)',
    ],
  },
  {
    name: 'MinerLab',
    url: 'https://qubic.minerlab.io',
    description:
      'Qubic pool listed by qubic.org, built for UPoW mining and AI training workloads.',
    payout: 'PPS, Solo',
    features: ['Live pool statistics', 'CPU and GPU', 'Web dashboard'],
  },
  {
    name: 'JetSki',
    url: 'https://jetskipool.ai',
    description:
      'Qubic pool listed by qubic.org, with live hashrate and miner statistics.',
    payout: 'PPLNS, Solo',
    features: ['Live pool statistics', 'CPU and GPU', 'Web dashboard'],
  },
]

const quickStartSteps = [
  {
    step: 1,
    title: 'Get a Qubic Wallet',
    description: 'You need a wallet address to receive mining rewards.',
    link: { label: 'wallet.qubic.org', url: 'https://wallet.qubic.org' },
  },
  {
    step: 2,
    title: 'Register on Qubic.li',
    description:
      'Create an account on the mining pool to get your access token.',
    link: { label: 'app.qubic.li', url: 'https://app.qubic.li' },
  },
  {
    step: 3,
    title: 'Download the Miner',
    description:
      'Get the Qubic.li mining client for your platform (Windows/Linux).',
    link: {
      label: 'Download Client',
      url: 'https://github.com/qubic-li/client/releases',
    },
  },
  {
    step: 4,
    title: 'Configure & Start',
    description:
      'Enter your access token, set your wallet address, and start mining.',
    link: null,
  },
]

const hardwareRecommendations = [
  {
    tier: 'Entry Level',
    cpu: 'AMD Ryzen 5 5600X / Intel i5-12400',
    gpu: 'Not required (CPU only)',
    ram: '16 GB',
    estimated: 'Low',
  },
  {
    tier: 'Mid Range',
    cpu: 'AMD Ryzen 7 5800X / Intel i7-12700K',
    gpu: 'NVIDIA RTX 3060 Ti+',
    ram: '32 GB',
    estimated: 'Medium',
  },
  {
    tier: 'High End',
    cpu: 'AMD Ryzen 9 5950X / Intel i9-13900K',
    gpu: 'NVIDIA RTX 4080/4090',
    ram: '64 GB',
    estimated: 'High',
  },
]

const faqs = [
  {
    q: 'What is Useful Proof of Work (UPoW)?',
    a: "Unlike traditional PoW that computes meaningless hashes, Qubic's UPoW uses mining power to train artificial neural networks. Your mining contributes to building Aigarth, Qubic's artificial general intelligence. You earn QUBIC while contributing to AI research.",
  },
  {
    q: 'Is Qubic mining more profitable than Monero?',
    a: 'Profitability depends on market conditions, hardware, and electricity costs. Qubic mining uses similar hardware (CPUs) as Monero but also supports GPUs. Check current profitability at qubic.li or use the calculator on our monitoring page.',
  },
  {
    q: 'Can I mine Qubic with my existing Monero setup?',
    a: "Yes! If you're mining Monero with CPUs, you can switch to Qubic mining easily. Just install the qubic.li client and configure it with your access token. GPU miners can also participate for additional earnings.",
  },
  {
    q: 'How are mining rewards distributed?',
    a: 'Qubic rewards miners per epoch (roughly weekly). The network distributes rewards based on the quality of solutions submitted. Pools like qubic.li handle the distribution automatically.',
  },
  {
    q: 'What are the system requirements?',
    a: 'Minimum: Modern CPU with AVX2 support (2015+), 8GB RAM. Recommended: AMD Ryzen 5000+ or Intel 12th gen+, 16GB RAM. GPU mining requires NVIDIA cards with CUDA support.',
  },
]

// =============================================================================
// PAGE
// =============================================================================

const SECTION = 'mx-auto w-full max-w-5xl px-4 sm:px-6 py-16 md:py-24'

export default function MineQubicPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow="Mining guide"
        lede="Earn QUBIC by training AI. Useful Proof of Work means your mining power builds artificial intelligence, not wasted heat."
        title="Mine Qubic"
      >
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-fg-2">
          <li>Useful Proof of Work</li>
          <li>Competitive returns</li>
          <li>CPU and GPU support</li>
        </ul>
      </PageHeader>

      {/* Comparison */}
      <section className={SECTION}>
        <SectionHeading
          label="Compare"
          lede="Same hardware, more purpose."
          title="Qubic and Monero"
        />
        <Table>
          <thead>
            <Tr>
              <Th>Feature</Th>
              <Th className="text-gold">Qubic</Th>
              <Th>Monero</Th>
            </Tr>
          </thead>
          <tbody>
            {comparisonData.map(row => (
              <Tr key={row.feature}>
                <Td className="text-muted-foreground">{row.feature}</Td>
                <Td className="text-foreground">{row.qubic}</Td>
                <Td>{row.monero}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </section>

      {/* Quick start */}
      <section className={SECTION}>
        <SectionHeading
          label="Quick start"
          lede="Start mining Qubic in under five minutes."
          title="Start in five minutes"
        />
        <ol className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
          {quickStartSteps.map(step => (
            <li className="flex gap-5 py-6" key={step.step}>
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center border border-gold/40 font-mono text-sm text-gold tabular-nums"
              >
                {step.step}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 leading-relaxed text-fg-2">
                  {step.description}
                </p>
                {step.link && (
                  <a
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold"
                    href={step.link.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {step.link.label}
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Pools */}
      <section className={SECTION}>
        <SectionHeading
          label="Pools"
          lede="Join a pool for consistent rewards."
          title="Mining pools"
        />
        <p className="-mt-4 mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Fees and payout terms change, so check them on each pool&apos;s site.
          The official overview is at{' '}
          <a
            className="text-gold underline underline-offset-4"
            href="https://qubic.org/mining"
            rel="noopener noreferrer"
            target="_blank"
          >
            qubic.org/mining
          </a>
          , the technical guide at{' '}
          <a
            className="text-gold underline underline-offset-4"
            href="https://docs.qubic.org"
            rel="noopener noreferrer"
            target="_blank"
          >
            docs.qubic.org
          </a>
          , and pool operators answer questions in the{' '}
          <a
            className="text-gold underline underline-offset-4"
            href="https://join.qubic.org/discord"
            rel="noopener noreferrer"
            target="_blank"
          >
            Qubic Discord
          </a>
          .
        </p>
        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {pools.map(pool => (
            <a
              className="group flex flex-col bg-card p-6 transition-colors duration-150 ease-out hover:bg-surface-2"
              href={pool.url}
              key={pool.name}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-gold">
                  {pool.name}
                </h3>
                <span className="text-sm text-muted-foreground">
                  <span className="font-mono text-fg-2">{pool.payout}</span>
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">
                {pool.description}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {pool.features.map(f => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-gold">
                Visit {pool.name}
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Hardware */}
      <section className={SECTION}>
        <SectionHeading
          label="Hardware"
          lede="What you need to start mining."
          title="Recommended hardware"
        />
        <Table>
          <thead>
            <Tr>
              <Th>Tier</Th>
              <Th>CPU</Th>
              <Th>GPU</Th>
              <Th>RAM</Th>
              <Th>Expected earnings</Th>
            </Tr>
          </thead>
          <tbody>
            {hardwareRecommendations.map(hw => (
              <Tr key={hw.tier}>
                <Td className="font-medium text-foreground">{hw.tier}</Td>
                <Td>{hw.cpu}</Td>
                <Td>{hw.gpu}</Td>
                <Td className="whitespace-nowrap">{hw.ram}</Td>
                <Td>{hw.estimated}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-16 md:py-24">
        <SectionHeading label="Knowledge" title="Frequently asked questions" />
        <FaqList items={faqs} />
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-16 text-center md:py-24">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Start mining today
        </h2>
        <p className="mt-3 text-fg-2">
          Earn QUBIC while contributing to artificial intelligence research.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            className={cn(
              buttonVariants({ variant: 'primary', size: 'lg' }),
              'gap-2'
            )}
            href="https://app.qubic.li"
            rel="noopener noreferrer"
            target="_blank"
          >
            Join the Qubic.li pool
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
          <Link
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'gap-2'
            )}
            href="/monitoring"
          >
            Check profitability
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
