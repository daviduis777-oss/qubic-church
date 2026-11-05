import { Seal } from '@/components/pool/maria/seal'
import {
  entryParts,
  fmtHours,
  GENESIS,
  type PoolRecord,
} from '@/lib/pool/ledger-view'
import { RECORD } from '@/lib/pool/why'
import p from './pool.module.css'

/*
 * The record strip, lower on the page. Server component; the copy lives in lib/pool/why.ts so tests can
 * hold it verbatim. The hero quote and the decentralization facts are in qc.tsx.
 */

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
