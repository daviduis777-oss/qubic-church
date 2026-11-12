'use client'

import { useEffect, useRef, useState } from 'react'
import { bppFonts } from '@/components/bpp/fonts'
import { ANNA, type Board, type Chat, type Exhibit, HALLS, HISTORIANS, PRELUDE, RACERS, RECORDS, type Talk, type Version } from '@/lib/museum'

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
.mu-c{position:relative;display:grid;grid-template-columns:64px 1fr;gap:4px 18px;margin:0 0 18px 0;max-width:700px}
@media (max-width:640px){.mu-c{grid-template-columns:1fr}}
.mu-c:before{content:"";position:absolute;left:-54px;top:8px;width:8px;height:8px;border-radius:50%;border:1.5px solid #141416;background:#dcdad4}
@media (max-width:640px){.mu-c:before{left:-31px;width:6px;height:6px}}
.mu-c time{font-variant-numeric:tabular-nums;font-size:13px;color:#8a877e;padding-top:2px}
.mu-c>div{min-width:0;border-left:2px dashed #b9b6ad;padding-left:14px}
.mu-chat{margin:0;font-size:15px;line-height:1.5;color:#3d3b36;white-space:pre-line;font-style:italic}
.mu-chat b{font-style:normal;font-weight:600;color:#141416}
.mu-board ol{list-style:none;margin:10px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;max-width:560px}
@media (max-width:640px){.mu-board ol{grid-template-columns:repeat(3,minmax(0,1fr))}}
.mu-board li{display:grid;gap:2px;background:#f7f6f2;padding:8px 10px;box-shadow:0 1px 0 #b9b6ad}
.mu-board li span{font-size:12px;color:#76736b}
.mu-board li b{font-family:var(--bpp-nx),sans-serif;font-weight:400;font-size:26px;line-height:1;font-variant-numeric:tabular-nums}
.mu-board li.z{background:#ffd21f}
.mu-hist blockquote{margin:0;background:#141416;color:#f7f6f2;padding:22px 24px;display:grid;gap:8px;max-width:640px}
.mu-hist time{color:#ffd21f;font-size:13px}
.mu-hist blockquote p{margin:0;font-size:clamp(18px,2.4vw,22px);line-height:1.35;color:#f7f6f2}
.mu-hist small{color:#9b988f;font-size:13.5px;line-height:1.5}
.mu-hist a{color:#ffd21f;font-size:14px}
.mu-crew{margin-top:72px;display:grid;gap:14px}
.mu-crew ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.mu-crew li{background:#f7f6f2;padding:6px 12px;font-size:14.5px;box-shadow:0 1px 0 #b9b6ad}
.mu-crew p{margin:0;color:#5d5b55;max-width:62ch;line-height:1.55}
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
.mu-batch{list-style:none;margin:4px 0 0;padding:0;display:grid;gap:8px}
.mu-batch li{display:grid;gap:2px;font-size:13px}
.mu-batch .mu-hash{font-size:10.5px}
.mu-files,.mu-note{margin:0;font-size:13.5px;line-height:1.45;color:#3d3b36}
.mu-note{padding-top:12px;border-top:1px solid #dedbd2;color:#5d5b55}
.mu-say a{color:inherit;text-decoration:underline;text-underline-offset:3px}
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

const DAYS = [
  {
    at: '2026-06-10',
    sub: 'Seven files in eight hours, all in #price-discussion, all times UTC. The middle number is the score: it starts near 32 700 and the goal is 0.',
  },
  { at: '2026-06-11', sub: 'A new method: a training set and a validation set. Come-from-Beyond names the problem it is after.' },
  { at: '2026-06-12', sub: 'Builds for older processors, an optimized file, the first score under 20 000.' },
  { at: '2026-06-13', sub: 'Progress can now be saved and shared. That evening Come-from-Beyond says his part is done.' },
  { at: '2026-06-16', sub: 'What zero means.' },
  { at: '2026-06-17', sub: 'Joji saves 18 512 and cannot go lower. A new version is promised after the epoch.' },
  { at: '2026-06-18', sub: 'A new way to count the score: any number of threads, and the numbers no longer compare with the old ones.' },
  { at: '2026-06-19', sub: 'Why not run it on the whole network?' },
  { at: '2026-06-26', sub: 'Dogecoin or Anna?' },
  { at: '2026-06-29', sub: 'The racers keep their own board of the seven tests. Anna-2 is at zero; Anna-7 is the hardest.' },
  { at: '2026-07-01', sub: 'A stuck week.' },
  { at: '2026-07-05', sub: 'Anna-7.3 joins the board.' },
  {
    at: '2026-07-06',
    sub: 'Anna-1 and Anna-2 at zero by morning. A new file for Anna-7, a call for independent screenshots, and by 10:19 UTC every test at zero.',
  },
  { at: '2026-07-03', sub: 'A daily status from the racers.' },
  { at: '2026-06-25', sub: 'A trick for scores that are stuck: a file with Tilda capped at 550.' },
  { at: '2026-06-24', sub: 'Zero on Come-from-Beyond’s screen. Then seven tests, one file each, to be shared out.' },
  { at: '2026-06-22', sub: 'Two files in half an hour. The racers pass 11 300 on the new score.' },
  { at: '2026-06-21', sub: 'A faster file, and a new start from Come-from-Beyond’s progress.' },
  { at: '2026-06-20', sub: 'The racers ask for a channel of their own. In the evening everyone starts again from an empty file.' },
  { at: '2026-06-15', sub: 'The keys settle: Tilda, 1 to 9, F2. His own progress comes with the file.' },
]

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
          <b>
            Come-from-Beyond
            {t.where && (
              <>
                {' '}
                on{' '}
                <a href={t.where.href} target="_blank" rel="noopener noreferrer">
                  {t.where.label}
                </a>
              </>
            )}
            :
          </b>{' '}
          {t.text}
        </p>
      </div>
    </div>
  )
}

function Aside({ c }: { c: Chat }) {
  return (
    <div className="mu-c">
      <time dateTime={c.at}>{hm(c.at)}</time>
      <div>
        {c.re && (
          <p className="mu-ask">
            <b>{c.re.who}:</b> {c.re.text}
          </p>
        )}
        <p className="mu-chat">
          <b>{c.who}:</b> {c.text}
        </p>
      </div>
    </div>
  )
}

function Tally({ b }: { b: Board }) {
  return (
    <div className="mu-c mu-board">
      <time dateTime={b.at}>{hm(b.at)}</time>
      <div>
        {b.re && (
          <p className="mu-ask">
            <b>{b.re.who}:</b> {b.re.text}
          </p>
        )}
        <p className="mu-chat">
          <b>{b.who}:</b> {b.note ?? 'the seven tests'}
        </p>
        <ol>
          {b.rows.map(([n, v]) => (
            <li key={n} className={v === 0 ? 'z' : undefined}>
              <span>{n}</span>
              <b>{v.toLocaleString('en-US')}</b>
            </li>
          ))}
        </ol>
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
            <dd>{v.postedNote ? `${dm(v.at)}. ${v.postedNote}` : `${dm(v.at)}, ${hm(v.at)} UTC, #price-discussion`}</dd>
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
          {v.batch && (
            <div>
              <dt>Seven files, SHA-256 and build time</dt>
              <dd>
                <ul className="mu-batch">
                  {v.batch.map(f => (
                    <li key={f.name}>
                      <b>{f.name}</b> {hm(f.built)}
                      <span className="mu-hash">{f.sha256}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
        {v.missing && <div className="mu-missing">The file is not in the collection yet.</div>}
        {v.files && <p className="mu-files">{v.files}</p>}
        {v.cfb ? (
          <blockquote>
            {v.cfb}
            <cite>Come-from-Beyond, with the file</cite>
          </blockquote>
        ) : (
          v.note && <p className="mu-note">{v.note}</p>
        )}
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
  if (e.kind === 'chat') return <Aside c={e} />
  if (e.kind === 'board') return <Tally b={e} />
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
  const later = all.filter(e => e.at >= '2026-07-07')

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

          {DAYS.slice()
            .sort((a, b) => a.at.localeCompare(b.at))
            .map((d, n) => (
              <section key={d.at}>
                <h2 className={n ? 'mu-day mu-gap' : 'mu-day'}>{dm(d.at + 'T00:00:00Z')}</h2>
                <p className="mu-sub">{d.sub}</p>
                {day(d.at).map((e, i) => (
                  <Item key={i} e={e} />
                ))}
              </section>
            ))}

          {later.length > 0 && (
            <>
              <h2 className="mu-day mu-gap">After</h2>
              {later.map((e, i) => (
                <Item key={i} e={e} />
              ))}
            </>
          )}
        </div>

        <section className="mu-rec">
          <h2 className="mu-h2">Scores</h2>
          <p>
            Lower is better. From 18 June the score is counted a new way, so the newer numbers are not comparable with the older ones. The full record book
            follows.
          </p>
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

        <section className="mu-crew mu-hist">
          <h2 className="mu-h2">For historians</h2>
          <p>Posts Come-from-Beyond marked for history himself. More will be hung here.</p>
          {HISTORIANS.map(h => (
            <blockquote key={h.href}>
              <time dateTime={h.at}>{dm(h.at)}</time>
              <p>{h.text}</p>
              <small>{h.shows}</small>
              <a href={h.href} target="_blank" rel="noopener noreferrer">
                The post on X
              </a>
            </blockquote>
          ))}
        </section>

        <section className="mu-crew">
          <h2 className="mu-h2">The racers</h2>
          <p>Everyone on these screenshots who ran Anna.exe and posted what it showed. Their lines in the hall are verbatim, in italics.</p>
          <ul>
            {RACERS.map(r => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>

        <p className="mu-foot">
          The files are kept, not served. If you have a copy, compare its SHA-256 with the one on the label. Quotes are verbatim from the Qubic Discord; times
          were converted to UTC.
        </p>
      </div>
    </main>
  )
}
