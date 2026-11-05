'use client'

import { ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { keepPercent, POOL, WALLET } from '@/lib/pool/config'
import { fmtHours, GENESIS, type PoolRecord, shortHash } from '@/lib/pool/ledger-view'
import { RECORD } from '@/lib/pool/why'
import { Screen } from './flow'
import type { Go } from './flows'
import { useMeasured } from './measured'
import { JournalLine } from './record'
import { UsageView } from './rig'
import { Seal } from './seal'
import { Chips, cx } from './ui'
import a from './apps.module.css'
import s from './maria.module.css'
import r from './rig.module.css'

const int = (n: number) => Math.round(n).toLocaleString('en-US')

/** The record: pool-wide totals, the newest entries with names cut short, the chain head. Read only. */
export function RecordApp({ go }: { go: Go }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [rec, setRec] = useState<PoolRecord | null | undefined>(undefined)
  useEffect(() => {
    const ac = new AbortController()
    fetch('/api/pool/ledger', { cache: 'no-store', signal: ac.signal })
      .then(x => (x.ok ? (x.json() as Promise<PoolRecord & { ok?: boolean }>) : null))
      .then(j => setRec(j && typeof j.entries === 'number' ? j : null))
      .catch(() => {
        if (!ac.signal.aborted) setRec(null)
      })
    return () => ac.abort()
  }, [])
  const stats = rec
    ? [
        ['Solutions recorded', int(rec.solutions)],
        ['Rigs', int(rec.rigs)],
        ['Rental hours', fmtHours(rec.rentalHours)],
        ['Epochs', int(rec.epochs)],
      ]
    : []
  return (
    <Screen
      dock={<Chips label="Record" onPick={() => go('rig')} options={[{ value: 'rig', label: 'Record from My rig', primary: true }]} />}
      onBack={() => go('home')}
      scrollRef={scroller}
      sub={RECORD.line}
      title="The record"
    >
      <div className={a.recHead}>
        <Seal dim={!rec?.entries} size={44} />
        <p className={a.recLine}>{RECORD.title}</p>
      </div>
      {rec === undefined && <p className={s.note}>Reading the record</p>}
      {rec === null && <p className={s.note}>The record could not be read just now. Try again in a moment.</p>}
      {rec && (
        <>
          <dl className={a.stats}>
            {stats.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {rec.newest.length ? (
            <section aria-label="Newest entries">
              <h3 className={s.groupLabel}>Newest entries</h3>
              <ol className={r.journal}>
                {rec.newest.map(e => (
                  <JournalLine e={e} key={e.seq} />
                ))}
              </ol>
            </section>
          ) : (
            <p className={s.note}>{RECORD.empty}</p>
          )}
          <p className={a.chain}>
            <span>{rec.entries ? 'Chain head' : 'Genesis'}</span>
            <code>{rec.head === GENESIS ? shortHash(GENESIS, 6) : shortHash(rec.head, 8)}</code>
            {rec.entries > 0 && <span className={rec.verified ? a.ok : a.bad}>{rec.verified ? `${int(rec.entries)} entries, verified` : 'chain check failed'}</span>}
          </p>
        </>
      )}
    </Screen>
  )
}

/** Who mines with what: the same honest statistics as before, as an app of its own. */
export function WhoApp({ go }: { go: Go }) {
  const scroller = useRef<HTMLDivElement>(null)
  const { summary } = useMeasured()
  return (
    <Screen
      dock={<Chips label="Next" onPick={v => go(v as 'pick' | 'rig')} options={[{ value: 'pick', label: 'Pick hardware', primary: true }, { value: 'rig', label: 'My rig' }]} />}
      onBack={() => go('home')}
      scrollRef={scroller}
      sub="From rigs that saved their numbers."
      title="Who mines"
    >
      <UsageView summary={summary} />
    </Screen>
  )
}

type Qa = { q: string; a: string; open?: 'connect' | 'doctor' | 'pick' }

const HELP: Qa[] = [
  {
    q: 'How do I start?',
    a: `Make a Qubic wallet, then open Connect. Maria gives you the exact values for your machine. The pool only needs your ${WALLET.address.length}-letter address.`,
    open: 'connect',
  },
  {
    q: 'What should I mine with?',
    a: 'A CPU, an NVIDIA GPU or a Mac with Apple Silicon. Pick hardware compares what you have with what you could buy or rent.',
    open: 'pick',
  },
  {
    q: 'Is my seed safe?',
    a: `The seed is ${WALLET.seed.length} lowercase letters and it is the master key. Never type it into any site, pool, miner or chat, this one included. Maria never asks for it.`,
  },
  {
    q: 'When are rewards paid?',
    a: `One epoch runs ${POOL.payout.epoch}. ${POOL.payout.lands}.`,
  },
  {
    q: 'What does it cost?',
    a: `The pool fee is ${POOL.feePercent}%. You keep ${keepPercent}%.`,
  },
  {
    q: 'Who runs the pool?',
    a: `Our partner ${POOL.partner.name} operates the pool infrastructure. QC provides Maria.`,
  },
  {
    q: 'My rig stopped mining',
    a: 'Open Fix my rig and paste the last lines of the miner log. Maria reads it right here, in your browser.',
    open: 'doctor',
  },
]

const OPEN_LABEL = { connect: 'Open Connect', doctor: 'Open Fix my rig', pick: 'Open Pick hardware' } as const

/** Help: short answers, each one tap from the tool that does the job. */
export function HelpApp({ go }: { go: Go }) {
  const scroller = useRef<HTMLDivElement>(null)
  return (
    <Screen
      dock={
        <Chips
          label="Tools"
          onPick={v => go(v as 'doctor' | 'ask')}
          options={[
            { value: 'doctor', label: 'Fix my rig', primary: true },
            { value: 'ask', label: 'Ask Maria' },
          ]}
        />
      }
      onBack={() => go('home')}
      scrollRef={scroller}
      sub="Short answers. The tools do the rest."
      title="Help"
    >
      <ul className={cx(s.group, a.help)}>
        {HELP.map(x => (
          <li key={x.q}>
            <details className={a.qa}>
              <summary>
                <span>{x.q}</span>
                <ChevronRight aria-hidden className={a.chev} size={17} strokeWidth={2.2} />
              </summary>
              <p>{x.a}</p>
              {x.open && (
                <button className={a.open} onClick={() => go(x.open!)} type="button">
                  {OPEN_LABEL[x.open]}
                </button>
              )}
            </details>
          </li>
        ))}
      </ul>
    </Screen>
  )
}
