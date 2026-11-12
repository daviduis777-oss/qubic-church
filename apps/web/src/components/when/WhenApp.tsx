'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { bppFonts } from '@/components/bpp/fonts'
import { epochAt, epochStart, type Kind, KINDS, MOMENTS, type Moment, WEEK, WEN } from '@/lib/when'

const css = `
.wn{min-height:100svh;margin-bottom:-3rem;background:radial-gradient(60% 40% at 50% 0%,rgba(255,196,107,.09),transparent 70%),#08080a;color:#ece6da;font-family:var(--bpp-sans),system-ui,sans-serif;padding:92px 16px 128px}
.wn-in{max-width:1040px;margin:0 auto;display:grid;gap:56px}
.wn-chip{display:inline-block;padding:3px 10px;border:1px solid rgba(255,196,107,.4);border-radius:999px;color:#ffc46b;font-size:12px;letter-spacing:.06em}
.wn-hero{text-align:center;display:grid;gap:14px;justify-items:center}
.wn-h{font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:clamp(96px,18vw,200px);line-height:.8;margin:6px 0 0;color:#ffc46b;text-shadow:0 0 4px #ffd08a,0 0 22px rgba(255,196,107,.6),0 0 70px rgba(232,145,46,.4);letter-spacing:.02em}
.wn-sub{font-size:clamp(16px,2vw,19px);color:#cfc6b8;max-width:48ch;line-height:1.55;margin:0}
.wn-stats{display:flex;gap:22px;flex-wrap:wrap;justify-content:center;font-size:13.5px;color:#a39a8c}
.wn-stats b{font-family:var(--bpp-nx),sans-serif;font-size:24px;color:#fff3dc;font-weight:400;margin-right:6px}
.wn-next{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@media (max-width:820px){.wn-next{grid-template-columns:1fr}}
.wn-card{border:1px solid #29241f;border-radius:16px;background:linear-gradient(180deg,#121014,#0c0b0d);padding:22px;display:grid;gap:8px;align-content:start}
.wn-card.first{border-color:rgba(255,196,107,.55);box-shadow:0 0 40px rgba(255,196,107,.08)}
.wn-card small{font-size:12.5px;color:#a39a8c;letter-spacing:.04em}
.wn-card b{font-size:17px;color:#fff3dc;font-weight:600;line-height:1.3}
.wn-count{font-family:var(--bpp-nx),sans-serif;font-size:clamp(40px,5.4vw,56px);line-height:1;color:#ffc46b;font-variant-numeric:tabular-nums}
.wn-count span{font-size:.45em;color:#a39a8c;margin:0 6px 0 2px}
.wn-card p{margin:0;font-size:13.5px;color:#a39a8c;line-height:1.5}
.wn-epoch{display:grid;gap:10px}
.wn-epoch-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;font-size:14px;color:#a39a8c}
.wn-epoch-top b{font-family:var(--bpp-nx),sans-serif;font-size:30px;color:#fff3dc;font-weight:400}
.wn-bar{height:10px;border-radius:6px;background:rgba(255,200,140,.08);overflow:hidden}
.wn-bar i{display:block;height:100%;background:linear-gradient(90deg,#e8912e,#ffc46b);box-shadow:0 0 12px rgba(255,196,107,.5)}
.wn-weeks{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:4px}
.wn-weeks div{display:grid;gap:4px;justify-items:center;font-size:11px;color:#6f675c}
.wn-weeks i{width:100%;height:6px;border-radius:4px;background:rgba(255,200,140,.08)}
.wn-weeks .past i{background:rgba(255,196,107,.35)}
.wn-weeks .now i{background:#ffc46b}
.wn-weeks .now{color:#fff3dc}
.wn-weeks .mark{color:#ffc46b}
.wn-weeks .mark i{background:repeating-linear-gradient(90deg,#ffc46b 0 4px,transparent 4px 7px)}
.wn-h2{font-family:var(--bpp-nx),sans-serif;font-weight:400;font-size:clamp(34px,5vw,48px);color:#fff3dc;margin:0 0 6px;line-height:1}
.wn-lead{margin:0 0 22px;color:#a39a8c;font-size:15px;max-width:62ch;line-height:1.55}
.wn-bar2{position:sticky;top:64px;z-index:5;display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 0;margin-bottom:12px;background:linear-gradient(180deg,#08080a 70%,rgba(8,8,10,0))}
.wn-bar2 button{display:inline-flex;align-items:center;gap:7px;background:#121014;border:1px solid #2c2620;color:#cfc6b8;border-radius:999px;padding:6px 13px;font:inherit;font-size:13px;cursor:pointer}
.wn-bar2 button i{width:8px;height:8px;border-radius:50%}
.wn-bar2 button[aria-pressed=true]{background:#ffc46b;color:#1a1408;border-color:#ffc46b;font-weight:600}
.wn-bar2 .sep{width:1px;height:20px;background:#2c2620;margin:0 4px}
.wn-bar2 a{font-size:13px;color:#a39a8c;padding:4px 6px}
.wn-bar2 a:hover{color:#ffe3b0}
.wn-line{position:relative;padding-left:40px}
.wn-line:before{content:"";position:absolute;left:13px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,rgba(255,200,140,.22) 0,rgba(255,200,140,.22) var(--now),#ffc46b var(--now),#a8641c 100%)}
.wn-year{position:relative;margin:34px 0 18px;display:flex;align-items:baseline;gap:14px;scroll-margin-top:130px}
.wn-year b{font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:clamp(56px,9vw,96px);line-height:.8;color:transparent;-webkit-text-stroke:1px rgba(255,196,107,.55)}
.wn-year span{font-size:13px;color:#7d7468}
.wn-m{position:relative;margin:0 0 14px}
.wn-dot{position:absolute;left:-33px;top:7px;width:12px;height:12px;border-radius:50%;background:var(--c);box-shadow:0 0 0 3px #08080a}
.wn-m.ahead .wn-dot{background:#08080a;border:2px solid var(--c);box-shadow:0 0 0 3px #08080a,0 0 14px var(--c)}
.wn-m.eta .wn-dot{border-style:dashed}
.wn-m.big .wn-dot{width:18px;height:18px;left:-36px;top:20px}
.wn-small{display:grid;grid-template-columns:120px 1fr;gap:4px 16px;align-items:baseline;padding:4px 0}
@media (max-width:600px){.wn-small{grid-template-columns:1fr}}
.wn-small time{font-size:12.5px;color:#7d7468;font-variant-numeric:tabular-nums}
.wn-small b{font-size:15px;font-weight:600;color:#e6dccb}
.wn-small p{margin:2px 0 0;font-size:13.5px;color:#a39a8c;line-height:1.5}
.wn-big{border:1px solid #29241f;border-left:3px solid var(--c);border-radius:4px 14px 14px 4px;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 7%,transparent),#0d0c0e 60%);padding:18px 20px;display:grid;gap:6px}
.wn-m.ahead .wn-big{box-shadow:0 0 34px color-mix(in srgb,var(--c) 10%,transparent)}
.wn-when{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12.5px;color:#a39a8c}
.wn-tag{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;padding:2px 8px;border-radius:999px;border:1px solid currentColor}
.wn-kind{color:var(--c);font-size:11px;letter-spacing:.12em;text-transform:uppercase}
.wn-big h3{margin:0;font-size:clamp(19px,2.4vw,23px);color:#fff3dc;font-weight:600;line-height:1.25}
.wn-big p{margin:0;color:#cfc6b8;font-size:14.5px;line-height:1.55;max-width:66ch}
.wn-q{margin:8px 0 0;padding:10px 14px;border-left:2px solid var(--c,#ffc46b);background:rgba(255,196,107,.04);border-radius:0 10px 10px 0;max-width:66ch}
.wn-q blockquote{margin:0;white-space:pre-line;font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#f3e8d6}
.wn-small .wn-q blockquote{font-size:14px}
.wn-q figcaption{margin-top:5px;font-size:12px;color:#a39a8c}
.wn-src{justify-self:start;font-size:12.5px;color:#ffe3b0;text-decoration:underline;text-decoration-color:rgba(255,196,107,.35);text-underline-offset:3px}
.wn-now{position:relative;margin:26px 0 22px;display:flex;align-items:center;gap:12px;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:#ffc46b}
.wn-now:before{content:"";position:absolute;left:-34px;width:14px;height:14px;border-radius:50%;background:#ffc46b;box-shadow:0 0 0 6px rgba(255,196,107,.18);animation:wn-p 2.4s ease-in-out infinite}
.wn-now:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(255,196,107,.6),transparent)}
@keyframes wn-p{50%{box-shadow:0 0 0 11px rgba(255,196,107,.05)}}
@media (prefers-reduced-motion:reduce){.wn-now:before{animation:none}}
.wn-faq{display:grid;gap:10px}
.wn-faq details{border:1px solid #29241f;border-radius:14px;background:#0f0d10}
.wn-faq summary{cursor:pointer;list-style:none;padding:16px 20px;display:flex;justify-content:space-between;gap:16px;font-size:16.5px;color:#fff3dc;font-weight:600}
.wn-faq summary::-webkit-details-marker{display:none}
.wn-faq summary span{color:#a39a8c;font-weight:400;font-size:14px;text-align:right}
@media (max-width:600px){.wn-faq summary span{display:none}}
.wn-faq details[open]{border-color:rgba(255,196,107,.4)}
.wn-faq .ans{padding:0 20px 18px;display:grid;gap:4px}
.wn-faq .ans p{margin:0;color:#cfc6b8;font-size:15px;line-height:1.55}
.wn-foot{font-size:13px;color:#7d7468;line-height:1.6;max-width:72ch}
`

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const yearOf = (m: Moment) => new Date(m.at).getUTCFullYear()

function left(ms: number) {
  if (ms <= 0) return null
  return { d: Math.floor(ms / 86400000), h: Math.floor((ms % 86400000) / 3600000), m: Math.floor((ms % 3600000) / 60000) }
}

function Quote({ q }: { q: NonNullable<Moment['quote']> }) {
  return (
    <figure className="wn-q">
      <blockquote>&ldquo;{q.text}&rdquo;</blockquote>
      <figcaption>
        Come-from-Beyond{q.where ? `, ${q.where}` : ''}, {q.when}
      </figcaption>
    </figure>
  )
}

function Source({ s }: { s: NonNullable<Moment['source']> }) {
  return s.href.startsWith('/') ? (
    <Link className="wn-src" href={s.href}>
      {s.label}
    </Link>
  ) : (
    <a className="wn-src" href={s.href} rel="noopener noreferrer" target="_blank">
      {s.label}
    </a>
  )
}

function Item({ m, ahead }: { m: Moment; ahead: boolean }) {
  const c = KINDS[m.kind].color
  const cls = `wn-m${m.major ? ' big' : ''}${ahead ? ' ahead' : ''}${m.eta ? ' eta' : ''}`
  const day = m.approx ?? fmtDay(m.at)
  if (!m.major)
    return (
      <div className={cls} style={{ ['--c' as string]: c }}>
        <span aria-hidden className="wn-dot" />
        <div className="wn-small">
          <time dateTime={m.at}>{day}</time>
          <div>
            <b>{m.title}</b>
            {m.line ? <p>{m.line}</p> : null}
            {m.quote ? <Quote q={m.quote} /> : null}
            {m.source ? (
              <div style={{ marginTop: 4 }}>
                <Source s={m.source} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  return (
    <article className={cls} style={{ ['--c' as string]: c }}>
      <span aria-hidden className="wn-dot" />
      <div className="wn-big">
        <div className="wn-when">
          <time dateTime={m.at}>{day}</time>
          {m.epoch ? <span>· epoch {m.epoch}</span> : null}
          <span className="wn-kind">{KINDS[m.kind].name}</span>
          {ahead ? <span className="wn-tag" style={{ color: c }}>{m.eta ? 'ETA' : 'ahead'}</span> : null}
        </div>
        <h3>{m.title}</h3>
        {m.line ? <p>{m.line}</p> : null}
        {m.quote ? <Quote q={m.quote} /> : null}
        {m.source ? <Source s={m.source} /> : null}
      </div>
    </article>
  )
}

export function WhenApp() {
  const [now, setNow] = useState<number | null>(null)
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [onlyBig, setOnlyBig] = useState(false)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const t = now ?? Date.UTC(2026, 10, 12)
  const sorted = useMemo(() => MOMENTS.slice().sort((a, b) => Date.parse(b.at) - Date.parse(a.at)), [])
  const ahead3 = useMemo(() => {
    const seen = new Set<string>()
    return sorted
      .filter(m => Date.parse(m.at) > t && m.major)
      .reverse()
      .filter(m => (seen.has(m.at) ? false : (seen.add(m.at), true)))
      .slice(0, 3)
  }, [sorted, t])
  const shown = sorted.filter(m => (kind === 'all' || m.kind === kind) && (!onlyBig || m.major))
  const nowIdx = shown.findIndex(m => Date.parse(m.at) <= t)
  const nowPct = shown.length ? `${((nowIdx < 0 ? shown.length : nowIdx) / shown.length) * 100}%` : '0%'
  const years = [...new Set(shown.map(yearOf))]
  const ep = epochAt(t)
  const epPct = Math.min(100, Math.max(0, ((t - epochStart(ep)) / WEEK) * 100))
  const weeks = Array.from({ length: 8 }, (_, i) => ep - 2 + i)
  const counts = (k: Kind) => MOMENTS.filter(m => m.kind === k).length
  let lastYear = 0
  return (
    <main className={`wn ${bppFonts}`}>
      <style>{css}</style>
      <div className="wn-in">
        <div className="wn-hero">
          <h1 className="wn-h">
            WEN?<span className="sr-only"> Every date that matters for Qubic and Aigarth: roadmap, ETA and milestones</span>
          </h1>
          <p className="wn-sub">Every date that matters for Qubic and Aigarth, from the proof of concept to The Day. Newest on top, each with its source.</p>
        </div>

        <section aria-label="Coming next" className="wn-next">
          {ahead3.map((m, i) => {
            const l = left(Date.parse(m.at) - t)
            const same = MOMENTS.filter(x => x.at === m.at && x.major)
            return (
              <div className={`wn-card${i === 0 ? ' first' : ''}`} key={m.at}>
                <small>
                  {fmtDay(m.at)}
                  {m.epoch ? ` · epoch ${m.epoch}` : ''}
                </small>
                <div className="wn-count">
                  {l ? (
                    <>
                      {l.d}
                      <span>d</span>
                      {l.h}
                      <span>h</span>
                      {l.d < 3 ? (
                        <>
                          {l.m}
                          <span>m</span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    'now'
                  )}
                </div>
                <b>{same.map(x => x.title).join(' + ')}</b>
                <p>{same[0]!.line}</p>
              </div>
            )
          })}
        </section>

        <section aria-label="This epoch" className="wn-epoch">
          <div className="wn-epoch-top">
            <span>
              <b>Epoch {ep}</b> · a new epoch every Wednesday at 12:00 UTC
            </span>
            <span>{Math.round(epPct)}% through</span>
          </div>
          <div className="wn-bar">
            <i style={{ width: `${epPct}%` }} />
          </div>
          <div className="wn-weeks" style={{ ['--n' as string]: weeks.length }}>
            {weeks.map(e => {
              const mark = MOMENTS.some(m => m.epoch === e && Date.parse(m.at) > t)
              return (
                <div className={e < ep ? 'past' : e === ep ? 'now' : mark ? 'mark' : ''} key={e}>
                  <i />E{e}
                </div>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="wn-road">
          <h2 className="wn-h2" id="wn-road">
            The road
          </h2>
          <p className="wn-lead">What is coming sits on top, then everything that already happened, back to 2021. Big cards are the turning points; colour shows the track.</p>
          <div className="wn-bar2">
            <div aria-label="Track" role="group" style={{ display: 'contents' }}>
              <button aria-pressed={kind === 'all'} onClick={() => setKind('all')} type="button">
                Everything
              </button>
              {(Object.keys(KINDS) as Kind[]).map(k => (
                <button aria-pressed={kind === k} key={k} onClick={() => setKind(k)} type="button">
                  <i style={{ background: KINDS[k].color }} />
                  {KINDS[k].name} {counts(k)}
                </button>
              ))}
            </div>
            <span className="sep" />
            <button aria-pressed={onlyBig} onClick={() => setOnlyBig(v => !v)} type="button">
              Turning points only
            </button>
            <span className="sep" />
            {years.map(y => (
              <a href={`#y${y}`} key={y}>
                {y}
              </a>
            ))}
          </div>
          <div className="wn-line" style={{ ['--now' as string]: nowPct }}>
            {shown.map((m, i) => {
              const y = yearOf(m)
              const head = y !== lastYear
              lastYear = y
              return (
                <div key={m.at + m.title}>
                  {i === nowIdx ? <div className="wn-now">Now · epoch {ep}</div> : null}
                  {head ? (
                    <div className="wn-year" id={`y${y}`}>
                      <b>{y}</b>
                      <span>{shown.filter(x => yearOf(x) === y).length} moments</span>
                    </div>
                  ) : null}
                  <Item ahead={Date.parse(m.at) > t} m={m} />
                </div>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="wn-faq">
          <h2 className="wn-h2" id="wn-faq">
            Asked every day
          </h2>
          <p className="wn-lead">The questions the chat asks most, answered in Come-from-Beyond&rsquo;s own words.</p>
          <div className="wn-faq">
            {WEN.map(w => (
              <details key={w.q}>
                <summary>
                  {w.q} <span>{w.a.split('.')[0]}</span>
                </summary>
                <div className="ans">
                  <p>{w.a}</p>
                  <Quote q={w.quote} />
                </div>
              </details>
            ))}
          </div>
        </section>

        <p className="wn-foot">
          Dates are UTC days. An ETA is an estimate, not a promise. Quotes are verbatim; network and science events link the report they come from, the rest come from QC&rsquo;s research log.
        </p>
      </div>
    </main>
  )
}
