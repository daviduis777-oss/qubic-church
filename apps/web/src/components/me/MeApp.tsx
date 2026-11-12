'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { bppFonts } from '@/components/bpp/fonts'
import { Identicon } from '@/components/church/forum/Avatar'
import { squareJpeg } from '@/components/church/forum/Cabinet'
import { LEVELS, MEDALS, POWER } from '@/lib/me/medals'
import type { Circle, Person } from '@/lib/me/me'
import { MedalCoin } from './Medal'

const css = `
.me{min-height:100svh;margin-bottom:-3rem;background:radial-gradient(70% 45% at 70% 0%,rgba(255,196,107,.08),transparent 70%),#08080a;color:#ece6da;font-family:var(--bpp-sans),system-ui,sans-serif;padding:96px 16px 128px}
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

.me-ava-w{position:relative;display:grid;gap:8px;justify-items:center}
.me-ava-b{background:none;border:0;padding:0;cursor:pointer;border-radius:50%}
.me-ava-b:focus-visible{outline:2px solid #ffc46b;outline-offset:4px}
.me-ava-edit{display:flex;gap:10px;font-size:12.5px}
.me-ava-edit button{background:none;border:0;color:#ffe3b0;font:inherit;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px}
.me-ava-edit button:disabled{opacity:.5;cursor:wait}
.me-ava.ring-flame{box-shadow:0 0 0 3px #ff8a3d,0 0 24px rgba(255,138,61,.5)}
.me-streak{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:rgba(255,138,61,.1);border:1px solid rgba(255,138,61,.35);color:#ffb27a;font-size:13.5px;width:max-content}
.me-streak b{font-family:var(--bpp-nx),sans-serif;font-size:20px;color:#ffc46b;font-weight:400}
.me-road{overflow-x:auto;padding-bottom:6px}
.me-road-in{min-width:900px;position:relative}
.me-road svg{display:block;width:100%;height:120px}
.me-road-cols{display:grid;grid-template-columns:repeat(9,1fr);gap:8px}
.me-road-c{display:grid;gap:4px;align-content:start;text-align:center;padding:0 2px}
.me-road-c b{font-size:14px;color:#8a8175;font-weight:600}
.me-road-c .at{font-size:12px;color:#6f675c;font-variant-numeric:tabular-nums}
.me-road-c p{margin:4px 0 0;font-size:12px;line-height:1.45;color:#6f675c}
.me-road-c.done b{color:#ffc46b}
.me-road-c.done p{color:#a39a8c}
.me-road-c.cur b{color:#fff3dc}
.me-road-c.cur p{color:#ece6da}
.me-road-c.nxt p{color:#ffe3b0}
.me-road-c .tag{justify-self:center;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:999px;background:#ffc46b;color:#1a1408;font-weight:700}
.me-road-c .tag.n{background:none;border:1px solid rgba(255,196,107,.5);color:#ffc46b}
.me-steps{display:grid;gap:10px}
.me-step{display:grid;grid-template-columns:30px 1fr auto;gap:14px;align-items:center;padding:14px 16px;border:1px solid #29241f;border-radius:14px;background:#0f0d10}
.me-step.done{opacity:.62}
.me-step.now{border-color:rgba(255,196,107,.55);background:linear-gradient(90deg,rgba(255,196,107,.09),rgba(255,196,107,.01))}
.me-step i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:15px;border:1.5px solid #3a3229;color:#8a8175}
.me-step.done i{background:#ffc46b;border-color:#ffc46b;color:#1a1408}
.me-step.now i{border-color:#ffc46b;color:#ffc46b}
.me-step b{display:block;font-size:15px;color:#fff3dc;font-weight:600}
.me-step span{display:block;font-size:13px;color:#a39a8c;margin-top:2px;line-height:1.45}
.me-step em{font-style:normal;font-size:13px;color:#ffc46b;white-space:nowrap;text-align:right}
.me-step a{color:#ffe3b0}

.me-folds{display:grid;gap:10px}
.me-fold{border:1px solid #29241f;border-radius:16px;background:linear-gradient(180deg,#121014,#0c0b0d);overflow:hidden;transition:border-color .2s}
.me-fold.open{border-color:rgba(255,196,107,.4)}
.me-fold-h{width:100%;display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;padding:18px 22px;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer}
.me-fold-h:hover .me-fold-t,.me-fold.open .me-fold-t{color:#ffe3b0}
.me-fold-h:focus-visible{outline:2px solid #ffc46b;outline-offset:-2px;border-radius:16px}
.me-fold-t{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8c;white-space:nowrap}
.me-fold-s{font-size:14px;color:#cfc6b8;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.me-fold-s b{color:#ffc46b;font-weight:600}
.me-fold-coins{display:inline-flex;align-items:center;gap:4px}
.me-fold-coins span{margin-left:8px}
.me-fold-c{color:#a39a8c;transition:transform .25s}
.me-fold.open .me-fold-c{transform:rotate(180deg);color:#ffc46b}
.me-fold-b{display:grid;grid-template-rows:0fr;transition:grid-template-rows .3s ease}
.me-fold.open .me-fold-b{grid-template-rows:1fr}
.me-fold-in{overflow:hidden}
.me-fold-pad{padding:4px 22px 22px}
@media (max-width:600px){.me-fold-h{grid-template-columns:1fr auto;gap:6px 12px;padding:16px}.me-fold-s{grid-column:1/2;grid-row:2;white-space:normal}.me-fold-pad{padding:4px 16px 16px}}
@media (prefers-reduced-motion:reduce){.me-fold-b,.me-fold-c{transition:none}}
@keyframes me-pulse{0%,100%{r:13}50%{r:17}}
@keyframes me-tw{0%,100%{opacity:.55}50%{opacity:1}}
.me-tw{animation:me-tw 4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.me-tw{animation:none}}
`

const n = (v: number) => v.toLocaleString('en-US')
const date = (s: string | null) =>
  s
    ? new Date(s).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

export function MeApp() {
  const [me, setMe] = useState<Person | null | undefined>(undefined)
  const [circle, setCircle] = useState<Circle | null>(null)
  const [preview, setPreview] = useState(false)
  const [as, setAs] = useState('')
  const [err, setErr] = useState('')

  const load = (h?: string) => {
    setErr('')
    const q = h ?? new URLSearchParams(location.search).get('as') ?? ''
    fetch(`/api/me${q ? `?as=${encodeURIComponent(q)}` : ''}`, {
      cache: 'no-store',
    })
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
            <input
              aria-label="Preview the cabinet of"
              onChange={e => setAs(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && go()}
              placeholder="preview as handle"
              value={as}
            />
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
        {me && <Cabinet circle={circle} me={me} onChange={() => load()} self={!preview} />}
      </div>
    </main>
  )
}

function Cabinet({ me, circle, self, onChange }: { me: Person; circle: Circle | null; self: boolean; onChange: () => void }) {
  const founder = me.annas.length > 0
  const anna = me.annas.slice().sort((a, b) => a.rank - b.rank)[0]
  const pic = me.avatar ?? anna?.image
  const earned = new Set(me.medals)
  const ordered = MEDALS.slice().sort((a, b) => Number(earned.has(b.id)) - Number(earned.has(a.id)))
  const pw = me.power
  const max = Math.max(1, ...me.solutions.byEpoch.map(e => e.n))
  const [open, setOpen] = useState<string | null>(null)
  const toggle = (id: string) => setOpen(o => (o === id ? null : id))
  const steps = stepList(me)
  const stepsDone = steps.filter(x => x.done).length
  const nextStep = steps.find(x => !x.done)
  return (
    <>
      <section className="me-hero">
        <div className="me-card me-pass">
          <div className="me-pass-row">
            <AvatarEdit anna={anna?.image} founder={founder} handle={me.handle} id={me.id} level={pw.level.index} onChange={onChange} pic={pic} self={self} />
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
          {streakOf(me) > 1 && (
            <span className="me-streak" title="Epochs in a row with at least one useful solution">
              <b>{streakOf(me)}</b> epochs in a row with a solution
            </span>
          )}
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
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
              <span>
                The Crypt · {me.crypt.articles} {me.crypt.articles === 1 ? 'article' : 'articles'}, {me.crypt.replies}{' '}
                {me.crypt.replies === 1 ? 'reply' : 'replies'}
              </span>
              <b>{n(pw.parts.crypt)}</b>
            </div>
            <div className="me-src-row">
              <span>BPP-9000 journal</span>
              <b>{n(pw.parts.bpp)}</b>
            </div>
          </div>
        </div>
      </section>

      <div className="me-folds">
        <Fold
          id="road"
          onToggle={toggle}
          open={open === 'road'}
          summary={
            <>
              {pw.level.name}
              {pw.level.next ? (
                <>
                  {' '}
                  · next: <b>{pw.level.next.name}</b>, {n(pw.level.next.missing)} power to go
                </>
              ) : (
                ' · the top'
              )}
            </>
          }
          title="The road to Pulsar"
        >
          <Road me={me} />
        </Fold>
        <Fold
          id="grow"
          onToggle={toggle}
          open={open === 'grow'}
          summary={
            <>
              {stepsDone} of {steps.length} done
              {nextStep ? (
                <>
                  {' '}
                  · next: <b>{nextStep.t}</b>
                </>
              ) : (
                ''
              )}
            </>
          }
          title="How to grow"
        >
          <Steps steps={steps} />
        </Fold>
        {circle && circle.count > 1 && (
          <Fold
            id="sky"
            onToggle={toggle}
            open={open === 'sky'}
            summary={
              <>
                {circle.count} people · you shine brighter than <b>{Math.round(circle.brighter * 100)}%</b>
              </>
            }
            title="QC right now"
          >
            <Sky circle={circle} />
          </Fold>
        )}
        <Fold
          id="medals"
          onToggle={toggle}
          open={open === 'medals'}
          summary={
            <span className="me-fold-coins">
              {MEDALS.filter(m => earned.has(m.id)).map(m => (
                <MedalCoin earned key={m.id} medal={m} size={22} />
              ))}
              <span>
                {me.medals.length} of {MEDALS.length}
              </span>
            </span>
          }
          title="Medals"
        >
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
        </Fold>
      </div>
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
    return {
      x: W / 2 + Math.cos(a) * r * (W / 2 - 20) + jx * 14,
      y: H / 2 + Math.sin(a) * r * (H / 2 - 18) + jy * 12,
      lvl,
    }
  })
  const me = pts[circle.me]
  const pct = Math.round(circle.brighter * 100)
  return (
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
            <circle
              className="me-tw"
              cx={p.x}
              cy={p.y}
              fill="url(#me-st)"
              key={i}
              opacity={0.35 + p.lvl * 0.08}
              r={3 + p.lvl * 1.6}
              style={{ animationDelay: `${(i % 9) * 0.45}s` }}
            />
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
          <small>
            found useful solutions this epoch
            {circle.preview ? ' (preview)' : ''}
          </small>
        </div>
        <div className="me-chase">
          Your star is brighter than <b>{pct}%</b> of QC.{' '}
          {circle.above ? (
            <>
              The next one up is a {circle.above.level}, <b>{n(circle.above.gap)}</b> power ahead: about {n(Math.ceil(circle.above.gap / POWER.solution))}{' '}
              useful solutions.
            </>
          ) : (
            <>No one in QC shines brighter right now.</>
          )}
          {circle.below ? ` The one behind you is ${n(circle.below.gap)} power back.` : ''}
        </div>
      </div>
    </div>
  )
}

/** Epochs in a row, up to the latest, with at least one useful solution. */
function streakOf(me: Person) {
  let k = 0
  for (let i = me.solutions.byEpoch.length - 1; i >= 0 && me.solutions.byEpoch[i]!.n > 0; i--) k++
  return k
}

/** The picture: your own upload wins, then your Anna, then the pixel avatar from your key. Only on your own cabinet can you change it. */
function AvatarEdit(props: { pic?: string; anna?: string; founder: boolean; level: number; handle: string; id?: string; self: boolean; onChange: () => void }) {
  const { pic, anna, founder, level, handle, id, self, onChange } = props
  const file = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const save = async (avatar: string | null) => {
    setBusy(true)
    setMsg('')
    try {
      // The profile route rewrites every field, so send back what is there now.
      const cur = await fetch('/api/forum/profile', { cache: 'no-store' }).then(r => r.json())
      if (cur.error) throw new Error(cur.error)
      const p = cur.profile ?? {}
      const r = await fetch('/api/forum/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: p.x ?? '',
          signature: p.signature ?? '',
          bio: p.bio ?? '',
          ...(avatar ? { avatar } : { removeAvatar: true }),
        }),
      }).then(r => r.json())
      if (r.error) throw new Error(r.error)
      onChange()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const ring = founder ? ' founder' : level >= 2 ? ' ring-flame' : ''
  const face = <div className={`me-ava${ring}`}>{pic ? <img alt="" src={pic} /> : <Identicon seed={id ?? handle} size={88} />}</div>
  if (!self) return face
  return (
    <div className="me-ava-w">
      <button
        aria-label="Change your picture"
        className="me-ava-b"
        disabled={busy}
        onClick={() => file.current?.click()}
        title="Change your picture"
        type="button"
      >
        {face}
      </button>
      <input
        accept="image/*"
        hidden
        onChange={async e => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) save(await squareJpeg(f).catch(() => null))
        }}
        ref={file}
        type="file"
      />
      <div className="me-ava-edit">
        <button disabled={busy} onClick={() => file.current?.click()} type="button">
          {busy ? 'Saving…' : 'Change'}
        </button>
        {anna && (
          <button disabled={busy} onClick={async () => save(await squareJpeg(await fetch(anna).then(r => r.blob()), 256))} type="button">
            Use my Anna
          </button>
        )}
        {pic && !busy && (
          <button onClick={() => save(null)} type="button">
            Remove
          </button>
        )}
      </div>
      {msg && <span style={{ color: '#e0806a', fontSize: 12 }}>{msg}</span>}
    </div>
  )
}

/** The whole climb from Spark to Pulsar: where you are, what each level gives, how far in solutions. */
function Road({ me }: { me: Person }) {
  const cur = me.power.level.index
  const W = 900
  const H = 120
  const col = W / LEVELS.length
  // a slow climb: each level sits a little higher than the last
  const pt = (i: number) => ({
    x: col * i + col / 2,
    y: H - 22 - (i / (LEVELS.length - 1)) * (H - 50),
  })
  const path = LEVELS.map((_, i) => pt(i))
  const d = path.map((p, i) => (i ? `L${p.x},${p.y}` : `M${p.x},${p.y}`)).join(' ')
  // how far along the segment from the current level to the next
  const here = (() => {
    const a = pt(cur)
    const b = path[cur + 1]
    if (!b) return a
    const t = me.power.level.progress
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  })()
  const done =
    path
      .slice(0, cur + 1)
      .map((p, i) => (i ? `L${p.x},${p.y}` : `M${p.x},${p.y}`))
      .join(' ') + ` L${here.x},${here.y}`
  return (
    <div className="me-road">
      <div className="me-road-in">
        <svg aria-hidden preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <radialGradient id="me-rd">
              <stop offset="0" stopColor="#fff3dc" />
              <stop offset=".45" stopColor="#ffc46b" />
              <stop offset="1" stopColor="#ffc46b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={d} fill="none" stroke="rgba(255,200,140,.14)" strokeDasharray="3 5" strokeWidth="2" />
          <path d={done} fill="none" stroke="#ffc46b" strokeLinecap="round" strokeWidth="3" />
          {path.map((p, i) => (
            <circle
              cx={p.x}
              cy={p.y}
              fill={i <= cur ? 'url(#me-rd)' : '#1c1814'}
              key={i}
              r={5 + i * 1.3}
              stroke={i <= cur ? 'none' : 'rgba(255,200,140,.25)'}
            />
          ))}
          <circle cx={here.x} cy={here.y} fill="none" r="13" stroke="#ffc46b" strokeWidth="1.5" style={{ animation: 'me-pulse 2.4s ease-in-out infinite' }} />
        </svg>
        <div className="me-road-cols">
          {LEVELS.map((l, i) => {
            const cls = i < cur ? 'done' : i === cur ? 'cur' : i === cur + 1 ? 'nxt' : ''
            return (
              <div className={`me-road-c ${cls}`} key={l.name}>
                {i === cur && <span className="tag">You</span>}
                {i === cur + 1 && <span className="tag n">Next</span>}
                <b>{l.name}</b>
                <span className="at">{l.at ? `${n(l.at)} power` : 'start'}</span>
                <p>{l.gives}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** What to do next, in the order a newcomer meets it. The first open step is lit. */
type Step = { t: string; s: React.ReactNode; done: boolean; gain: string }

function stepList(me: Person): Step[] {
  const live = !me.solutions.preview
  const steps = [
    {
      t: 'Get your key',
      s: 'A Qubic wallet or a secret word. You have it.',
      done: true,
      gain: '',
    },
    {
      t: 'Join the QC pool',
      s: live ? 'Point your rig at the QC pool. Only solutions found here count.' : 'Opens soon. Only solutions found in the QC pool count toward your power.',
      done: live && me.solutions.total > 0,
      gain: live ? '' : 'soon',
    },
    {
      t: 'Find your first useful solution',
      s: 'A network your rig trained that the Qubic network accepted.',
      done: live && me.solutions.total > 0,
      gain: `+${POWER.solution} each`,
    },
    {
      t: 'Mine every epoch',
      s: 'Keep the streak: one solution a week keeps your flame burning.',
      done: live && streakOf(me) >= 2,
      gain: 'streak',
    },
    {
      t: 'Speak in the Crypt',
      s: (
        <>
          Write an article or answer one. <Link href="/articles">Open the Crypt</Link>
        </>
      ),
      done: me.crypt.articles + me.crypt.replies > 0,
      gain: `+${POWER.article} / +${POWER.reply}`,
    },
    {
      t: 'Keep a BPP-9000 journal',
      s: (
        <>
          Trade beside the network and see who calls the hour better. <Link href="/bpp9000">Open BPP-9000</Link>
        </>
      ),
      done: Boolean(me.bpp && me.bpp.trades > 0),
      gain: `+${POWER.trade} a trade`,
    },
  ]
  return steps
}

function Steps({ steps }: { steps: Step[] }) {
  const first = steps.findIndex(x => !x.done)
  return (
    <div className="me-steps">
      {steps.map((x, i) => (
        <div className={`me-step${x.done ? ' done' : i === first ? ' now' : ''}`} key={x.t}>
          <i>{x.done ? '✓' : i + 1}</i>
          <div>
            <b>{x.t}</b>
            <span>{x.s}</span>
          </div>
          <em>{x.done ? 'done' : x.gain}</em>
        </div>
      ))}
    </div>
  )
}

/** One fold of the cabinet: a line with the gist, opened one at a time so the page stays short. */
function Fold(props: { id: string; title: string; summary: React.ReactNode; open: boolean; onToggle: (id: string) => void; children: React.ReactNode }) {
  const { id, title, summary, open, onToggle, children } = props
  return (
    <section className={`me-fold${open ? ' open' : ''}`}>
      <button aria-controls={`fold-${id}`} aria-expanded={open} className="me-fold-h" onClick={() => onToggle(id)} type="button">
        <span className="me-fold-t">{title}</span>
        <span className="me-fold-s">{summary}</span>
        <svg aria-hidden className="me-fold-c" height="14" viewBox="0 0 14 14" width="14">
          <path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      </button>
      <div className="me-fold-b" id={`fold-${id}`} inert={!open}>
        <div className="me-fold-in">
          <div className="me-fold-pad">{children}</div>
        </div>
      </div>
    </section>
  )
}
