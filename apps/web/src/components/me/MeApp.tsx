'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { bppFonts } from '@/components/bpp/fonts'
import { Identicon } from '@/components/church/forum/Avatar'
import { MEDALS, STAGES } from '@/lib/me/medals'
import type { Person } from '@/lib/me/me'
import { MedalCoin } from './Medal'

const css = `
.me{min-height:100svh;background:radial-gradient(70% 45% at 70% 0%,rgba(255,196,107,.08),transparent 70%),#08080a;color:#ece6da;font-family:var(--bpp-sans),system-ui,sans-serif;padding:96px 16px 80px}
.me-in{max-width:1080px;margin:0 auto;display:grid;gap:28px}
.me-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;font-size:14px;color:#a39a8c}
.me-top a{color:#ffe3b0}
.me-chip{display:inline-block;padding:3px 10px;border:1px solid rgba(255,196,107,.4);border-radius:999px;color:#ffc46b;font-size:12px;letter-spacing:.06em}
.me-hero{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:20px}
@media (max-width:860px){.me-hero{grid-template-columns:1fr}}
.me-card{border:1px solid #29241f;border-radius:16px;background:linear-gradient(180deg,#121014,#0c0b0d);padding:24px}
.me-pass{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center}
.me-ava{width:132px;height:132px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#15120f;box-shadow:0 0 0 2px #2c2620}
.me-ava.founder{box-shadow:0 0 0 3px #ffc46b,0 0 28px rgba(255,196,107,.45)}
.me-ava img{width:100%;height:100%;object-fit:cover}
.me-name{font-family:var(--bpp-nx),sans-serif;font-size:clamp(34px,5vw,48px);line-height:.95;color:#fff3dc;margin:0}
.me-meta{font-size:13.5px;color:#a39a8c;margin-top:8px;display:grid;gap:3px}
.me-founder{color:#ffc46b;font-size:13px;margin-top:8px}
.me-bio{grid-column:1/-1;margin:4px 0 0;color:#cfc6b8;font-size:15px;line-height:1.6}
.me-sol-n{font-family:var(--bpp-nx),sans-serif;font-size:clamp(72px,11vw,120px);line-height:.85;color:#ffc46b;text-shadow:0 0 30px rgba(255,196,107,.4)}
.me-sol-l{font-size:15px;color:#ffe3b0;margin-top:8px}
.me-sol-sub{font-size:13.5px;color:#a39a8c;margin-top:4px}
.me-stage{margin-top:18px;display:grid;gap:8px}
.me-stage-bar{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.me-stage-bar i{height:8px;border-radius:6px;background:rgba(255,200,140,.08)}
.me-stage-bar i.on{background:linear-gradient(90deg,#e8912e,#ffc46b);box-shadow:0 0 12px rgba(255,196,107,.5)}
.me-stage-names{display:grid;grid-template-columns:repeat(5,1fr);font-size:11.5px;color:#7d7468}
.me-stage-names span.on{color:#ffe3b0}
.me-bars{display:flex;align-items:flex-end;gap:10px;height:70px;margin-top:18px}
.me-bars div{flex:1;display:grid;gap:4px;justify-items:center;font-size:11px;color:#7d7468}
.me-bars b{display:block;width:100%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#ffc46b,#a8641c)}
.me-h{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8c;margin:0 0 14px}
.me-medals{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.me-medal{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;padding:14px;border:1px solid #29241f;border-radius:14px;background:#0f0d10}
.me-medal.on{border-color:rgba(255,196,107,.45);background:linear-gradient(180deg,rgba(255,196,107,.08),rgba(255,196,107,.02))}
.me-medal b{display:block;font-size:15px;color:#fff3dc}
.me-medal.off b{color:#8a8175}
.me-medal span{display:block;font-size:12.5px;line-height:1.45;color:#a39a8c;margin-top:3px}
.me-medal em{font-style:normal;font-size:11.5px;color:#ffc46b}
.me-trail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@media (max-width:860px){.me-trail{grid-template-columns:1fr}}
.me-t{padding:20px;border:1px solid #29241f;border-radius:14px;background:#0f0d10;display:grid;gap:6px}
.me-t b{font-size:15px;color:#fff3dc}
.me-t .n{font-family:var(--bpp-nx),sans-serif;font-size:34px;color:#ffc46b;line-height:1}
.me-t span{font-size:13px;color:#a39a8c}
.me-t a{color:#ffe3b0;font-size:13.5px}
.me-annas{display:flex;gap:12px;flex-wrap:wrap}
.me-anna{width:120px;display:grid;gap:6px;font-size:12.5px;color:#cfc6b8;text-align:center}
.me-anna img{width:120px;height:120px;border-radius:12px;object-fit:cover;box-shadow:0 0 0 1px rgba(255,196,107,.4)}
.me-as{display:flex;gap:8px;align-items:center}
.me-as input{background:#121014;border:1px solid #2c2620;border-radius:8px;color:#ece6da;padding:6px 10px;font:inherit;font-size:13.5px;width:160px}
.me-as button{background:#ffc46b;color:#1a1408;border:0;border-radius:8px;padding:7px 12px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer}
`

const date = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

export function MeApp() {
  const [me, setMe] = useState<Person | null | undefined>(undefined)
  const [preview, setPreview] = useState(false)
  const [as, setAs] = useState('')
  const [err, setErr] = useState('')

  const load = (h?: string) => {
    setErr('')
    const q = h ?? (typeof window !== 'undefined' ? new URLSearchParams(location.search).get('as') ?? '' : '')
    fetch(`/api/me${q ? `?as=${encodeURIComponent(q)}` : ''}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        if (j.error) setErr(j.error)
        setMe(j.me ?? null)
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
            <span className="me-chip">HIDDEN · ONLY YOU SEE THIS</span> {preview ? ' previewing another member' : ''}
          </span>
          <span className="me-as">
            <input aria-label="Preview the cabinet of" onChange={e => setAs(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} placeholder="preview as handle" value={as} />
            <button onClick={go} type="button">
              Open
            </button>
            <Link href="/me/people">People</Link>
          </span>
        </div>

        {err && <p style={{ color: '#e0806a' }}>{err}</p>}
        {me === undefined && <p style={{ color: '#a39a8c' }}>Loading…</p>}
        {me === null && !err && (
          <div className="me-card">
            You are not signed in with a key on this browser. <Link href="/articles/me">Sign in</Link>, or preview a member above.
          </div>
        )}
        {me && <Cabinet me={me} />}
      </div>
    </main>
  )
}

function Cabinet({ me }: { me: Person }) {
  const founder = me.annas.length > 0
  const anna = me.annas.slice().sort((a, b) => a.rank - b.rank)[0]
  const pic = anna ? anna.image : me.avatar
  const max = Math.max(1, ...me.solutions.byEpoch.map(e => e.n))
  const earned = new Set(me.medals)
  const ordered = MEDALS.slice().sort((a, b) => Number(earned.has(b.id)) - Number(earned.has(a.id)))
  return (
    <>
      <section className="me-hero">
        <div className="me-card me-pass">
          <div className={`me-ava${founder ? ' founder' : ''}`}>{pic ? <img alt="" src={pic} /> : <Identicon seed={me.id ?? me.handle} size={96} />}</div>
          <div>
            <h1 className="me-name">{me.name}</h1>
            <div className="me-meta">
              <span>
                @{me.handle} · signed in with {me.auth === 'qubic' ? 'a Qubic wallet' : me.auth === 'trip' ? 'a secret word' : 'X'}
              </span>
              {me.since && <span>Here since {date(me.since)}</span>}
              {me.x && (
                <span>
                  X: <a href={`https://x.com/${me.x}`} rel="noopener" style={{ color: '#ffe3b0' }} target="_blank">@{me.x}</a>
                </span>
              )}
            </div>
            {founder && anna && (
              <div className="me-founder">
                Founder · Anna #{String(anna.id).padStart(3, '0')} · rank {anna.rank}
              </div>
            )}
          </div>
          {me.bio && <p className="me-bio">{me.bio}</p>}
        </div>

        <div className="me-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="me-h" style={{ margin: 0 }}>
              Useful solutions
            </span>
            {me.solutions.preview && <span className="me-chip">PREVIEW</span>}
          </div>
          <div className="me-sol-n">{me.solutions.total.toLocaleString('en-US')}</div>
          <div className="me-sol-l">networks you found that the Qubic network accepted</div>
          <div className="me-sol-sub">
            +{me.solutions.epoch} this epoch{me.stage.next ? ` · ${me.stage.next.missing} more to ${me.stage.next.name}` : ' · the top stage'}
          </div>
          <div className="me-stage">
            <div className="me-stage-bar">
              {STAGES.map((s, i) => (
                <i className={i <= me.stage.index ? 'on' : ''} key={s.name} />
              ))}
            </div>
            <div className="me-stage-names">
              {STAGES.map((s, i) => (
                <span className={i === me.stage.index ? 'on' : ''} key={s.name}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
          {me.solutions.byEpoch.length > 0 && (
            <div aria-label="Useful solutions by epoch" className="me-bars" role="img">
              {me.solutions.byEpoch.map(e => (
                <div key={e.epoch}>
                  <b style={{ height: `${Math.max(4, (e.n / max) * 48)}px` }} />
                  <span>E{e.epoch}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
            <b>The Crypt</b>
            <span className="n">{me.crypt.articles}</span>
            <span>
              {me.crypt.articles === 1 ? 'article' : 'articles'} · {me.crypt.replies} {me.crypt.replies === 1 ? 'reply' : 'replies'}{me.crypt.rank ? ` · ${me.crypt.rank}` : ''}
            </span>
            <Link href={`/articles/profile/${me.handle.toLowerCase()}`}>Public profile</Link>
          </div>
          <div className="me-t">
            <b>BPP-9000</b>
            {me.bpp ? (
              <>
                <span className="n">{me.bpp.trades}</span>
                <span>
                  journal trades · joined {date(me.bpp.joined)}
                  {me.bpp.winRate != null ? ` · ${(me.bpp.winRate * 100).toFixed(0)}% won` : ''}
                </span>
              </>
            ) : (
              <span>Not in the experiment yet.</span>
            )}
            <Link href="/bpp9000">Open BPP-9000</Link>
          </div>
          <div className="me-t">
            <b>Mining</b>
            <span className="n">—</span>
            <span>Your power and solutions appear here when the pool opens.</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="me-h">Anna</h2>
        {me.annas.length ? (
          <div className="me-annas">
            {me.annas.map(a => (
              <div className="me-anna" key={a.id}>
                <img alt={`Anna #${a.id}`} src={a.image} />
                <span>
                  #{String(a.id).padStart(3, '0')} · rank {a.rank}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="me-card" style={{ fontSize: 14.5, color: '#cfc6b8' }}>
            {me.auth === 'qubic' ? 'No Anna on this wallet.' : 'Sign in with a Qubic wallet to show the Annas you hold.'} Each of the 200 Annas makes its holder a founder of Qubic
            Church: a gold ring and the founder mark wherever your name appears. <Link href="/nfts" style={{ color: '#ffe3b0' }}>The collection</Link>
          </div>
        )}
      </section>
    </>
  )
}
