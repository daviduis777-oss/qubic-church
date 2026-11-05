'use client'

import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type MarketSource, MARKET_POLICY, offerTitle, type Ranked, rateNote, type Scale, type Unmeasured, usd } from '@/lib/pool/market'
import { fmtRate } from '@/lib/pool/measure'
import { CopyButton, Group, Typing } from './ui'
import s from './maria.module.css'

type Resp =
  | { ok: true; at: number; ranked: Ranked[]; unmeasured: Unmeasured[]; sources: { name: MarketSource; ok: boolean; n: number }[] }
  | { ok: false; sources: MarketSource[] }

const hhmm = (t: number) => new Date(t).toISOString().slice(11, 16)

/**
 * Pick hardware > Rent a box: the best boxes right now, by cost per 1,000 solutions. Read-only: the miner
 * opens the marketplace and rents there; nothing is rented from here. Without live prices the static list
 * below it in the outcome still says where people rent.
 */
export function LiveRentals({ scale }: { scale?: Scale }) {
  const [r, setR] = useState<Resp | null | 'error'>(null)
  useEffect(() => {
    let live = true
    fetch(`/api/pool/market${scale ? `?scale=${scale}` : ''}`, { cache: 'no-store' })
      .then(x => (x.ok ? (x.json() as Promise<Resp>) : Promise.reject()))
      .then(j => live && setR(j))
      .catch(() => live && setR('error'))
    return () => {
      live = false
    }
  }, [scale])

  if (r === null)
    return (
      <Group label="Best value right now">
        <li className={s.row}>
          <Typing label="Checking live prices" />
        </li>
      </Group>
    )
  if (r === 'error' || !r.ok || !r.ranked.length)
    return (
      <Group label="Best value right now">
        <li className={s.row}>
          <div className={s.rowMain}>
            <p className={s.rowBody} style={{ marginTop: 0 }}>
              {r !== 'error' && r.ok
                ? 'No box of this size with a card we have measured is free right now. Try another size, or check again in a few minutes.'
                : 'Live prices are not available right now. The marketplaces below are where people rent.'}
            </p>
          </div>
        </li>
      </Group>
    )

  const used = [...new Set(r.ranked.map(x => x.source))]
  const down = r.sources.filter(x => !x.ok).map(x => x.name)
  return (
    <>
      <Group label="Best value right now">
        {r.ranked.map((o, i) => (
          <li className={s.row} key={`${o.source}:${o.id}`} style={{ alignItems: 'flex-start' }}>
            <span aria-hidden className={s.num}>
              {i + 1}
            </span>
            <div className={s.rowMain}>
              <div className={s.rowTitle}>
                {offerTitle(o)} on {o.source}
              </div>
              <div className={s.rowValue} style={{ color: 'var(--gold)' }}>
                {usd(o.usdPer1k)} per 1,000 solutions
              </div>
              <p className={s.rowBody}>
                {usd(o.usdHour)}/h, about {fmtRate(o.solHour)} sol/h.
                {o.threads ? ` ${o.threads} CPU threads.` : ''}
                {o.reliability ? ` ${(o.reliability * 100).toFixed(1)}% uptime.` : ''}
                {o.country ? ` ${o.country}.` : ''}
              </p>
              <p className={s.rowNote}>Rate {rateNote(o.rate)}.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <span className={`${s.rowNote} ${s.rowMono}`} style={{ marginTop: 0 }}>
                  Offer {o.id}
                </span>
                <CopyButton label={`Copy offer ${o.id}`} text={o.id} />
              </div>
            </div>
            <a aria-label={`Open ${o.source}`} className={s.iconBtn} href={MARKET_POLICY[o.source].open} rel="noopener noreferrer sponsored" target="_blank">
              <ExternalLink aria-hidden size={16} />
            </a>
          </li>
        ))}
      </Group>
      <Group label="Read before you rent">
        {used.map(src => (
          <li className={s.row} key={src}>
            <div className={s.rowMain}>
              <div className={s.rowTitle}>{src}</div>
              <p className={s.rowBody}>{MARKET_POLICY[src].mining}</p>
            </div>
          </li>
        ))}
        <li className={s.row}>
          <div className={s.rowMain}>
            <p className={s.rowBody} style={{ marginTop: 0 }}>
              Prices fetched {hhmm(r.at)} UTC. They change by the minute, and a box can be taken before you open it. The sol/h is what our miners measured on that card, not a promise of income.
              {down.length ? ` Not reachable just now: ${down.join(', ')}.` : ''}
            </p>
          </div>
        </li>
      </Group>
      {r.unmeasured.length > 0 && (
        <Group label="Not measured yet">
          {r.unmeasured.map(u => (
            <li className={s.row} key={u.gpu}>
              <div className={s.rowMain}>
                <div className={s.rowTitle}>{u.gpu}</div>
                <p className={s.rowBody}>
                  From {usd(u.cardHourFrom)} per card per hour, {u.offers} {u.offers === 1 ? 'box' : 'boxes'}. No sol/h from our miners yet, so it is not ranked. Mine on one and save the result in Fix my rig: it ranks from then on.
                </p>
              </div>
            </li>
          ))}
        </Group>
      )}
    </>
  )
}
