'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { bppFonts } from '@/components/bpp/fonts'
import { epochAt, epochStart, MOMENTS, type Moment, WEN, WEEK } from '@/lib/when'

const css = `
.wn{min-height:100svh;margin-bottom:-3rem;background:radial-gradient(60% 40% at 50% 0%,rgba(255,196,107,.09),transparent 70%),#08080a;color:#ece6da;font-family:var(--bpp-sans),system-ui,sans-serif;padding:92px 16px 128px}
.wn-in{max-width:1040px;margin:0 auto;display:grid;gap:56px}
.wn-chip{display:inline-block;padding:3px 10px;border:1px solid rgba(255,196,107,.4);border-radius:999px;color:#ffc46b;font-size:12px;letter-spacing:.06em}
.wn-hero{text-align:center;display:grid;gap:14px;justify-items:center}
.wn-h{font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:clamp(96px,18vw,200px);line-height:.8;margin:6px 0 0;color:#ffc46b;text-shadow:0 0 4px #ffd08a,0 0 22px rgba(255,196,107,.6),0 0 70px rgba(232,145,46,.4);letter-spacing:.02em}
.wn-sub{font-size:clamp(16px,2vw,19px);color:#cfc6b8;max-width:46ch;line-height:1.55;margin:0}
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
.wn-lead{margin:0 0 26px;color:#a39a8c;font-size:15px;max-width:60ch;line-height:1.55}
.wn-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}
.wn-filters button{background:#121014;border:1px solid #2c2620;color:#cfc6b8;border-radius:999px;padding:6px 14px;font:inherit;font-size:13.5px;cursor:pointer}
.wn-filters button[aria-pressed=true]{background:#ffc46b;color:#1a1408;border-color:#ffc46b;font-weight:600}
.wn-line{position:relative;display:grid;gap:0;padding-left:34px}
.wn-line:before{content:"";position:absolute;left:11px;top:6px;bottom:6px;width:2px;background:linear-gradient(180deg,#ffc46b var(--done),rgba(255,200,140,.18) var(--done))}
.wn-m{position:relative;padding:0 0 30px}
.wn-dot{position:absolute;left:-30px;top:4px;width:16px;height:16px;border-radius:50%;background:#1c1814;border:2px solid rgba(255,200,140,.3)}
.wn-m.done .wn-dot{background:#ffc46b;border-color:#ffc46b}
.wn-m.next .wn-dot{background:#08080a;border-color:#ffc46b;box-shadow:0 0 0 5px rgba(255,196,107,.15),0 0 18px rgba(255,196,107,.6)}
.wn-m.eta .wn-dot{border-style:dashed;border-color:#ffc46b}
.wn-when{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:13px;color:#a39a8c}
.wn-tag{font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:999px;border:1px solid #3a3229;color:#a39a8c}
.wn-m.next .wn-tag{border-color:#ffc46b;color:#ffc46b}
.wn-m.eta .wn-tag{border-color:rgba(255,196,107,.5);color:#ffe3b0}
.wn-m.done .wn-tag{border-color:transparent;color:#7d7468;padding-left:0}
.wn-m h3{margin:6px 0 4px;font-size:19px;color:#fff3dc;font-weight:600}
.wn-m.done h3{color:#e6dccb}
.wn-m p{margin:0;color:#cfc6b8;font-size:14.5px;line-height:1.55;max-width:64ch}
.wn-q{margin:12px 0 0;padding:12px 16px;border-left:2px solid #ffc46b;background:rgba(255,196,107,.05);border-radius:0 10px 10px 0;max-width:64ch}
.wn-q blockquote{margin:0;font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#f3e8d6}
.wn-q figcaption{margin-top:6px;font-size:12.5px;color:#a39a8c}
.wn-src{display:inline-block;margin-top:8px;font-size:13px;color:#ffe3b0;text-decoration:underline;text-decoration-color:rgba(255,196,107,.35);text-underline-offset:3px}
.wn-now{position:relative;margin:-6px 0 30px;display:flex;align-items:center;gap:12px;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#ffc46b}
.wn-now:before{content:"";position:absolute;left:-29px;width:14px;height:14px;border-radius:50%;background:#ffc46b;box-shadow:0 0 0 6px rgba(255,196,107,.18);animation:wn-p 2.4s ease-in-out infinite}
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
.wn-foot{font-size:13px;color:#7d7468;line-height:1.6;max-width:70ch}
`

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const TAG: Record<Moment['status'], string> = { done: 'done', next: 'next', planned: 'planned', eta: 'ETA' }
const KIND: Record<Moment['kind'] | 'all', string> = { all: 'Everything', aigarth: 'Aigarth', network: 'Network', mining: 'Mining', qc: 'QC' }

function left(ms: number) {
  if (ms <= 0) return null
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return { d, h, m }
}

export function WhenApp() {
  const [now, setNow] = useState<number | null>(null)
  const [kind, setKind] = useState<Moment['kind'] | 'all'>('all')
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const t = now ?? Date.UTC(2026, 10, 12)
  // the next three distinct dates still ahead
  const ahead = useMemo(() => {
    const seen = new Set<string>()
    return MOMENTS.filter(m => Date.parse(m.at) > t)
      .filter(m => (seen.has(m.at) ? false : (seen.add(m.at), true)))
      .slice(0, 3)
  }, [t])
  const shown = MOMENTS.filter(m => kind === 'all' || m.kind === kind)
  const nowIdx = shown.findIndex(m => Date.parse(m.at) > t)
  const donePct = shown.length ? `${(Math.max(0, nowIdx < 0 ? shown.length : nowIdx) / shown.length) * 100}%` : '0%'
  const ep = epochAt(t)
  const epPct = Math.min(100, Math.max(0, ((t - epochStart(ep)) / WEEK) * 100))
  const weeks = Array.from({ length: 8 }, (_, i) => ep - 2 + i)
  return (
    <main className={`wn ${bppFonts}`}>
      <style>{css}</style>
      <div className="wn-in">
        <div className="wn-hero">
          <span className="wn-chip">HIDDEN · ONLY YOU SEE THIS</span>
          <h1 className="wn-h">WEN?</h1>
          <p className="wn-sub">Every date that matters for Qubic and Aigarth, and the words each one came from.</p>
        </div>

        <section aria-label="Coming next" className="wn-next">
          {ahead.map((m, i) => {
            const l = left(Date.parse(m.at) - t)
            const same = MOMENTS.filter(x => x.at === m.at)
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
              const mark = MOMENTS.some(m => m.epoch === e && m.status !== 'done')
              return (
                <div className={e < ep ? 'past' : e === ep ? 'now' : mark ? 'mark' : ''} key={e}>
                  <i />
                  E{e}
                </div>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="wn-road">
          <h2 className="wn-h2" id="wn-road">
            The road
          </h2>
          <p className="wn-lead">What already happened and what is coming. Gold is behind us; the dashed line is ahead. Every step links its source.</p>
          <div aria-label="Filter the road" className="wn-filters" role="group">
            {(Object.keys(KIND) as (keyof typeof KIND)[]).map(k => (
              <button aria-pressed={kind === k} key={k} onClick={() => setKind(k)} type="button">
                {KIND[k]}
              </button>
            ))}
          </div>
          <div className="wn-line" style={{ ['--done' as string]: donePct }}>
            {shown.map((m, i) => (
              <div key={m.at + m.title}>
                {i === nowIdx ? <div className="wn-now">Now · epoch {ep}</div> : null}
                <article className={`wn-m ${Date.parse(m.at) <= t ? 'done' : m.status}`}>
                  <span aria-hidden className="wn-dot" />
                  <div className="wn-when">
                    <span>{m.approx ?? fmtDay(m.at)}</span>
                    {m.epoch ? <span>· epoch {m.epoch}</span> : null}
                    <span className="wn-tag">{Date.parse(m.at) <= t ? 'done' : TAG[m.status]}</span>
                  </div>
                  <h3>{m.title}</h3>
                  <p>{m.line}</p>
                  {m.quote ? (
                    <figure className="wn-q">
                      <blockquote>&ldquo;{m.quote.text}&rdquo;</blockquote>
                      <figcaption>
                        Come-from-Beyond, {m.quote.where}, {m.quote.when}
                      </figcaption>
                    </figure>
                  ) : null}
                  {m.source ? (
                    m.source.href.startsWith('/') ? (
                      <Link className="wn-src" href={m.source.href}>
                        {m.source.label}
                      </Link>
                    ) : (
                      <a className="wn-src" href={m.source.href} rel="noopener noreferrer" target="_blank">
                        {m.source.label}
                      </a>
                    )
                  ) : null}
                </article>
              </div>
            ))}
            {nowIdx < 0 ? <div className="wn-now">Now · epoch {ep}</div> : null}
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
                  <figure className="wn-q">
                    <blockquote>&ldquo;{w.quote.text}&rdquo;</blockquote>
                    <figcaption>
                      Come-from-Beyond, {w.quote.where}, {w.quote.when}
                    </figcaption>
                  </figure>
                </div>
              </details>
            ))}
          </div>
        </section>

        <p className="wn-foot">
          Dates are UTC. An ETA is an estimate, not a promise. Quotes are verbatim from the Qubic Discord; network events link the report they come from.
        </p>
      </div>
    </main>
  )
}
