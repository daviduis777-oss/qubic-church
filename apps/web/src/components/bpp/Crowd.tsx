'use client'

import { useEffect, useState } from 'react'

type C = { signedUp: number; watching: number; trades: number; long: number; short: number }

/** People around the call. Counts come from the experiment's own store; nothing here is estimated. */
export function Crowd({ initial }: { initial: C }) {
  const [c, setC] = useState<C>(initial)
  useEffect(() => {
    let sid = ''
    try {
      sid = sessionStorage.getItem('bpp-sid') || ''
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
        sessionStorage.setItem('bpp-sid', sid)
      }
    } catch {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    }
    const beat = () =>
      fetch('/api/bpp/crowd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid }) })
        .then(r => r.json())
        .then(j => typeof j.signedUp === 'number' && setC(j))
        .catch(() => {})
    beat()
    const t = setInterval(() => !document.hidden && beat(), 60_000)
    return () => clearInterval(t)
  }, [])
  const longPct = c.trades ? Math.round((c.long / c.trades) * 100) : 50
  return (
    <section className="panel" style={{ padding: 'clamp(18px, 3vw, 26px)', background: 'linear-gradient(180deg, rgba(255,205,110,.05), rgba(255,205,110,.015))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span className="label">Everyone on this call</span>
        <span className="mute" style={{ fontSize: 13 }}>
          people against the machine, hour by hour
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 'clamp(18px, 3vw, 34px)', marginTop: 16, alignItems: 'center' }}>
        <Num big={c.signedUp.toLocaleString('en-US')} small={c.signedUp ? 'signed up' : 'signed up so far: be the first'} />
        <Num
          big={
            <>
              <span className="live-dot" style={{ marginRight: 10, verticalAlign: 'middle' }} />
              {c.watching.toLocaleString('en-US')}
            </>
          }
          small="on this page right now"
        />
        <div>
          <div className="mute" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, gap: 8 }}>
            <span>
              <b style={{ color: 'var(--ink)' }}>{c.trades}</b> {c.trades === 1 ? 'trade' : 'trades'} logged this hour
            </span>
            <span>{c.trades ? `long ${longPct}% · short ${100 - longPct}%` : 'no trades yet'}</span>
          </div>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,.05)' }}>
            {c.trades > 0 && (
              <>
                <i style={{ width: `${longPct}%`, background: 'linear-gradient(90deg,#E8912E,#FFC46B)' }} />
                <i style={{ width: `${100 - longPct}%`, background: '#3a2a1a' }} />
              </>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="nx" style={{ fontSize: 22, color: 'var(--fil)', letterSpacing: '.02em' }}>
            BPP-9000 <span className="mute">vs</span> the crowd
          </div>
          <div className="mute" style={{ fontSize: 13, marginTop: 4 }}>
            The score starts with the first live call.
          </div>
        </div>
      </div>
    </section>
  )
}

function Num({ big, small }: { big: React.ReactNode; small: string }) {
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
