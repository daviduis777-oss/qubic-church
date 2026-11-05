'use client'

import { Check, Copy, ExternalLink, Eye, RotateCcw, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { contextLine, issueMarkdown, REPORT_TYPES, type ReportStatus, STATUS_LABEL, type StoredReport } from '@/lib/pool/report'
import r from './reports.module.css'

type Filter = 'open' | 'done' | 'all'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
]

const when = (at: number) => {
  const d = new Date(at)
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return `${date}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`
}

const ago = (at: number, now: number) => {
  const m = Math.max(0, Math.round((now - at) / 60_000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 48) return `${h} h ago`
  return `${Math.round(h / 24)} days ago`
}

/** The moderator's list: filter, mark seen or done, copy one as a GitHub issue. */
export function ReportsBoard({ initial }: { initial: StoredReport[] | null }) {
  const [list, setList] = useState<StoredReport[]>(initial ?? [])
  const [filter, setFilter] = useState<Filter>('open')
  const [busy, setBusy] = useState('')
  const [copied, setCopied] = useState('')
  const [error, setError] = useState(initial === null ? 'The reports could not be read just now. Reload in a moment.' : '')
  const [now] = useState(() => Date.now())

  const counts = useMemo(() => ({ new: list.filter(x => x.status === 'new').length, seen: list.filter(x => x.status === 'seen').length, done: list.filter(x => x.status === 'done').length }), [list])
  const shown = list.filter(x => (filter === 'all' ? true : filter === 'done' ? x.status === 'done' : x.status !== 'done'))

  const mark = async (id: string, status: ReportStatus) => {
    setBusy(id)
    setError('')
    try {
      const res = await fetch('/api/pool/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; report?: StoredReport; error?: string }
      if (!res.ok || !j.ok || !j.report) throw new Error(j.error ?? `HTTP ${res.status}`)
      setList(l => l.map(x => (x.id === id ? (j.report as StoredReport) : x)))
    } catch (e) {
      setError(`Could not update ${id.toUpperCase()}: ${e instanceof Error ? e.message : 'error'}`)
    } finally {
      setBusy('')
    }
  }

  const copy = async (x: StoredReport) => {
    const { title, body } = issueMarkdown(x, window.location.origin)
    try {
      await navigator.clipboard.writeText(`# ${title}\n\n${body}`)
      setCopied(x.id)
      setTimeout(() => setCopied(c => (c === x.id ? '' : c)), 1800)
    } catch {
      setError('The clipboard is not available in this browser.')
    }
  }

  return (
    <main className={r.page}>
      <header className={r.head}>
        <div>
          <p className={r.kicker}>Aigarth Pool · moderator only</p>
          <h1 className={r.title}>
            <span className={r.serif}>Reports</span>
          </h1>
          <p className={r.counts}>
            <span>
              <b>{counts.new}</b> new
            </span>
            <span>
              <b>{counts.seen}</b> seen
            </span>
            <span>
              <b>{counts.done}</b> done
            </span>
            <span className={r.dim}>{list.length} kept, newest first</span>
          </p>
        </div>
        <div aria-label="Show" className={r.seg} role="radiogroup">
          {FILTERS.map(f => (
            <label className={`${r.segItem} ${filter === f.id ? r.segOn : ''}`} key={f.id}>
              <input checked={filter === f.id} name="filter" onChange={() => setFilter(f.id)} type="radio" value={f.id} />
              {f.label}
            </label>
          ))}
        </div>
      </header>

      {error && (
        <p className={r.error} role="alert">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className={r.empty}>{list.length ? 'Nothing here. Everything in this view is handled.' : 'No reports yet. They arrive from the Report app on Maria’s phone.'}</p>
      ) : (
        <ol className={r.list}>
          {shown.map(x => {
            const type = REPORT_TYPES.find(t => t.id === x.type)
            return (
              <li className={`${r.item} ${x.status === 'done' ? r.itemDone : ''}`} key={x.id}>
                <div className={r.meta}>
                  <span className={`${r.badge} ${r[`b_${x.type}`]}`}>{type?.label ?? x.type}</span>
                  <span className={`${r.status} ${r[`s_${x.status}`]}`}>{STATUS_LABEL[x.status]}</span>
                  <time className={r.time} dateTime={new Date(x.at).toISOString()} title={when(x.at)}>
                    {ago(x.at, now)}
                  </time>
                  <code className={r.id}>{x.id.toUpperCase()}</code>
                </div>
                <div className={r.body}>
                  <div className={r.main}>
                    <p className={r.text}>{x.text}</p>
                    <dl className={r.facts}>
                      <div>
                        <dt>From</dt>
                        <dd>{contextLine(x.ctx)}</dd>
                      </div>
                      <div>
                        <dt>Device</dt>
                        <dd>{x.ua}</dd>
                      </div>
                      <div>
                        <dt>Contact</dt>
                        <dd>{x.contact ? `Discord ${x.contact}` : <span className={r.dim}>none</span>}</dd>
                      </div>
                      <div>
                        <dt>Sent</dt>
                        <dd>{when(x.at)}</dd>
                      </div>
                    </dl>
                    {x.seed && (
                      <p className={r.seed}>
                        <ShieldAlert aria-hidden size={14} strokeWidth={2} />A seed was removed from this text before it was stored.
                      </p>
                    )}
                  </div>
                  {x.img && (
                    <a aria-label={`Open the screenshot of ${x.id.toUpperCase()}`} className={r.shot} href={`/api/pool/reports/image?id=${x.id}`} rel="noopener noreferrer" target="_blank">
                      {/* biome-ignore lint/performance/noImgElement: a moderator-only image route, never optimised or cached */}
                      <img alt="" decoding="async" loading="lazy" src={`/api/pool/reports/image?id=${x.id}`} />
                      <span className={r.shotTag}>
                        {x.img.type.toUpperCase()} · {Math.max(1, Math.round(x.img.bytes / 1000))} KB
                        <ExternalLink aria-hidden size={12} strokeWidth={2} />
                      </span>
                    </a>
                  )}
                </div>
                <div className={r.actions}>
                  {x.status === 'new' && (
                    <button disabled={busy === x.id} onClick={() => mark(x.id, 'seen')} type="button">
                      <Eye aria-hidden size={15} strokeWidth={2} />
                      Mark seen
                    </button>
                  )}
                  {x.status !== 'done' ? (
                    <button className={r.primary} disabled={busy === x.id} onClick={() => mark(x.id, 'done')} type="button">
                      <Check aria-hidden size={15} strokeWidth={2.4} />
                      Mark done
                    </button>
                  ) : (
                    <button disabled={busy === x.id} onClick={() => mark(x.id, 'seen')} type="button">
                      <RotateCcw aria-hidden size={15} strokeWidth={2} />
                      Reopen
                    </button>
                  )}
                  <button className={r.ghost} onClick={() => copy(x)} type="button">
                    {copied === x.id ? <Check aria-hidden size={15} strokeWidth={2.4} /> : <Copy aria-hidden size={15} strokeWidth={2} />}
                    {copied === x.id ? 'Copied' : 'Copy as GitHub issue'}
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </main>
  )
}
