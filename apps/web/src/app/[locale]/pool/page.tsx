import { Cpu, LifeBuoy, MessageCircle, PlugZap, Stethoscope, Wallet } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Device } from '@/components/pool/Device'
import { poolFontVars } from '@/components/pool/fonts'
import { MariaApp } from '@/components/pool/maria/MariaApp'
import { type HardwareRow, topRows } from '@/lib/pool/aggregate'
import { keepPercent, MEASURE, POOL, WALLET } from '@/lib/pool/config'
import { poolAllowed, poolPublic } from '@/lib/pool/gate'
import { GLANCE, SOURCES } from '@/lib/pool/knowledge'
import { fmtRate } from '@/lib/pool/measure'
import { measureStore } from '@/lib/pool/store'
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
  { icon: Wallet, text: 'Rewards go straight to your own wallet, every week.' },
  { icon: Cpu, text: 'Mine with a CPU, an NVIDIA GPU or a Mac with Apple Silicon.' },
  { icon: LifeBuoy, text: 'Get help from Maria at every step, from buying to fixing.' },
]

const JOBS = [
  { icon: Cpu, text: 'Picks hardware' },
  { icon: PlugZap, text: 'Connects your machine' },
  { icon: Stethoscope, text: 'Fixes your rig' },
  { icon: MessageCircle, text: 'Answers questions' },
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

const unitLabel = (r: HardwareRow) => (r.unit === 'card' ? 'per card, GPU only' : r.key.startsWith('mix|') ? 'per rig, GPU and CPU' : 'per rig, CPU only')

/** "What our miners measure": medians per card (GPU-only rigs) or per rig, with n and the epoch. Rates only. */
function Measured({ rows, drift }: { rows: HardwareRow[]; drift: HardwareRow[] }) {
  return (
    <section aria-labelledby="measured" className={p.section}>
      <h2 className={p.h2} id="measured">
        What our miners measure
      </h2>
      <p className={p.sectionLede}>
        Median solutions per hour from saved runs and our own field runs. Rates only, never income. Under {MEASURE.fewData} rigs is few data; older than{' '}
        {MEASURE.olderAfterEpochs} epochs is marked older, because the algorithm changes every few weeks.
      </p>
      {rows.length ? (
        <table className={p.mTable}>
          <thead>
            <tr>
              <th scope="col">Hardware</th>
              <th scope="col">Median sol/h</th>
              <th scope="col">Spread</th>
              <th scope="col">Rigs</th>
              <th scope="col">Epoch</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key}>
                <th scope="row">
                  <span className={p.glancePick}>{r.label}</span>
                  <span className={p.mUnit}>{unitLabel(r)}</span>
                  {r.tags.length > 0 && (
                    <span className={p.mTags}>
                      {r.tags.map(t => (
                        <span className={`${p.mTag} ${t === 'older' ? p.mTagOld : ''}`} key={t}>
                          {t}
                        </span>
                      ))}
                    </span>
                  )}
                </th>
                <td className={p.mNum} data-label="Median">
                  {fmtRate(r.latest.median ?? 0)}
                  <span className={p.mPer}> sol/h</span>
                </td>
                <td className={p.mSpread} data-label="Spread">
                  {r.latest.n > 1 && r.latest.p25 !== undefined && r.latest.p75 !== undefined ? `${fmtRate(r.latest.p25)} to ${fmtRate(r.latest.p75)}` : 'one rig'}
                </td>
                <td data-label="Rigs">{r.latest.n}</td>
                <td data-label="Epoch">{r.latest.epoch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={p.sectionLede}>No measured rigs yet.</p>
      )}
      {drift.map(r =>
        r.drift ? (
          <p className={p.mDrift} key={r.key}>
            {r.label}: the median moved {r.drift.pct > 0 ? '+' : ''}
            {r.drift.pct}% from epoch {r.drift.from} to {r.drift.to}. The algorithm may have changed.
          </p>
        ) : null,
      )}
    </section>
  )
}

/** 676 dots, one per computor, as a faint field behind the phone. Static and decorative. */
function DotField() {
  const N = 676
  const g = Math.PI * (3 - Math.sqrt(5))
  const dots = Array.from({ length: N }, (_, i) => {
    const r = Math.sqrt((i + 0.5) / N) * 470
    const a = i * g
    return [500 + Math.cos(a) * r, 500 + Math.sin(a) * r, 0.6 + (i / N) * 0.7] as const
  })
  return (
    <svg aria-hidden className={p.field} viewBox="0 0 1000 1000">
      <defs>
        <radialGradient id="qcpFade">
          <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="qcpMask">
          <rect fill="url(#qcpFade)" height="1000" width="1000" />
        </mask>
      </defs>
      <g fill="#FECE34" mask="url(#qcpMask)">
        {dots.map(([x, y, r]) => (
          <circle cx={x.toFixed(1)} cy={y.toFixed(1)} key={`${x.toFixed(1)}-${y.toFixed(1)}`} r={r.toFixed(2)} />
        ))}
      </g>
    </svg>
  )
}

export default async function PoolPage(props: { params: Promise<{ locale: string }> }) {
  if (!(await poolAllowed())) notFound()
  const { locale } = await props.params
  setRequestLocale(locale)
  const measured = await measureStore()
    .summary()
    .catch(() => null)

  return (
    <div className={`${p.backdrop} ${poolFontVars}`}>
      <div aria-hidden className={p.glow} />
      <div className={p.page}>
        <div className={p.top}>
          <header className={p.intro}>
            {!poolPublic() && (
              <p className={p.pill} role="note">
                <span aria-hidden className={p.pillDot} />
                Private preview
              </p>
            )}
            <h1 className={p.title}>{POOL.name}</h1>
            <p className={p.lede}>Mine Qubic with the hardware you have or the hardware you choose. Maria sets it up with you and keeps it running.</p>
            <ul className={p.facts}>
              {FACTS.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <Icon aria-hidden className={p.factIcon} size={18} strokeWidth={1.6} />
                  {text}
                </li>
              ))}
            </ul>
            <div className={p.jobs}>
              <h2 className={p.jobsLabel}>What Maria does</h2>
              <ul>
                {JOBS.map(({ icon: Icon, text }) => (
                  <li key={text}>
                    <Icon aria-hidden size={15} strokeWidth={1.8} />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </header>

          <div className={p.deviceWrap}>
            <DotField />
            <Device label="Maria, the mining coach">
              <MariaApp />
            </Device>
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

        <section aria-labelledby="hw" className={p.section}>
          <h2 className={p.h2} id="hw">
            Hardware at a glance
          </h2>
          <p className={p.sectionLede}>What the Qubic Academy, a 2026 mining guide and our own field guide agree on. Maria works from the same list.</p>
          <dl className={p.glance}>
            {GLANCE.map(g => (
              <div className={p.glanceRow} key={g.part}>
                <dt>{g.part}</dt>
                <dd>
                  <span className={p.glancePick}>{g.pick}</span>
                  <span className={p.glanceNote}>{g.note}</span>
                </dd>
                <dd className={p.glanceSrc}>
                  {g.sources.map((id, i) => (
                    <span key={id}>
                      {i > 0 && ', '}
                      {SOURCES[id].url.startsWith('http') ? (
                        <a href={SOURCES[id].url} rel="noopener noreferrer" target="_blank">
                          {SOURCES[id].label}
                        </a>
                      ) : (
                        SOURCES[id].label
                      )}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <Measured drift={(measured?.rows ?? []).filter(r => r.drift)} rows={topRows(measured, 8)} />

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
