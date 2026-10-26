'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { LoginBox, type Me } from '@/components/church/forum/LoginBox'

type Trade = { id: string; at: string; side: 'long' | 'short'; entry: number; exit: number; size: number; fee: number; note?: string }
type Participant = { handle: string; name: string; start: number; joined: string; trades: Trade[] }
type Stats = {
  trades: number
  wins: number
  losses: number
  winRate: number | null
  streak: { kind: 'W' | 'L' | null; n: number }
  bestStreak: number
  profitFactor: number | null
  avgWin: number | null
  avgLoss: number | null
  best: number | null
  worst: number | null
  start: number
  capital: number
  returnPct: number
  equity: number[]
  day: number
}

const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: n < 1000 ? 2 : 0 })}`
const pct = (n: number | null, sign = false) => (n == null ? '—' : `${sign && n > 0 ? '+' : ''}${n.toFixed(1)}%`)
const pnl = (t: Trade) => t.size * (t.side === 'long' ? t.exit / t.entry - 1 : 1 - t.exit / t.entry) - (t.fee || 0)

function Equity({ eq }: { eq: number[] }) {
  if (eq.length < 2) return <div style={{ height: 80, display: 'grid', placeItems: 'center', color: 'var(--dim)', fontSize: 12 }}>The curve starts with your first trade.</div>
  const hi = Math.max(...eq)
  const lo = Math.min(...eq)
  const H = 80
  const pts = eq.map((v, i) => `${(i / (eq.length - 1)) * 100},${H - ((v - lo) / (hi - lo || 1)) * (H - 8) - 4}`).join(' ')
  const up = eq.at(-1)! >= eq[0]!
  return (
    <svg aria-hidden preserveAspectRatio="none" viewBox={`0 0 100 ${H}`} width="100%" height={H}>
      <polyline fill="none" points={pts} stroke={up ? '#FFC46B' : '#d9776a'} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function Journal({ initialCount }: { initialCount: number }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const [p, setP] = useState<Participant | null>(null)
  const [s, setS] = useState<Stats | null>(null)
  const [count, setCount] = useState(initialCount)
  const [ready, setReady] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [start, setStart] = useState('100')
  const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  const [t, setT] = useState({ at: '', side: 'long', entry: '', exit: '', size: '', fee: '', note: '' })
  const file = useRef<HTMLInputElement>(null)

  const load = async () => {
    const r = await fetch('/api/bpp', { cache: 'no-store' })
    const j = await r.json()
    setMe(j.user ?? null)
    setP(j.participant ?? null)
    setS(j.stats ?? null)
    setCount(j.count ?? 0)
    setReady(j.ready !== false)
  }
  useEffect(() => {
    load()
    setT(x => ({ ...x, at: nowLocal() }))
  }, [])

  const call = async (body: Record<string, unknown>, ok?: string) => {
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const r = await fetch('/api/bpp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.errors?.length > 1 ? `${j.error} (+${j.errors.length - 1} more)` : j.error)
      setP(j.participant)
      setS(j.stats)
      if (j.count != null) setCount(j.count)
      setMsg(ok ?? (j.imported != null ? `Imported ${j.imported} trades${j.skipped ? `, ${j.skipped} already there` : ''}${j.errors?.length ? `, ${j.errors.length} rows skipped` : ''}.` : 'Saved.'))
      return true
    } catch (e) {
      setErr((e as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const trades = useMemo(() => (p?.trades ?? []).slice().sort((a, b) => b.at.localeCompare(a.at)), [p])
  const cardUrl = p ? `/bpp9000/u/${p.handle.toLowerCase()}` : ''

  if (me === undefined) return <section className="panel" style={{ padding: 20, color: 'var(--dim)' }}>loading…</section>

  if (!me)
    return (
      <section className="panel" style={{ padding: 24, textAlign: 'center' }}>
        <div className="label">the experiment</div>
        <div className="big glow-g" style={{ fontSize: 'clamp(40px, 7vw, 64px)', fontWeight: 700, marginTop: 10 }}>
          {count}
        </div>
        <div style={{ color: 'var(--dim)', fontSize: 13 }}>{count === 1 ? 'person has' : 'people have'} joined before the live feed</div>
        <p style={{ maxWidth: 560, margin: '16px auto 0', fontSize: 13, lineHeight: 1.6 }}>
          Join now, set your starting capital, and log the trades you make on BPP-9000 calls. Your stats, your journal and a card to post every day. We only show calls and statistics: you trade where you like, with your own money.
        </p>
        {!showLogin ? (
          <button className="btn btn-main" onClick={() => setShowLogin(true)} style={{ marginTop: 18 }} type="button">
            Join the experiment →
          </button>
        ) : (
          <div className="qcf" style={{ maxWidth: 560, margin: '18px auto 0', textAlign: 'left', borderRadius: 10, overflow: 'hidden' }}>
            <LoginBox
              onLogin={() => {
                load()
              }}
            />
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 12 }}>Same login as The Crypt: a Qubic wallet signature or a tripcode. No email, no password.</div>
      </section>
    )

  if (!p)
    return (
      <section className="panel" style={{ padding: 24 }}>
        <div className="label">join · {me.name}</div>
        <div style={{ fontSize: 15, marginTop: 10 }}>Your starting capital for the journal</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, maxWidth: 420 }}>
          <input inputMode="decimal" onChange={e => setStart(e.target.value)} placeholder="100" value={start} />
          <button className="btn btn-main" disabled={busy || !ready} onClick={() => call({ action: 'join', start }, 'You are in.')} type="button">
            Join
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 8 }}>CfB&apos;s experiment starts everyone at $100. Put what you actually start with; you can change it later.</div>
        {!ready && <div style={{ color: 'var(--r)', fontSize: 12, marginTop: 8 }}>Storage is being connected. Joining opens in a moment.</div>}
        {err && <div style={{ color: 'var(--r)', fontSize: 12, marginTop: 8 }}>{err}</div>}
      </section>
    )

  return (
    <section className="panel" style={{ padding: 'clamp(16px, 3vw, 26px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'baseline' }}>
        <div>
          <div className="label">your journal</div>
          <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, marginTop: 4 }}>
            {p.name} <span className="glow-g">×</span> BPP-9000 <span style={{ color: 'var(--dim)', fontWeight: 400 }}>· Day {s?.day ?? 1}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn btn-main" href={`/og/bpp/${p.handle.toLowerCase()}.png?v=${s?.trades ?? 0}-${s?.day ?? 1}`} rel="noopener" target="_blank">
            ⬇ Card for post
          </a>
          <button
            className="btn"
            onClick={() => {
              navigator.clipboard?.writeText(`${location.origin}${cardUrl}`)
              setMsg('Link copied. Paste it in X or Discord: it unfolds into your card.')
            }}
            type="button"
          >
            Copy link
          </button>
        </div>
      </div>

      {s && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 20 }}>
          <Kpi big={`${s.wins} / ${s.losses}`} label="W / L" />
          <Kpi big={pct(s.winRate)} label="win rate" tone={s.winRate == null ? undefined : s.winRate >= 50 ? 'g' : 'r'} />
          <Kpi big={s.streak.kind ? `${s.streak.kind === 'W' ? '🔥' : '❄'} ${s.streak.n}` : '—'} label={`streak · best ${s.bestStreak}`} />
          <Kpi big={s.profitFactor == null ? '—' : s.profitFactor.toFixed(2)} label="profit factor" tone={s.profitFactor == null ? undefined : s.profitFactor >= 1 ? 'g' : 'r'} />
          <Kpi big={`${pct(s.avgWin, true)} / ${pct(s.avgLoss)}`} label="avg win / loss" />
          <Kpi big={pct(s.best, true)} label="best trade" tone="g" />
          <Kpi big={`${money(s.start)} → ${money(s.capital)}`} label={`capital · ${pct(s.returnPct, true)}`} tone={s.capital >= s.start ? 'g' : 'r'} />
          <Kpi big={String(s.trades)} label="trades" />
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <Equity eq={s?.equity ?? [p.start]} />
      </div>

      {/* Add a trade */}
      <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div className="label">log a trade</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 10 }}>
          <Field label="opened (your time)">
            <input onChange={e => setT({ ...t, at: e.target.value })} type="datetime-local" value={t.at} />
          </Field>
          <Field label="direction">
            <select onChange={e => setT({ ...t, side: e.target.value })} value={t.side}>
              <option value="long">Long (UP)</option>
              <option value="short">Short (DOWN)</option>
            </select>
          </Field>
          <Field label="entry price">
            <input inputMode="decimal" onChange={e => setT({ ...t, entry: e.target.value })} placeholder="67250" value={t.entry} />
          </Field>
          <Field label="exit price">
            <input inputMode="decimal" onChange={e => setT({ ...t, exit: e.target.value })} placeholder="67610" value={t.exit} />
          </Field>
          <Field label="size, $">
            <input inputMode="decimal" onChange={e => setT({ ...t, size: e.target.value })} placeholder="100" value={t.size} />
          </Field>
          <Field label="fee, $">
            <input inputMode="decimal" onChange={e => setT({ ...t, fee: e.target.value })} placeholder="0.1" value={t.fee} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <input onChange={e => setT({ ...t, note: e.target.value })} placeholder="note, optional" style={{ flex: 1, minWidth: 200 }} value={t.note} />
          <button
            className="btn btn-main"
            disabled={busy}
            onClick={async () => {
              const ok = await call({ action: 'add', trade: { ...t, at: t.at ? new Date(t.at).toISOString() : '' } }, 'Trade logged.')
              if (ok) setT({ at: nowLocal(), side: t.side, entry: '', exit: '', size: t.size, fee: t.fee, note: '' })
            }}
            type="button"
          >
            + Log trade
          </button>
          <button className="btn" onClick={() => file.current?.click()} type="button">
            Import CSV
          </button>
          <input
            accept=".csv,text/csv"
            hidden
            onChange={async e => {
              const f = e.target.files?.[0]
              if (f) await call({ action: 'import', csv: await f.text() })
              e.target.value = ''
            }}
            ref={file}
            type="file"
          />
        </div>
        <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 8 }}>
          CSV from any exchange, one row per closed trade, header: <code>time,direction,entry,exit,size,fee</code>.{' '}
          <a download="bpp9000-journal-template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent('time,direction,entry,exit,size,fee,note\n2026-11-18T13:00:00Z,long,67250,67610,100,0.1,first live hour\n')}`} style={{ color: 'var(--c)' }}>
            Template
          </a>
          .
        </div>
        {msg && <div style={{ color: 'var(--g)', fontSize: 12, marginTop: 8 }}>{msg}</div>}
        {err && <div style={{ color: 'var(--r)', fontSize: 12, marginTop: 8 }}>{err}</div>}
      </div>

      {/* Journal */}
      <div style={{ marginTop: 20, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>opened</th>
              <th>dir</th>
              <th>entry → exit</th>
              <th>size</th>
              <th>result</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {trades.map(x => {
              const v = pnl(x)
              return (
                <tr key={x.id}>
                  <td title={x.note}>{new Date(x.at).toISOString().slice(0, 16).replace('T', ' ')}</td>
                  <td style={{ color: x.side === 'long' ? 'var(--g)' : 'var(--r)' }}>{x.side === 'long' ? '▲ L' : '▼ S'}</td>
                  <td>
                    {x.entry.toLocaleString('en-US')} → {x.exit.toLocaleString('en-US')}
                  </td>
                  <td>{money(x.size)}</td>
                  <td style={{ color: v > 0 ? 'var(--g)' : 'var(--r)' }}>
                    {v > 0 ? '✅' : '❌'} {v > 0 ? '+' : ''}
                    {money(Math.abs(v)).replace('$', v < 0 ? '−$' : '$')} ({((v / x.size) * 100).toFixed(2)}%)
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn"
                      onClick={() => confirm('Delete this trade?') && call({ action: 'delete', id: x.id }, 'Deleted.')}
                      style={{ padding: '3px 8px', fontSize: 11 }}
                      type="button"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
            {trades.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: 'var(--dim)', textAlign: 'center', padding: 18 }}>
                  No trades yet. The first live call comes with epoch 240.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--dim)' }}>
        starting capital
        <input inputMode="decimal" onChange={e => setStart(e.target.value)} placeholder={String(p.start)} style={{ width: 120 }} value={start === '100' && p.start !== 100 ? String(p.start) : start} />
        <button className="btn" disabled={busy} onClick={() => call({ action: 'capital', start }, 'Starting capital updated.')} style={{ padding: '6px 10px' }} type="button">
          Update
        </button>
      </div>
    </section>
  )
}

function Kpi({ big, label, tone }: { big: string; label: string; tone?: 'g' | 'r' }) {
  return (
    <div style={{ background: 'rgba(0,0,0,.25)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
      <div className={`big ${tone === 'g' ? 'glow-g' : tone === 'r' ? 'glow-r' : ''}`} style={{ fontSize: big.length > 12 ? 14 : 18, fontWeight: 700, overflowWrap: 'anywhere' }}>
        {big}
      </div>
      <div className="label" style={{ fontSize: 10, marginTop: 4 }}>
        {label}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span className="label" style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>
        {label}
      </span>
      {children}
    </label>
  )
}
