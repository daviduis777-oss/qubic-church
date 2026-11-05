import { Cpu, LifeBuoy, MessageCircle, PlugZap, Stamp, Stethoscope, Wallet } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { poolFontVars } from '@/components/pool/fonts'
import { MariaApp } from '@/components/pool/maria/MariaApp'
import { PoolTabs } from '@/components/pool/PoolTabs'
import { type HardwareRow, type Summary, selfReportedLine } from '@/lib/pool/aggregate'
import { keepPercent, MEASURE, POOL, WALLET } from '@/lib/pool/config'
import { poolAllowed, poolPublic } from '@/lib/pool/gate'
import { GLANCE, SOURCES } from '@/lib/pool/knowledge'
import { ledger } from '@/lib/pool/ledger'
import { fmtRate } from '@/lib/pool/measure'
import { runDates, type StatsView, statsView } from '@/lib/pool/stats-view'
import { measureStore } from '@/lib/pool/store'
import { PAYOUT_TERMS } from '@/lib/pool/ui-config'
import type { Bar, Usage } from '@/lib/pool/usage'
import { PoolStage } from './PoolStage'
import p from './pool.module.css'
import { Independence, RecordStrip, Why } from './why'

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
  { icon: Wallet, text: `Rewards go straight to your own wallet, every week. Pool fee ${POOL.feePercent}%.` },
  { icon: Cpu, text: 'Mine with a CPU, an NVIDIA GPU or a Mac with Apple Silicon.' },
  { icon: LifeBuoy, text: 'Get help from Maria at every step, from buying to fixing.' },
  { icon: Stamp, text: 'Your solutions and hours are recorded.' },
]

/** soon: shown as coming soon while the AI is not connected, never as a promise */
const JOBS = [
  { icon: Cpu, text: 'Picks hardware' },
  { icon: PlugZap, text: 'Connects your machine' },
  { icon: Stethoscope, text: 'Fixes your rig' },
  { icon: MessageCircle, text: 'Answers questions', soon: 'Questions: coming soon' },
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
    body: `An epoch runs ${POOL.payout.epoch}. After it closes, the pool sends your rewards in ${POOL.payout.currency} to your wallet. Pool fee ${POOL.feePercent}%.`,
  },
]

const unitLabel = (r: HardwareRow) => (r.unit === 'card' ? 'per card, GPU only' : r.key.startsWith('mix|') ? 'per rig, GPU and CPU' : 'per rig, CPU only')

function MinerTable({ rows }: { rows: HardwareRow[] }) {
  return (
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
              {selfReportedLine(r) && <span className={p.mUnit}>{selfReportedLine(r)}</span>}
              <TagList tags={r.tags} />
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
  )
}

/** "What it delivers": medians per card (GPU-only rigs) or per rig, newest algorithm era only. Rates only. */
function Delivers({ v, drift }: { v: StatsView; drift: HardwareRow[] }) {
  return (
    <>
      <p className={p.tabLede}>
        Median solutions per hour from rigs that saved their numbers, epoch {v.eraEpoch} era only: the algorithm changes every few weeks, so older rates are not
        comparable. Rates only, never income. Under {MEASURE.fewData} rigs is few data.
      </p>
      {v.rows.length ? <MinerTable rows={v.rows} /> : <p className={p.sectionLede}>No measured rigs yet.</p>}
      {v.older.length > 0 && (
        <details className={p.older}>
          <summary>Older runs ({v.older.length})</summary>
          <p className={p.olderNote}>Measured under an earlier algorithm. Not comparable with epoch {v.eraEpoch}.</p>
          <MinerTable rows={v.older} />
        </details>
      )}
      {drift.map(r =>
        r.drift ? (
          <p className={p.mDrift} key={r.key}>
            {r.label}: the median moved {r.drift.pct > 0 ? '+' : ''}
            {r.drift.pct}% from epoch {r.drift.from} to {r.drift.to}. The algorithm may have changed.
          </p>
        ) : null,
      )}
    </>
  )
}

function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  return (
    <span className={p.mTags}>
      {tags.map(t => (
        <span className={`${p.mTag} ${t === 'older' ? p.mTagOld : ''}`} key={t}>
          {t}
        </span>
      ))}
    </span>
  )
}

function Bars({ title, bars, rate }: { title: string; bars: Bar[]; rate?: boolean }) {
  if (!bars.length) return null
  const max = Math.max(...bars.map(b => b.share)) || 1
  return (
    <div className={p.uCard}>
      <h3 className={p.uTitle}>{title}</h3>
      <ul className={p.uBars}>
        {bars.map(b => (
          <li key={b.key}>
            <div className={p.uHead}>
              <span className={p.uLabel}>{b.label}</span>
              <span className={p.uShare}>
                {Math.round(b.share * 100)}%<span className={p.uN}> n {b.n}</span>
              </span>
            </div>
            <span aria-hidden className={p.uTrack}>
              <span className={p.uFill} style={{ width: `${Math.max(3, (b.share / max) * 100)}%` }} />
            </span>
            {rate && (
              <span className={p.uRate}>
                {b.median !== undefined ? `median ${fmtRate(b.median)} sol/h ${b.unit === 'card' ? 'per card' : 'per rig'}` : 'no current rate'}
                {b.tags.length > 0 && ` · ${b.tags.join(', ')}`}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** "What people use": share of rigs by GPU and CPU family, the median for each, the common setups. */
function Uses({ u }: { u?: Usage }) {
  if (!u?.n) return <p className={p.sectionLede}>No measured rigs yet.</p>
  return (
    <>
      <p className={p.tabLede}>
        {u.real} rig{u.real === 1 ? '' : 's'} that saved their numbers{u.n > u.real ? `, plus ${u.n - u.real} of our own test runs` : ''}, epoch
        {u.from === u.to ? ` ${u.to}` : `s ${u.from} to ${u.to}`}. Each rig counts once. GPU medians are per card, from GPU-only rigs; CPU medians are per rig, from
        CPU-only rigs.
      </p>
      <TagList tags={[...(u.few ? ['few data'] : []), ...(u.older ? ['older'] : [])]} />
      <div className={p.uGrid}>
        <Bars bars={u.gpu} rate title="GPU" />
        <Bars bars={u.cpu} rate title="CPU family" />
        <Bars bars={u.mode} title="Mode" />
        <Bars bars={u.os} title="System" />
        <Bars bars={u.owner} title="Own or rented" />
        {u.top && (
          <div className={p.uCard}>
            <h3 className={p.uTitle}>Most common setup</h3>
            <p className={p.uTop}>{u.top.label}</p>
            <p className={p.uRate}>
              {u.top.n} of {u.n} rigs
            </p>
          </div>
        )}
      </div>
    </>
  )
}

/** Our own test rentals, said plainly: what they are, when, and only the newest algorithm era. */
function TestRuns({ v }: { v: StatsView }) {
  const { current, older, epoch } = v.tests
  if (!current.length) return null
  return (
    <div className={p.tests}>
      <h3 className={p.h3}>Our own test runs</h3>
      <p className={p.tabLede}>
        Boxes we rented to test the setup, epoch {epoch}, {runDates(current)}. They show the setup works, not what our miners run.
      </p>
      <ul className={p.testList}>
        {current.map(f => (
          <li key={f.label}>
            <span className={p.testName}>{f.label}</span>
            <span className={p.testMeta}>
              {f.host} rental · {fmtRate(f.solPerHour)} sol/h per rig
              {f.perCard !== undefined && ` (${fmtRate(f.perCard)} per card)`}
            </span>
          </li>
        ))}
      </ul>
      {older.length > 0 && (
        <details className={p.older}>
          <summary>
            Older runs ({older.length}), epoch {[...new Set(older.map(f => f.epoch))].join(', ')}
          </summary>
          <p className={p.olderNote}>
            Measured under an earlier algorithm, so their rates are not comparable with epoch {epoch} and are not shown. {older.map(f => f.label).join('; ')}.
          </p>
        </details>
      )}
    </div>
  )
}

/** One section: our test runs as test runs; miner statistics only once enough rigs report. */
function WhoMines({ sum }: { sum: Summary | null }) {
  const v = statsView(sum)
  return (
    <section aria-labelledby="measured" className={p.section}>
      <h2 className={p.h2} id="measured">
        Who mines with what
      </h2>
      {v.show ? (
        <>
          <p className={p.sectionLede}>What rigs in the pool run and what they measure, with n and the epoch on every number.</p>
          <PoolTabs
            classes={{ list: p.tabs, tab: p.tab, on: p.tabOn, panel: p.tabPanel }}
            tabs={[
              { label: 'What people use', panel: <Uses u={sum?.usage} /> },
              { label: 'What it delivers', panel: <Delivers drift={(sum?.rows ?? []).filter(r => r.drift && v.rows.some(x => x.key === r.key))} v={v} /> },
            ]}
          />
        </>
      ) : (
        <p className={p.sectionLede}>
          Miner statistics appear once enough rigs report: {v.real} of {v.need} so far. Until then we show no shares or medians, so nothing here reads as what our miners run.
        </p>
      )}
      <TestRuns v={v} />
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
  const [measured, record] = await Promise.all([
    measureStore()
      .summary()
      .catch(() => null),
    ledger()
      .totals()
      .catch(() => null),
  ])
  // the same check as GET /api/pool/maria: without a key, questions are "coming soon", never promised
  const ai = Boolean(process.env.ANTHROPIC_API_KEY)

  return (
    <div className={`${p.backdrop} ${poolFontVars}`}>
      <div aria-hidden className={p.glow} />
      <div className={p.page}>
        <PoolStage
          backdrop={<DotField />}
          intro={
            <>
              {!poolPublic() && (
                <p className={p.pill} role="note">
                  <span aria-hidden className={p.pillDot} />
                  Private preview
                </p>
              )}
              <h1 className={p.title}>{POOL.name}</h1>
              <p className={p.lede}>Mine Qubic with the hardware you have or the hardware you choose. Maria sets it up with you and keeps it running.</p>
            </>
          }
          rest={
            <>
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
                  {JOBS.map(({ icon: Icon, text, soon }) => (
                    <li className={soon && !ai ? p.jobSoon : undefined} key={text}>
                      <Icon aria-hidden size={15} strokeWidth={1.8} />
                      {soon && !ai ? soon : text}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          }
        >
          <MariaApp ai={ai} />
        </PoolStage>

        <Why />

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

        <Independence />

        <RecordStrip rec={record} />

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

        <WhoMines sum={measured} />

        <section aria-labelledby="terms" className={p.section}>
          <h2 className={p.h2} id="terms">
            Terms
          </h2>
          <dl className={p.terms}>
            <div>
              <dt>Payouts</dt>
              <dd>
                The pool sends your rewards in {POOL.payout.currency} straight to your wallet after each epoch closes. {POOL.payout.lands}.
              </dd>
            </div>
            <div>
              <dt>Epoch</dt>
              <dd>
                One epoch runs {POOL.payout.epoch}. Rewards are {POOL.payout.timing}.
              </dd>
            </div>
            <div>
              <dt>Fee</dt>
              <dd>
                Pool fee: {POOL.feePercent}%. You keep {keepPercent}%.
              </dd>
            </div>
            <div>
              <dt>How rewards are split</dt>
              <dd className={PAYOUT_TERMS.method ? undefined : p.pending}>{PAYOUT_TERMS.method ?? PAYOUT_TERMS.pending}</dd>
            </div>
            <div>
              <dt>Minimum payout</dt>
              <dd className={PAYOUT_TERMS.minimum ? undefined : p.pending}>{PAYOUT_TERMS.minimum ?? PAYOUT_TERMS.pending}</dd>
            </div>
            <div>
              <dt>Who runs it</dt>
              <dd>
                Our partner{' '}
                <a href={POOL.partner.url} rel="noopener noreferrer" target="_blank">
                  {POOL.partner.name}
                </a>{' '}
                operates the pool infrastructure. Qubic Church provides Maria and this page.
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
              <dt>The record</dt>
              <dd>
                Each entry holds its epoch, a shortened worker name, the hardware and where the number came from: the pool, a miner log, or the
                miner's own word. Never a wallet or an IP.
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
