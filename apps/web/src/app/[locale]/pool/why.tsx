import type { CSSProperties } from 'react'
import { Seal } from '@/components/pool/maria/seal'
import {
  entryParts,
  fmtHours,
  GENESIS,
  type PoolRecord,
} from '@/lib/pool/ledger-view'
import {
  ANSWER,
  ASK,
  ASK_SPAN,
  CFB,
  DECENTRAL,
  MACHINE,
  RECORD,
} from '@/lib/pool/why'
import p from './pool.module.css'

/*
 * The why and the hook, below the hero: Come-from-Beyond's words, one factual block on decentralization,
 * and the record. Server components; the copy lives in lib/pool/why.ts so tests can hold it verbatim.
 */

/** "ask miners", again and again, as a quiet column of dated repeats; then the machine quote as the anchor. */
export function Why() {
  return (
    <section aria-labelledby="why" className={`${p.section} ${p.why}`}>
      <h2 className={p.srOnly} id="why">
        Why this pool
      </h2>
      <figure className={p.ask}>
        <ol
          aria-label={`“ask miners”, ${CFB.who}'s answer, ${ASK.length} times, ${ASK_SPAN}`}
          className={p.askList}
        >
          {ASK.map((a, i) => (
            <li
              key={`${a.iso}-${i}`}
              style={{ '--i': i, '--n': ASK.length } as CSSProperties}
            >
              <q className={p.askQ}>{a.text}</q>
              <time className={p.askDate} dateTime={a.iso}>
                {a.date}
              </time>
            </li>
          ))}
        </ol>
        <figcaption className={p.askCap}>
          <span className={p.askCapName}>{CFB.who}</span>
          <span>
            {CFB.where}, {ASK_SPAN}
          </span>
        </figcaption>
      </figure>

      <div className={p.anchorCol}>
        <figure className={p.anchor}>
          <blockquote className={p.anchorQ}>
            <p>
              <span aria-hidden className={p.qOpen}>
                “
              </span>
              {MACHINE.text}
              <span aria-hidden>”</span>
            </p>
          </blockquote>
          <figcaption className={p.sign}>
            <span className={p.signName}>{MACHINE.who}</span>
            <span className={p.signMeta}>
              {MACHINE.where}, <time dateTime="2026-07-20">{MACHINE.date}</time>
            </span>
          </figcaption>
        </figure>
        <div className={p.answer}>
          <p className={p.answerLine}>
            <span>Miners ask.</span>{' '}
            <span className={p.answerGold}>Maria answers.</span>
          </p>
          <p className={p.answerSub}>{ANSWER.sub}</p>
        </div>
      </div>
    </section>
  )
}

/** One short, factual block: how few pools there are, and what one more independent pool does. */
export function Independence() {
  const c = DECENTRAL.count
  return (
    <section aria-labelledby="indep" className={`${p.section} ${p.indep}`}>
      <div className={p.indepText}>
        <h2 className={p.h2} id="indep">
          {DECENTRAL.title}
        </h2>
        <p className={p.indepBody}>{DECENTRAL.why}</p>
        <p className={p.indepLine}>{DECENTRAL.line}</p>
      </div>
      <figure className={p.census}>
        <div className={p.censusNums}>
          <div>
            <span className={p.censusN}>{c.public}</span>
            <span className={p.censusL}>public</span>
          </div>
          <span aria-hidden className={p.censusPlus}>
            +
          </span>
          <div>
            <span className={p.censusN}>{c.independent}</span>
            <span className={p.censusL}>independent</span>
          </div>
        </div>
        <p className={p.censusGone}>
          <span aria-hidden className={p.censusRing} />
          {DECENTRAL.inactive}
        </p>
        <figcaption className={p.censusCap}>
          “{c.quote}”, {c.who}, {c.where},{' '}
          <time dateTime="2026-11-02">{c.date}</time>
        </figcaption>
      </figure>
    </section>
  )
}

const int = (n: number) => Math.round(n).toLocaleString('en-US')

/** The record on the page: pool-wide totals, the newest few entries with names cut short, the chain head. */
export function RecordStrip({ rec }: { rec: PoolRecord | null }) {
  const r: PoolRecord = rec ?? {
    entries: 0,
    solutions: 0,
    rigs: 0,
    rentalHours: 0,
    onlineHours: 0,
    results: 0,
    epochs: 0,
    head: GENESIS,
    verified: true,
    newest: [],
  }
  const stats = [
    { label: 'Solutions recorded', value: int(r.solutions) },
    { label: 'Rigs', value: int(r.rigs) },
    { label: 'Rental hours', value: fmtHours(r.rentalHours) },
    { label: 'Epochs', value: int(r.epochs) },
  ]
  return (
    <section aria-labelledby="record" className={`${p.section} ${p.rec}`}>
      <div className={p.recHead}>
        <Seal className={p.recSeal} dim={!r.entries} size={52} />
        <div>
          <h2 className={p.h2} id="record">
            {RECORD.title}
          </h2>
          <p className={p.sectionLede}>{RECORD.line}</p>
        </div>
      </div>
      <div className={p.recPanel}>
        <dl className={p.recStats}>
          {stats.map(s => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
        {r.newest.length ? (
          <ol aria-label="Newest entries" className={p.recLines}>
            {r.newest.map(e => {
              const [ep, what, who, src] = entryParts(e)
              return (
                <li key={e.seq}>
                  <span className={p.recSeq}>
                    #{String(e.seq).padStart(4, '0')}
                  </span>
                  <span className={p.recEp}>{ep}</span>
                  <span className={p.recWhat}>
                    <span className={p.srOnly}> · </span>
                    {what}
                  </span>
                  <span className={p.recWho}>
                    <span className={p.srOnly}> · </span>
                    {who}
                  </span>
                  <span
                    className={
                      e.source === 'pool'
                        ? p.recSrcPool
                        : e.source === 'self-reported'
                          ? p.recSrcSelf
                          : p.recSrc
                    }
                  >
                    <span className={p.srOnly}> · </span>
                    {src}
                  </span>
                  <span className={p.recHash}>{e.hash.slice(0, 8)}</span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className={p.recEmpty}>{RECORD.empty}</p>
        )}
        <div className={p.recFoot}>
          <span className={p.recFootLabel}>
            {r.entries ? 'Chain head' : 'Genesis'}
          </span>
          <code className={p.recHead64}>{r.head}</code>
          {r.entries > 0 && (
            <span className={r.verified ? p.recOk : p.recBad}>
              {r.verified
                ? `${int(r.entries)} entries, chain verified`
                : 'chain check failed'}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
