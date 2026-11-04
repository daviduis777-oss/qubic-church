import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { MariaApp } from '@/components/pool/maria/MariaApp'
import { keepPercent, POOL, WALLET } from '@/lib/pool/config'
import { poolAllowed, poolPublic } from '@/lib/pool/gate'
import p from './pool.module.css'

/*
 * Qubic Church Pool, with Maria, the mining coach.
 * Private preview: a plain 404 for everyone but the forum moderator until POOL_PUBLIC=1.
 * Not in the sitemap, llms.txt, menus or any link while it is a preview.
 */

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  if (!(await poolAllowed())) return { robots: { index: false, follow: false } }
  return {
    title: { absolute: `${POOL.name} · Qubic Church` },
    description: 'Mine Qubic in the Qubic Church Pool. Maria helps you pick hardware, connect your machine and fix your rig.',
    // TODO(Bob): when going public, switch this to index and add /pool to sitemap.ts and llms.txt.
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  }
}

const FACTS = [
  'Rewards go straight to your own wallet, every week.',
  'Mine with a CPU, an NVIDIA GPU or a Mac with Apple Silicon.',
  'Get help from Maria at every step, from buying to fixing.',
]

const STEPS = [
  {
    title: 'Get a wallet',
    body: `Make a Qubic wallet with the official wallet. Keep the ${WALLET.seed.length}-letter seed on paper and copy the ${WALLET.address.length}-letter address.`,
  },
  {
    title: 'Connect your machine',
    body: `On the pool setup page, enter your address and a worker name such as ${POOL.workerPrefix}rig-a. Maria gives you the exact values for your system.`,
  },
  {
    title: 'Get paid after the epoch',
    body: `An epoch runs ${POOL.payout.epoch}. Rewards are ${POOL.payout.timing} and paid in ${POOL.payout.currency} to your wallet.`,
  },
]

export default async function PoolPage(props: { params: Promise<{ locale: string }> }) {
  if (!(await poolAllowed())) notFound()
  const { locale } = await props.params
  setRequestLocale(locale)

  return (
    <div className={p.backdrop}>
    <div className={p.page}>
      <div className={p.top}>
        <header className={p.intro}>
          {!poolPublic() && (
            <p className={p.preview} role="note">
              Private preview. Only you can see this page until it goes public.
            </p>
          )}
          <h1 className={p.title}>{POOL.name}</h1>
          <p className={p.lede}>A Qubic mining pool. You bring the hardware; Maria helps you pick it, connect it and keep it running.</p>
          <ul className={p.facts}>
            {FACTS.map(f => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </header>

        <div className={p.deviceWrap}>
          <section aria-label="Maria, the mining coach" className={p.device}>
            <div aria-hidden className={p.island} />
            <div className={p.screen}>
              <MariaApp />
            </div>
          </section>
        </div>
      </div>

      <section aria-labelledby="how" className={p.section}>
        <h2 className={p.h2} id="how">
          How it works
        </h2>
        <ol className={p.how}>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span aria-hidden className={p.n}>
                {i + 1}
              </span>
              <h3 className={p.h3}>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="terms" className={p.section}>
        <h2 className={p.h2} id="terms">
          Terms
        </h2>
        <dl className={p.terms}>
          <div>
            <dt>Payouts</dt>
            <dd>
              Rewards are {POOL.payout.timing} and paid in {POOL.payout.currency} straight to your wallet. They usually land within about a week of the epoch
              closing.
            </dd>
          </div>
          <div>
            <dt>Fee</dt>
            <dd>
              Pool fee: {POOL.feePercent}%. You keep {keepPercent}%.
            </dd>
          </div>
          <div>
            <dt>No promises</dt>
            <dd>
              Mining pays unevenly and nothing here promises or projects income. Check your own cost per solution: daily cost ÷ solutions per day, over one
              real epoch.
            </dd>
          </div>
          <div>
            <dt>Your seed</dt>
            <dd>
              The seed is {WALLET.seed.length} lowercase letters. Never type it into this site, the pool, a miner or a rental site. The pool only needs your{' '}
              {WALLET.address.length}-letter address, and Maria checks it in your browser without storing it.
            </dd>
          </div>
        </dl>
      </section>

      <p className={p.partners}>
        Our partner:{' '}
        <a href={POOL.partner.url} rel="noopener noreferrer" target="_blank">
          {POOL.partner.name}
        </a>
      </p>
    </div>
    </div>
  )
}
