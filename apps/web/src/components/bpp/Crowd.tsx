'use client'

import { useEffect, useState } from 'react'

type C = { signedUp: number; trades: number; total: number }

/** The participants of the experiment and what they log. Counts come from the experiment's own store. */
export function Crowd({ initial }: { initial: C }) {
  const [c, setC] = useState<C>(initial)
  useEffect(() => {
    const load = () =>
      fetch('/api/bpp/crowd')
        .then(r => r.json())
        .then(j => typeof j.signedUp === 'number' && setC({ signedUp: j.signedUp, trades: j.trades, total: j.total }))
        .catch(() => {})
    load()
    const t = setInterval(() => !document.hidden && load(), 120_000)
    return () => clearInterval(t)
  }, [])
  return (
    <section className="panel" style={{ padding: 'clamp(18px, 3vw, 26px)', background: 'linear-gradient(180deg, rgba(255,205,110,.05), rgba(255,205,110,.015))' }}>
      <span className="label">The experiment</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 'clamp(18px, 3vw, 34px)', marginTop: 16, alignItems: 'end' }}>
        <Num big={c.signedUp.toLocaleString('en-US')} small={c.signedUp ? 'participants follow BPP-9000' : 'participants so far: you can be the first'} />
        <Num big={c.total.toLocaleString('en-US')} small="trades logged in journals" />
        <Num big={c.trades.toLocaleString('en-US')} small="trades logged this hour" />
        <p className="mute" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>
          Everyone follows the same calls and keeps an honest journal. Your journal and card are yours to share.
        </p>
      </div>
    </section>
  )
}

function Num({ big, small }: { big: string; small: string }) {
  return (
    <div>
      <b className="nx" style={{ display: 'block', fontWeight: 400, fontSize: 46, lineHeight: 1, color: 'var(--hot)', textShadow: '0 0 14px rgba(232,145,46,.35)' }}>
        {big}
      </b>
      <span className="mute" style={{ fontSize: 13 }}>
        {small}
      </span>
    </div>
  )
}
