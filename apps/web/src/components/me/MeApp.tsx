'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { bppFonts } from '@/components/bpp/fonts'
import { Identicon } from '@/components/church/forum/Avatar'
import { LEVELS, MEDALS, POWER } from '@/lib/me/medals'
import type { Circle, Person } from '@/lib/me/me'
import { MedalCoin } from './Medal'

const css = `
.me{min-height:100svh;background:radial-gradient(70% 45% at 70% 0%,rgba(255,196,107,.08),transparent 70%),#08080a;color:#ece6da;font-family:var(--bpp-sans),system-ui,sans-serif;padding:96px 16px 80px}
.me-in{max-width:1080px;margin:0 auto;display:grid;gap:28px}
.me-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;font-size:14px;color:#a39a8c}
.me-chip{display:inline-block;padding:3px 10px;border:1px solid rgba(255,196,107,.4);border-radius:999px;color:#ffc46b;font-size:12px;letter-spacing:.06em}
.me-hero{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:20px}
@media (max-width:860px){.me-hero{grid-template-columns:1fr}}
.me-card{border:1px solid #29241f;border-radius:16px;background:linear-gradient(180deg,#121014,#0c0b0d);padding:24px}
.me-pass{display:grid;align-content:start;gap:18px}
.me-pass-row{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center}
.me-ava{width:120px;height:120px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#15120f;box-shadow:0 0 0 2px #2c2620}
.me-ava.founder{box-shadow:0 0 0 3px #ffc46b,0 0 28px rgba(255,196,107,.45)}
.me-ava img{width:100%;height:100%;object-fit:cover}
.me-name{font-family:var(--bpp-nx),sans-serif;font-size:clamp(32px,4.6vw,46px);line-height:.95;color:#fff3dc;margin:0;overflow-wrap:anywhere}
.me-meta{font-size:13.5px;color:#a39a8c;margin-top:8px;display:grid;gap:3px}
.me-bio{margin:0;color:#cfc6b8;font-size:15px;line-height:1.6}
.me-row-medals{display:flex;gap:6px;flex-wrap:wrap}
.me-lab{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8c}
.me-pw{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-top:6px}
.me-pw-n{font-family:var(--bpp-nx),sans-serif;font-size:clamp(68px,10vw,112px);line-height:.85;color:#ffc46b;text-shadow:0 0 30px rgba(255,196,107,.4)}
.me-pw-l{font-family:var(--bpp-nx),sans-serif;font-size:clamp(28px,3.4vw,38px);color:#fff3dc;line-height:1}
.me-next{margin-top:16px;display:grid;gap:8px}
.me-next-bar{height:10px;border-radius:6px;background:rgba(255,200,140,.08);overflow:hidden}
.me-next-bar i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#e8912e,#ffc46b);box-shadow:0 0 12px rgba(255,196,107,.5)}
.me-next-t{font-size:13.5px;color:#cfc6b8}
.me-ladder{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin-top:4px}
.me-ladder span{font-size:10.5px;color:#6f675c;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.me-ladder span.on{color:#ffc46b}
.me-ladder span.cur{color:#fff3dc;font-weight:600}
.me-src{margin-top:22px;display:grid;gap:10px;border-top:1px solid #221e1a;padding-top:18px}
.me-src-row{display:grid;grid-template-columns:1fr auto;gap:12px;font-size:14px;color:#cfc6b8;align-items:baseline}
.me-src-row b{color:#fff3dc;font-weight:600;font-variant-numeric:tabular-nums}
.me-src-row small{display:block;color:#7d7468;font-size:12.5px;margin-top:2px}
.me-src-row.main{font-size:15.5px;color:#ffe3b0}
.me-src-row.main b{color:#ffc46b;font-size:20px}
.me-bars{display:flex;align-items:flex-end;gap:8px;height:52px}
.me-bars div{flex:1;display:grid;gap:4px;justify-items:center;font-size:11px;color:#7d7468}
.me-bars b{display:block;width:100%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#ffc46b,#a8641c)}
.me-h{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8c;margin:0 0 14px;font-weight:500}
.me-sky{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,5fr);gap:24px;align-items:center}
@media (max-width:860px){.me-sky{grid-template-columns:1fr}}
.me-sky svg{width:100%;height:auto;display:block}
.me-sky-t{display:grid;gap:14px}
.me-big{font-family:var(--bpp-nx),sans-serif;font-size:44px;line-height:1;color:#fff3dc}
.me-big small{display:block;font-family:var(--bpp-sans),system-ui,sans-serif;font-size:13.5px;color:#a39a8c;margin-top:6px;line-height:1.4}
.me-chase{padding:14px 16px;border-radius:12px;border:1px solid rgba(255,196,107,.35);background:rgba(255,196,107,.05);font-size:14.5px;line-height:1.55;color:#ece6da}
.me-chase b{color:#ffc46b}
.me-medals{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.me-medal{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;padding:14px;border:1px solid #29241f;border-radius:14px;background:#0f0d10}
.me-medal.on{border-color:rgba(255,196,107,.45);background:linear-gradient(180deg,rgba(255,196,107,.08),rgba(255,196,107,.02))}
.me-medal b{display:block;font-size:15px;color:#fff3dc}
.me-medal.off b{color:#8a8175}
.me-medal span{display:block;font-size:12.5px;line-height:1.45;color:#a39a8c;margin-top:3px}
.me-medal em{font-style:normal;font-size:11.5px;color:#ffc46b}
.me-trail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@media (max-width:860px){.me-trail{grid-template-columns:1fr}}
.me-t{padding:20px;border:1px solid #29241f;border-radius:14px;background:#0f0d10;display:grid;gap:6px;align-content:start}
.me-t b{font-size:15px;color:#fff3dc}
.me-t .n{font-family:var(--bpp-nx),sans-serif;font-size:34px;color:#ffc46b;line-height:1}
.me-t span{font-size:13px;color:#a39a8c}
.me-t a{color:#ffe3b0;font-size:13.5px}
.me-as{display:flex;gap:8px;align-items:center}
.me-as input{background:#121014;border:1px solid #2c2620;border-radius:8px;color:#ece6da;padding:6px 10px;font:inherit;font-size:13.5px;width:160px}
.me-as button{background:#ffc46b;color:#1a1408;border:0;border-radius:8px;padding:7px 12px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer}
@keyframes me-tw{0%,100%{opacity:.55}50%{opacity:1}}
.me-tw{animation:me-tw 4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.me-tw{animation:none}}
`

const n = (v: number) => v.toLocaleString('en-US')
const date = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

export function MeApp() {
  const [me, setMe] = useState<Person | null | undefined>(undefined)
  const [circle, setCircle] = useState<Circle | null>(null)
  const [preview, setPreview] = useState(false)
  const [as, setAs] = useState('')
  const [err, setErr] = useState('')

  const load = (h?: string) => {
    setErr('')
    const q = h ?? new URLSearchParams(location.search).get('as') ?? ''
    fetch(`/api/me${q ? `?as=${encodeURIComponent(q)}` : ''}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        if (j.error) setErr(j.error)
        setMe(j.me ?? null)
        setCircle(j.circle ?? null)
        setPreview(Boolean(j.preview))
      })
      .catch(e => setErr(String(e)))
  }
  useEffect(() => load(), [])

  const go = () => {
    const h = as.trim()
    history.replaceState(null, '', h ? `?as=${encodeURIComponent(h)}` : location.pathname)
    load(h)
  }

  return (
    <main className={`me ${bppFonts}`}>
      <style>{css}</style>
      <div className="me-in">
        <div className="me-top">
          <span>
            <span className="me-chip">HIDDEN · ONLY YOU SEE THIS</span>
            {preview ? '  previewing another member' : ''}
          </span>
          <span className="me-as">
            <input aria-label="Preview the cabinet of" onChange={e => setAs(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} placeholder="preview as handle" value={as} />
            <button onClick={go} type="button">
              Open
            </button>
          </span>
        </div>

        {err && <p style={{ color: '#e0806a' }}>{err}</p>}
        {me === undefined && <p style={{ color: '#a39a8c' }}>Loading…</p>}
        {me === null && !err && (
          <div className="me-card">
            You are not signed in on this browser. <Link href="/articles/me">Sign in</Link>, or preview a member above.
          </div>
        )}
        {me && <Cabinet circle={circle} me={me} />}
      </div>
    </main>
  )
}

function Cabinet({ me, circle }: { me: Person; circle: Circle | null }) {
  const founder = me.annas.length > 0
  const anna = me.annas.slice().sort((a, b) => a.rank - b.rank)[0]
  const pic = anna ? anna.image : me.avatar
  const earned = new Set(me.medals)
  const ordered = MEDALS.slice().sort((a, b) => Number(earned.has(b.id)) - Number(earned.has(a.id)))
  const pw = me.power
  const max = Math.max(1, ...me.solutions.byEpoch.map(e => e.n))
  return (
    <>
      <section className="me-hero">
        <div className="me-card me-pass">
          <div className="me-pass-row">
            <div className={`me-ava${founder ? ' founder' : ''}`}>{pic ? <img alt="" src={pic} /> : <Identicon seed={me.id ?? me.handle} size={88} />}</div>
            <div>
              <h1 className="me-name">{me.name}</h1>
              <div className="me-meta">
                <span>@{me.handle}</span>
                {me.since && <span>In QC since {date(me.since)}</span>}
                {me.x && (
                  <span>
                    X:{' '}
                    <a href={`https://x.com/${me.x}`} rel="noopener" style={{ color: '#ffe3b0' }} target="_blank">
                      @{me.x}
                    </a>
                  </span>
                )}
              </div>
            </div>
          </div>
          {me.bio && <p className="me-bio">{me.bio}</p>}
          {me.medals.length > 0 && (
            <div className="me-row-medals">
              {MEDALS.filter(m => earned.has(m.id)).map(m => (
                <span key={m.id} title={m.name}>
                  <MedalCoin earned medal={m} size={34} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="me-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="me-lab">Power</span>
            {me.solutions.preview && <span className="me-chip">PREVIEW</span>}
          </div>
          <div className="me-pw">
            <span className="me-pw-n">{n(pw.total)}</span>
            <span className="me-pw-l">{pw.level.name}</span>
          </div>
          <div className="me-next">
            <div className="me-next-bar">
              <i style={{ width: `${Math.max(2, pw.level.progress * 100)}%` }} />
            </div>
            <div className="me-next-t">
              {pw.level.next
                ? `${n(pw.level.next.missing)} power to ${pw.level.next.name}: about ${n(Math.ceil(pw.level.next.missing / POWER.solution))} useful solutions.`
                : 'The top of the sky.'}
            </div>
            <div className="me-ladder">
              {LEVELS.map((l, i) => (
                <span className={i === pw.level.index ? 'cur' : i < pw.level.index ? 'on' : ''} key={l.name} title={`${l.name}: ${n(l.at)}`}>
                  {l.name}
                </span>
              ))}
            </div>
          </div>
          <div className="me-src">
            <div className="me-src-row main">
              <span>
                Useful solutions · {n(me.solutions.total)}
                <small>Found in the QC pool and accepted by the network. {POWER.solution} power each.</small>
              </span>
              <b>{n(pw.parts.solutions)}</b>
            </div>
            {me.solutions.byEpoch.length > 0 && (
              <div aria-label="Useful solutions by epoch" className="me-bars" role="img">
                {me.solutions.byEpoch.map(e => (
                  <div key={e.epoch}>
                    <b style={{ height: `${Math.max(3, (e.n / max) * 34)}px` }} />
                    <span>E{e.epoch}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="me-src-row">
              <span>Medals · {me.medals.length}</span>
              <b>{n(pw.parts.medals)}</b>
            </div>
            <div className="me-src-row">
              <span>The Crypt · {me.crypt.articles} {me.crypt.articles === 1 ? 'article' : 'articles'}, {me.crypt.replies} {me.crypt.replies === 1 ? 'reply' : 'replies'}</span>
              <b>{n(pw.parts.crypt)}</b>
            </div>
            <div className="me-src-row">
              <span>BPP-9000 journal</span>
              <b>{n(pw.parts.bpp)}</b>
            </div>
          </div>
        </div>
      </section>

      {circle && circle.count > 1 && <Sky circle={circle} />}

      <section>
        <h2 className="me-h">
          Medals · {me.medals.length} of {MEDALS.length}
        </h2>
        <div className="me-medals">
          {ordered.map(m => {
            const on = earned.has(m.id)
            return (
              <div className={`me-medal ${on ? 'on' : 'off'}`} key={m.id}>
                <MedalCoin earned={on} medal={m} size={56} />
                <div>
                  <b>{m.name}</b>
                  <span>{m.for}</span>
                  {!on && m.opens && <em>opens {m.opens}</em>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="me-h">My trail</h2>
        <div className="me-trail">
          <div className="me-t">
            <b>Mining</b>
            <span className="n">{n(me.solutions.total)}</span>
            <span>useful solutions in the QC pool{me.solutions.preview ? ' (preview until the pool opens)' : ''}</span>
          </div>
          <div className="me-t">
            <b>The Crypt</b>
            <span className="n">{me.crypt.articles}</span>
            <span>
              {me.crypt.articles === 1 ? 'article' : 'articles'} · {me.crypt.replies} {me.crypt.replies === 1 ? 'reply' : 'replies'}
            </span>
            <Link href={`/articles/profile/${me.handle.toLowerCase()}`}>Public profile</Link>
          </div>
          <div className="me-t">
            <b>BPP-9000</b>
            {me.bpp ? (
              <>
                <span className="n">{me.bpp.trades}</span>
                <span>journal trades · since {date(me.bpp.joined)}</span>
              </>
            ) : (
              <span>Not in the experiment yet.</span>
            )}
            <Link href="/bpp9000">Open BPP-9000</Link>
          </div>
        </div>
      </section>
    </>
  )
}

/** Everyone in QC as stars: brightness is power. No names, only that they are here. */
function Sky({ circle }: { circle: Circle }) {
  const W = 560
  const H = 360
  const N = circle.stars.length
  const pts = circle.stars.map((lvl, i) => {
    const t = (i + 0.5) / N
    const a = i * 2.39996
    const r = Math.sqrt(t) * 0.92
    const jx = ((i * 7919) % 97) / 97 - 0.5
    const jy = ((i * 104729) % 89) / 89 - 0.5
    return { x: W / 2 + Math.cos(a) * r * (W / 2 - 20) + jx * 14, y: H / 2 + Math.sin(a) * r * (H / 2 - 18) + jy * 12, lvl }
  })
  const me = pts[circle.me]
  const pct = Math.round(circle.brighter * 100)
  return (
    <section className="me-card">
      <h2 className="me-h">QC right now</h2>
      <div className="me-sky">
        <svg aria-label={`${circle.count} people in QC; your star is marked`} role="img" viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <radialGradient id="me-st">
              <stop offset="0" stopColor="#fff3dc" />
              <stop offset=".4" stopColor="#ffc46b" />
              <stop offset="1" stopColor="#ffc46b" stopOpacity="0" />
            </radialGradient>
          </defs>
          {pts.map((p, i) =>
            i === circle.me ? null : (
              <circle className="me-tw" cx={p.x} cy={p.y} fill="url(#me-st)" key={i} opacity={0.35 + p.lvl * 0.08} r={3 + p.lvl * 1.6} style={{ animationDelay: `${(i % 9) * 0.45}s` }} />
            ),
          )}
          {me && (
            <g>
              <circle cx={me.x} cy={me.y} fill="none" r={14 + me.lvl * 1.6} stroke="#ffc46b" strokeOpacity=".7" strokeWidth="1.2" />
              <circle cx={me.x} cy={me.y} fill="url(#me-st)" r={6 + me.lvl * 1.8} />
              <text fill="#ffe3b0" fontSize="13" textAnchor="middle" x={me.x} y={me.y - 22 - me.lvl * 1.6}>
                you
              </text>
            </g>
          )}
        </svg>
        <div className="me-sky-t">
          <div className="me-big">
            {circle.count}
            <small>people hold a key to QC</small>
          </div>
          <div className="me-big">
            {circle.active}
            <small>found useful solutions this epoch</small>
          </div>
          <div className="me-chase">
            Your star is brighter than <b>{pct}%</b> of QC.{' '}
            {circle.above ? (
              <>
                The next one up is a {circle.above.level}, <b>{n(circle.above.gap)}</b> power ahead: about {n(Math.ceil(circle.above.gap / POWER.solution))} useful solutions.
              </>
            ) : (
              <>No one in QC shines brighter right now.</>
            )}
            {circle.below ? ` The one behind you is ${n(circle.below.gap)} power back.` : ''}
          </div>
        </div>
      </div>
    </section>
  )
}
