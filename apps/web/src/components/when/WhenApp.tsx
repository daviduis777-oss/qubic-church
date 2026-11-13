'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { bppFonts } from '@/components/bpp/fonts'
import { epochAt, epochStart, type Kind, KINDS, MOMENTS, type Moment, WEEK, WEN } from '@/lib/when'

const css = `
.wn{min-height:100svh;margin-bottom:-3rem;background:radial-gradient(60% 40% at 50% 0%,rgba(255,196,107,.09),transparent 70%),#08080a;color:#ece6da;font-family:var(--bpp-sans),system-ui,sans-serif;padding:92px 16px 128px}
.wn-chip{display:inline-block;padding:3px 10px;border:1px solid rgba(255,196,107,.4);border-radius:999px;color:#ffc46b;font-size:12px;letter-spacing:.06em}
.wn-h{font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:clamp(96px,18vw,200px);line-height:.8;margin:6px 0 0;color:#ffc46b;text-shadow:0 0 4px #ffd08a,0 0 22px rgba(255,196,107,.6),0 0 70px rgba(232,145,46,.4);letter-spacing:.02em}
.wn-sub{font-size:clamp(16px,2vw,19px);color:#cfc6b8;max-width:48ch;line-height:1.55;margin:0}
.wn-count{font-family:var(--bpp-nx),sans-serif;font-size:clamp(40px,5.4vw,56px);line-height:1;color:#ffc46b;font-variant-numeric:tabular-nums}
.wn-count span{font-size:.45em;color:#a39a8c;margin:0 6px 0 2px}
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
.wn-wrap{max-width:1200px;margin:0 auto;display:grid;gap:28px}
.wn-top{display:flex;align-items:flex-end;gap:18px 26px;flex-wrap:wrap}
.wn-top .wn-h{font-size:clamp(64px,9vw,104px);margin:0}
.wn-top .wn-sub{font-size:15px;max-width:44ch;color:#a39a8c;padding-bottom:6px}
.wn-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;grid-template-areas:"latest side" "feed side";gap:28px 32px;align-items:start}
.wn-latest-s{grid-area:latest}
.wn-feed{grid-area:feed;min-width:0}
.wn-side{grid-area:side;position:sticky;top:84px;display:grid;gap:12px;max-height:calc(100svh - 100px);overflow:auto;scrollbar-width:thin;padding-bottom:4px}
@media (max-width:920px){.wn-grid{grid-template-columns:1fr;grid-template-areas:"latest" "side" "feed"}.wn-side{position:static;max-height:none;overflow:visible}}
.wn-latest{position:relative;border:1px solid rgba(255,196,107,.5);border-radius:20px;background:radial-gradient(90% 120% at 0% 0%,color-mix(in srgb,var(--c) 14%,transparent),transparent 60%),linear-gradient(180deg,#141116,#0c0b0d);padding:clamp(22px,3.4vw,36px);display:grid;gap:12px;box-shadow:0 0 60px rgba(255,196,107,.08)}
.wn-latest-k{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:13px;color:#a39a8c}
.wn-live{display:inline-flex;align-items:center;gap:8px;padding:4px 11px;border-radius:999px;background:#ffc46b;color:#1a1408;font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.wn-live i{width:7px;height:7px;border-radius:50%;background:#1a1408;animation:wn-b 1.6s ease-in-out infinite}
@keyframes wn-b{50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){.wn-live i{animation:none}}
.wn-latest h2{margin:0;font-size:clamp(30px,4.6vw,50px);line-height:1.05;color:#fff3dc;font-weight:650;letter-spacing:-.01em;max-width:22ch}
.wn-latest p{margin:0;font-size:clamp(16px,1.7vw,18px);line-height:1.6;color:#e2d8c8;max-width:62ch}
.wn-latest .wn-q blockquote{font-size:17px}
.wn-prev{display:flex;gap:10px 18px;flex-wrap:wrap;margin-top:6px;padding-top:14px;border-top:1px solid #241f1b;font-size:13.5px;color:#a39a8c}
.wn-prev b{color:#e6dccb;font-weight:600}
.wn-panel{border:1px solid #29241f;border-radius:16px;background:linear-gradient(180deg,#121014,#0c0b0d)}
.wn-panel>summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8c}
.wn-panel>summary::-webkit-details-marker{display:none}
.wn-panel>summary:after{content:"+";font-size:18px;color:#7d7468;letter-spacing:0}
.wn-panel[open]>summary:after{content:"−"}
.wn-panel>summary:focus-visible{outline:2px solid #ffc46b;outline-offset:-2px;border-radius:16px}
.wn-panel-b{padding:0 18px 18px;display:grid;gap:12px}
.wn-up{display:grid;gap:2px;padding:10px 0;border-top:1px solid #1f1b18}
.wn-up:first-child{border-top:0;padding-top:0}
.wn-up small{font-size:12px;color:#7d7468}
.wn-up b{font-size:14.5px;color:#fff3dc;font-weight:600;line-height:1.35}
.wn-up em{font-style:normal;font-size:12.5px;color:#ffc46b;font-variant-numeric:tabular-nums}
.wn-up.first .wn-count{font-size:44px;margin:4px 0}
.wn-up.first p{margin:0;font-size:13px;color:#a39a8c;line-height:1.5}
.wn-side .wn-faq summary{font-size:14px;padding:12px 14px}
.wn-side .wn-faq .ans{padding:0 14px 14px}
.wn-side .wn-faq .ans p{font-size:14px}
.wn-feed .wn-h2{font-size:clamp(28px,3.6vw,38px)}
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
          {ahead ? (
            <span className="wn-tag" style={{ color: c }}>
              {m.eta ? 'ETA' : 'ahead'}
            </span>
          ) : null}
        </div>
        <h3>{m.title}</h3>
        {m.line ? <p>{m.line}</p> : null}
        {m.quote ? <Quote q={m.quote} /> : null}
        {m.source ? <Source s={m.source} /> : null}
      </div>
    </article>
  )
}

export function WhenApp({ initialNow }: { initialNow?: number }) {
  const [now, setNow] = useState<number | null>(null)
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [onlyBig, setOnlyBig] = useState(false)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const t = now ?? initialNow ?? Date.UTC(2026, 10, 12)
  const sorted = useMemo(() => MOMENTS.slice().sort((a, b) => Date.parse(b.at) - Date.parse(a.at)), [])
  // what is coming lives in the side panel, oldest first; the feed is what already happened, newest first
  const upcoming = useMemo(() => sorted.filter(m => Date.parse(m.at) > t).reverse(), [sorted, t])
  const past = sorted.filter(m => Date.parse(m.at) <= t)
  const latest = past[0]
  const shown = past.slice(1).filter(m => (kind === 'all' || m.kind === kind) && (!onlyBig || m.major))
  const years = [...new Set(shown.map(yearOf))]
  const ep = epochAt(t)
  const epPct = Math.min(100, Math.max(0, ((t - epochStart(ep)) / WEEK) * 100))
  const weeks = Array.from({ length: 8 }, (_, i) => ep - 2 + i)
  const counts = (k: Kind) => past.slice(1).filter(m => m.kind === k).length
  let lastYear = 0
  return (
    <main className={`wn ${bppFonts}`}>
      <style>{css}</style>
      <div className="wn-wrap">
        <header className="wn-top">
          <h1 className="wn-h">
            WEN?<span className="sr-only"> Every date that matters for Qubic and Aigarth: roadmap, ETA and milestones</span>
          </h1>
          <p className="wn-sub">
            Every date that matters for Qubic and Aigarth, from the proof of concept to The Day. The latest on top, each with its source.
          </p>
        </header>

        <div className="wn-grid">
          {latest ? (
            <section aria-labelledby="wn-latest" className="wn-latest-s">
              <Latest m={latest} next={past[1]} t={t} />
            </section>
          ) : null}

          <aside aria-label="Coming next, this epoch, questions" className="wn-side">
            <details className="wn-panel" open>
              <summary>Coming next</summary>
              <div className="wn-panel-b">
                {upcoming.map(m => {
                  const l = left(Date.parse(m.at) - t)
                  const same = upcoming.filter(x => x.at === m.at)
                  if (same[0] !== m) return null
                  return (
                    <div className={`wn-up${m === upcoming[0] ? ' first' : ''}`} key={m.at + m.title}>
                      <small>
                        {m.approx ?? fmtDay(m.at)}
                        {m.epoch ? ` · epoch ${m.epoch}` : ''}
                        {m.eta ? ' · ETA' : ''}
                      </small>
                      {m === upcoming[0] && l ? (
                        <div className="wn-count">
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
                        </div>
                      ) : null}
                      <b>{same.map(x => x.title).join(' + ')}</b>
                      {m === upcoming[0] ? <p>{m.line}</p> : l ? <em>in {l.d > 0 ? `${l.d} d ${l.h} h` : `${l.h} h ${l.m} m`}</em> : null}
                    </div>
                  )
                })}
              </div>
            </details>

            <details className="wn-panel" open>
              <summary>
                Epoch {ep} · {Math.round(epPct)}%
              </summary>
              <div className="wn-panel-b">
                <div className="wn-bar">
                  <i style={{ width: `${epPct}%` }} />
                </div>
                <div className="wn-weeks" style={{ ['--n' as string]: weeks.length }}>
                  {weeks.map(e => {
                    const mark = MOMENTS.some(m => m.epoch === e && Date.parse(m.at) > t)
                    return (
                      <div className={e < ep ? 'past' : e === ep ? 'now' : mark ? 'mark' : ''} key={e}>
                        <i />
                        {e}
                      </div>
                    )
                  })}
                </div>
                <small style={{ fontSize: 12.5, color: '#7d7468' }}>A new epoch every Wednesday at 12:00 UTC.</small>
              </div>
            </details>

            <details className="wn-panel">
              <summary>Asked every day</summary>
              <div className="wn-panel-b wn-faq">
                {WEN.map(w => (
                  <details key={w.q}>
                    <summary>{w.q}</summary>
                    <div className="ans">
                      <p>{w.a}</p>
                      <Quote q={w.quote} />
                    </div>
                  </details>
                ))}
              </div>
            </details>
          </aside>

          <section aria-labelledby="wn-road" className="wn-feed">
            <h2 className="wn-h2" id="wn-road">
              Before that
            </h2>
            <p className="wn-lead">Everything that already happened, newest first, back to 2021. Big cards are the turning points; colour shows the track.</p>
            <div className="wn-bar2">
              <div aria-label="Track" role="group" style={{ display: 'contents' }}>
                <button aria-pressed={kind === 'all'} onClick={() => setKind('all')} type="button">
                  Everything
                </button>
                {(Object.keys(KINDS) as Kind[])
                  .filter(k => counts(k) > 0)
                  .map(k => (
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
            <div className="wn-line" style={{ ['--now' as string]: '0%' }}>
              {shown.map(m => {
                const y = yearOf(m)
                const head = y !== lastYear
                lastYear = y
                return (
                  <div key={m.at + m.title}>
                    {head ? (
                      <div className="wn-year" id={`y${y}`}>
                        <b>{y}</b>
                        <span>{shown.filter(x => yearOf(x) === y).length} moments</span>
                      </div>
                    ) : null}
                    <Item ahead={false} m={m} />
                  </div>
                )
              })}
            </div>
            <p className="wn-foot" style={{ marginTop: 28 }}>
              Dates are UTC days. An ETA is an estimate, not a promise. Quotes are verbatim; network and science events link the report they come from, the rest
              come from QC&rsquo;s research log.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

/** The newest thing that happened, full size: the first thing anyone opening the page sees. */
function Latest({ m, next, t }: { m: Moment; next?: Moment; t: number }) {
  const c = KINDS[m.kind].color
  const h = Math.max(0, Math.floor((t - Date.parse(m.at)) / 3600000))
  const ago = h < 1 ? 'just now' : h < 48 ? `${h} h ago` : `${Math.floor(h / 24)} days ago`
  return (
    <article className="wn-latest" style={{ ['--c' as string]: c }}>
      <div className="wn-latest-k">
        <span className="wn-live">
          <i aria-hidden />
          Latest
        </span>
        <time dateTime={m.at}>{m.approx ?? fmtDay(m.at)}</time>
        <span>· {ago}</span>
        {m.epoch ? <span>· epoch {m.epoch}</span> : null}
        <span className="wn-kind">{KINDS[m.kind].name}</span>
      </div>
      <h2 id="wn-latest">{m.title}</h2>
      {m.line ? <p>{m.line}</p> : null}
      {m.quote ? <Quote q={m.quote} /> : null}
      {m.source ? <Source s={m.source} /> : null}
      {next ? (
        <div className="wn-prev">
          <span>Before it:</span>
          <b>{next.title}</b>
          <span>{fmtDay(next.at)}</span>
        </div>
      ) : null}
    </article>
  )
}
