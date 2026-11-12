'use client'

import { useEffect, useRef, useState } from 'react'
import { bppFonts } from '@/components/bpp/fonts'
import { ANNA, type Exhibit, HALLS, PRELUDE, RECORDS, type Talk, type Version } from '@/lib/museum'

const css = `
.mu{min-height:100svh;margin-bottom:-3rem;background:#dcdad4;color:#141416;font-family:var(--bpp-sans),system-ui,sans-serif;padding:96px 16px 140px}
.mu-in{max-width:1080px;margin:0 auto}
.mu-hero{display:grid;gap:18px;padding-bottom:56px;border-bottom:1px solid #b9b6ad;margin-bottom:56px}
.mu-h{font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:clamp(88px,16vw,190px);line-height:.78;margin:0;letter-spacing:-.01em}
.mu-hall{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap}
.mu-hall b{font-family:var(--bpp-eng),sans-serif;font-weight:400;font-size:clamp(20px,3vw,30px)}
.mu-hall span{color:#5d5b55;font-size:15px}
.mu-lead{max-width:58ch;font-size:clamp(17px,2vw,20px);line-height:1.55;margin:0;color:#2b2a27}
.mu-pre{display:flex;gap:28px;flex-wrap:wrap;color:#5d5b55;font-size:14px;line-height:1.5}
.mu-pre p{margin:0;max-width:44ch}
.mu-pre q{color:#141416}
.mu-track{position:relative;padding-left:64px}
@media (max-width:640px){.mu-track{padding-left:34px}}
.mu-rail{position:absolute;left:14px;top:0;bottom:0;width:8px;background:#efe39a;border-radius:4px}
@media (max-width:640px){.mu-rail{left:4px;width:6px}}
.mu-rail i{position:absolute;left:0;top:0;width:100%;background:#ffd21f;border-radius:4px;height:var(--p,0%)}
.mu-tag{position:sticky;top:96px;height:0;margin-left:-64px;z-index:2}
@media (max-width:640px){.mu-tag{margin-left:-34px}}
.mu-tag span{position:absolute;left:4px;top:0;writing-mode:vertical-rl;transform:rotate(180deg);background:#ffd21f;color:#141416;font-family:var(--bpp-eng),sans-serif;font-size:11px;letter-spacing:.3em;padding:12px 6px;border-radius:4px}
@media (max-width:640px){.mu-tag span{left:-4px;font-size:9px;padding:10px 4px}}
.mu-day{font-family:var(--bpp-nx),sans-serif;font-size:clamp(40px,6vw,64px);font-weight:400;margin:0 0 28px;line-height:1}
.mu-sub{margin:-18px 0 30px;font-size:15px;line-height:1.5;color:#5d5b55;max-width:62ch}
.mu-t{position:relative;display:grid;grid-template-columns:64px 1fr;gap:4px 18px;margin:0 0 22px;max-width:760px}
@media (max-width:640px){.mu-t{grid-template-columns:1fr}}
.mu-t:before{content:"";position:absolute;left:-55px;top:8px;width:10px;height:10px;border-radius:50%;background:#141416;box-shadow:0 0 0 4px #dcdad4}
@media (max-width:640px){.mu-t:before{left:-32px;width:8px;height:8px}}
.mu-t time{font-variant-numeric:tabular-nums;font-size:13px;color:#5d5b55;padding-top:3px}
.mu-ask{margin:0 0 4px;font-size:14px;color:#5d5b55;line-height:1.45}
.mu-ask b{font-weight:600;color:#3d3b36}
.mu-say{margin:0;font-size:17px;line-height:1.5;white-space:pre-line}
.mu-say b{font-weight:600}
.mu-v{position:relative;display:grid;grid-template-columns:300px 1fr;gap:20px;margin:40px 0 48px;scroll-margin-top:100px}
@media (max-width:860px){.mu-v{grid-template-columns:1fr}}
.mu-v:before{content:"";position:absolute;left:-61px;top:18px;width:22px;height:22px;border-radius:4px;background:#ffd21f;border:3px solid #141416}
@media (max-width:640px){.mu-v:before{left:-36px;width:14px;height:14px;border-width:2px}}
.mu-label{background:#f7f6f2;padding:22px 22px 20px;display:grid;gap:12px;align-content:start;box-shadow:0 1px 0 #b9b6ad}
.mu-label h3{margin:0;font-family:var(--bpp-eng),sans-serif;font-weight:400;font-size:19px;line-height:1.25}
.mu-label dl{margin:0;display:grid;gap:8px;font-size:13.5px;line-height:1.4}
.mu-label dt{color:#76736b;font-size:12px}
.mu-label dd{margin:0}
.mu-hash{font-family:ui-monospace,Consolas,monospace;font-size:11.5px;word-break:break-all;color:#3d3b36}
.mu-label blockquote{margin:0;padding-top:12px;border-top:1px solid #dedbd2;font-size:15px;line-height:1.5;white-space:pre-line}
.mu-label blockquote cite{display:block;font-style:normal;color:#76736b;font-size:12px;margin-top:6px}
.mu-missing{font-size:13px;color:#8a5a00;background:#fff1b8;padding:8px 10px}
.mu-con{background:#0c0c0c;color:#cccccc;border-radius:6px;overflow:hidden;align-self:start;box-shadow:0 18px 40px -24px rgba(0,0,0,.55)}
.mu-bar{display:flex;align-items:center;gap:10px;background:#1f1f1f;color:#e6e6e6;font-size:12px;padding:7px 12px;font-family:var(--bpp-sans),sans-serif}
.mu-bar i{width:10px;height:10px;border:1px solid #777;border-radius:2px}
.mu-bar span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mu-con pre{margin:0;padding:14px 16px 16px;font-family:ui-monospace,Consolas,'Cascadia Mono',monospace;font-size:12.5px;line-height:1.55;overflow-x:auto}
.mu-con pre .hot{color:#ff6b5e}
.mu-con figcaption{padding:8px 16px 12px;font-size:12px;color:#8d8d8d;font-family:var(--bpp-sans),sans-serif;border-top:1px solid #1f1f1f}
.mu-fmt{padding:18px 16px;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;color:#8d8d8d;line-height:1.6}
.mu-fmt b{display:block;color:#cccccc;font-weight:400;margin-top:6px;word-break:break-word}
.mu-read{padding:4px 16px 0;border-top:1px solid #1f1f1f}
.mu-read .mu-ask{color:#8d8d8d;margin:12px 0 0}
.mu-read .mu-ask b{color:#cccccc}
.mu-read pre{padding:10px 0 14px;color:#e8e8e8}
.mu-gap{margin:64px 0 28px}
.mu-end{position:relative;margin:56px 0 0;background:#141416;color:#f7f6f2;padding:32px clamp(20px,4vw,40px);display:grid;gap:12px;max-width:760px}
.mu-end:before{content:"";position:absolute;left:-63px;top:28px;width:26px;height:26px;border-radius:50%;background:#ffd21f;border:3px solid #141416}
@media (max-width:640px){.mu-end:before{left:-38px;width:16px;height:16px;border-width:2px}}
.mu-end time{color:#ffd21f;font-size:14px}
.mu-end h3{margin:0;font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:clamp(44px,7vw,72px);line-height:.9}
.mu-end p{margin:0;color:#c9c6bd;font-size:16px;line-height:1.5}
.mu-end blockquote{margin:6px 0 0;font-size:clamp(20px,2.6vw,26px);line-height:1.35}
.mu-end cite{display:block;font-style:normal;font-size:13px;color:#9b988f;margin-top:8px}
.mu-rec{margin-top:96px;display:grid;gap:18px}
.mu-h2{font-family:var(--bpp-nx),sans-serif;font-weight:400;font-size:clamp(36px,5vw,52px);margin:0;line-height:1}
.mu-rec p{margin:0;color:#5d5b55;max-width:62ch;line-height:1.55}
.mu-tbl{width:100%;border-collapse:collapse;font-size:15px;max-width:760px}
.mu-tbl th{text-align:left;font-weight:500;color:#76736b;font-size:12.5px;padding:8px 10px;border-bottom:1px solid #141416}
.mu-tbl td{padding:11px 10px;border-bottom:1px solid #c4c1b8;vertical-align:baseline}
.mu-tbl td.s{font-family:var(--bpp-nx),sans-serif;font-size:26px;font-variant-numeric:tabular-nums;width:1%;white-space:nowrap}
.mu-tbl td.n{color:#5d5b55;font-size:13.5px}
.mu-tbl tr:first-child td.s{background:#ffd21f}
@media (max-width:640px){.mu-tbl td.n{display:none}}
.mu-foot{margin-top:72px;padding-top:24px;border-top:1px solid #b9b6ad;color:#5d5b55;font-size:14px;line-height:1.6;max-width:66ch}
`

const hm = (iso: string) => new Date(iso).toISOString().slice(11, 16)
const dm = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`

function Say({ t }: { t: Talk }) {
  return (
    <div className="mu-t">
      <time dateTime={t.at}>{hm(t.at)}</time>
      <div>
        {t.ask && (
          <p className="mu-ask">
            <b>{t.ask.who}:</b> {t.ask.text}
          </p>
        )}
        <p className="mu-say">
          <b>Come-from-Beyond:</b> {t.text}
        </p>
      </div>
    </div>
  )
}

function Vitrine({ v }: { v: Version }) {
  return (
    <article className="mu-v" id={v.id}>
      <div className="mu-label">
        <h3>{v.name}</h3>
        <dl>
          <div>
            <dt>Posted</dt>
            <dd>
              {dm(v.at)}, {hm(v.at)} UTC, #price-discussion
            </dd>
          </div>
          {v.built && (
            <div>
              <dt>Built (from the file)</dt>
              <dd>{hm(v.built)} UTC</dd>
            </div>
          )}
          {v.bytes && (
            <div>
              <dt>Medium</dt>
              <dd>Windows console program, {kb(v.bytes)}</dd>
            </div>
          )}
          {v.sha256 && (
            <div>
              <dt>SHA-256</dt>
              <dd className="mu-hash">{v.sha256}</dd>
            </div>
          )}
        </dl>
        {v.missing && <div className="mu-missing">The file is not in the collection yet.</div>}
        <blockquote>
          {v.cfb}
          <cite>Come-from-Beyond, with the file</cite>
        </blockquote>
      </div>
      <figure className="mu-con" style={{ margin: 0 }}>
        <div className="mu-bar">
          <span>C:\Anna\Anna.exe</span>
          <i />
          <i />
          <i />
        </div>
        {v.console ? (
          <>
            <pre>
              {v.console.lines.map((l, i) => (
                <div key={i} className={/DETECTED/.test(l) ? 'hot' : undefined}>
                  {l}
                </div>
              ))}
            </pre>
            <figcaption>
              Posted by {v.console.by} at {hm(v.console.at)} UTC
            </figcaption>
          </>
        ) : v.explain ? (
          <>
            <div className="mu-fmt">
              The line it prints, read from the file:
              <b>{v.format}</b>
            </div>
            <div className="mu-read">
              <p className="mu-ask">
                <b>{v.explain.ask.who}:</b> {v.explain.ask.text}
              </p>
              <pre>{v.explain.text}</pre>
            </div>
            <figcaption>Come-from-Beyond reads the screen, {hm(v.explain.at)} UTC</figcaption>
          </>
        ) : (
          <div className="mu-fmt">
            No screenshot of this version yet. The line it prints, read from the file:
            <b>{v.format}</b>
          </div>
        )}
      </figure>
    </article>
  )
}

function Item({ e }: { e: Exhibit }) {
  if (e.kind === 'version') return <Vitrine v={e} />
  if (e.kind === 'talk') return <Say t={e} />
  return (
    <section className="mu-end">
      <time dateTime={e.at}>{dm(e.at)}</time>
      <h3>{e.title}</h3>
      {e.text && <p>{e.text}</p>}
      {e.quote && (
        <blockquote>
          {e.quote}
          <cite>Come-from-Beyond, Discord</cite>
        </blockquote>
      )}
    </section>
  )
}

export function MuseumApp() {
  const hall = HALLS[0]!
  const track = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)

  // The one moving thing: the Research line fills as you walk the hall.
  useEffect(() => {
    const el = track.current
    if (!el) return
    const on = () => {
      const r = el.getBoundingClientRect()
      const seen = window.innerHeight * 0.6 - r.top
      setP(Math.max(0, Math.min(1, seen / r.height)))
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [])

  const all = ANNA.slice().sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
  const day = (d: string) => all.filter(e => e.at.startsWith(d))
  const later = all.filter(e => e.at >= '2026-06-12')

  return (
    <main className={`mu ${bppFonts}`}>
      <style>{css}</style>
      <div className="mu-in">
        <header className="mu-hero">
          <h1 className="mu-h">Museum</h1>
          <div className="mu-hall">
            <b>
              Hall {hall.n}. {hall.name}
            </b>
            <span>{hall.span}</span>
          </div>
          <p className="mu-lead">{hall.lead}</p>
          <div className="mu-pre">
            {PRELUDE.map(t => (
              <p key={t.at}>
                {dm(t.at)}: <q>{t.text}</q>
              </p>
            ))}
          </div>
        </header>

        <div className="mu-track" ref={track}>
          <div className="mu-rail" aria-hidden>
            <i style={{ ['--p' as string]: `${(p * 100).toFixed(1)}%` }} />
          </div>
          <div className="mu-tag" aria-hidden>
            <span>RESEARCH</span>
          </div>

          <h2 className="mu-day">10 June 2026</h2>
          <p className="mu-sub">
            Seven files in eight hours, all in #price-discussion, all times UTC. The middle number is the score: it starts near 32 700 and the goal is 0.
          </p>
          {day('2026-06-10').map((e, i) => (
            <Item key={i} e={e} />
          ))}

          <h2 className="mu-day mu-gap">11 June 2026</h2>
          <p className="mu-sub">A new method: a training set and a validation set. Come-from-Beyond names the problem it is after.</p>
          {day('2026-06-11').map((e, i) => (
            <Item key={i} e={e} />
          ))}

          <h2 className="mu-day mu-gap">After</h2>
          <p className="mu-sub">The race went on until July. More versions and records are being hung.</p>
          {later.map((e, i) => (
            <Item key={i} e={e} />
          ))}
        </div>

        <section className="mu-rec">
          <h2 className="mu-h2">Scores from the first two days</h2>
          <p>Lower is better. These are the screenshots posted on 10 and 11 June; the full record book follows.</p>
          <table className="mu-tbl">
            <thead>
              <tr>
                <th>Score</th>
                <th>Who</th>
                <th>Time</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {RECORDS.map(r => (
                <tr key={r.who + r.score}>
                  <td className="s">{r.score.toLocaleString('en-US')}</td>
                  <td>{r.who}</td>
                  <td>{hm(r.at)}</td>
                  <td className="n">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="mu-foot">
          The files are kept, not served. If you have a copy, compare its SHA-256 with the one on the label. Quotes are verbatim from the Qubic Discord; times
          were converted to UTC.
        </p>
      </div>
    </main>
  )
}
