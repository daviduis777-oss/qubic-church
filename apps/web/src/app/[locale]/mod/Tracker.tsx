'use client'

import { Check, Copy, ExternalLink, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  contextLine,
  issueMarkdown,
  NOTE_MAX,
  type ReportStatus,
  type ReportType,
  STATUS_LABEL,
  STATUSES,
  type StoredReport,
  TYPE_LABEL,
} from '@/lib/pool/report'
import m from './mod.module.css'

type View = 'inbox' | 'active' | 'closed' | 'all'
const VIEWS: { id: View; label: string; has: (s: ReportStatus) => boolean }[] = [
  { id: 'inbox', label: 'Inbox', has: s => s === 'new' || s === 'seen' },
  { id: 'active', label: 'Active', has: s => s === 'planned' || s === 'doing' },
  { id: 'closed', label: 'Closed', has: s => s === 'done' || s === 'no' },
  { id: 'all', label: 'All', has: () => true },
]
type Source = 'all' | 'site' | 'pool'
const isSite = (x: StoredReport) => x.ctx.app === 'site'

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

/** The tracker: every suggestion and report, with a status from New to Done or Declined and a private note. */
export function Tracker({ initial }: { initial: StoredReport[] | null }) {
  const [list, setList] = useState<StoredReport[]>(initial ?? [])
  const [view, setView] = useState<View>('inbox')
  const [source, setSource] = useState<Source>('all')
  const [kind, setKind] = useState<ReportType | 'all'>('all')
  const [busy, setBusy] = useState('')
  const [copied, setCopied] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState(initial === null ? 'The list could not be read just now. Reload in a moment.' : '')
  const [now] = useState(() => Date.now())

  const count = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map(s => [s, 0])) as Record<ReportStatus, number>
    for (const x of list) c[x.status] = (c[x.status] ?? 0) + 1
    return c
  }, [list])
  const kinds = useMemo(() => [...new Set(list.map(x => x.type))], [list])
  const has = VIEWS.find(v => v.id === view)!.has
  const shown = list.filter(x => has(x.status) && (source === 'all' || (source === 'site') === isSite(x)) && (kind === 'all' || x.type === kind))

  const save = async (id: string, change: { status?: ReportStatus; note?: string }) => {
    setBusy(id)
    setError('')
    try {
      const res = await fetch('/api/pool/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...change }),
      })
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; report?: StoredReport; error?: string }
      if (!res.ok || !j.ok || !j.report) throw new Error(j.error ?? `HTTP ${res.status}`)
      setList(l => l.map(x => (x.id === id ? (j.report as StoredReport) : x)))
      if (change.note !== undefined)
        setNotes(n => {
          const { [id]: _, ...rest } = n
          return rest
        })
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
    <section aria-labelledby="mod-tracker">
      <header className={m.head}>
        <div>
          <h2 className={m.sectionTitle} id="mod-tracker">
            Tracker
          </h2>
          <p className={m.counts}>
            {STATUSES.map(s => (
              <span key={s}>
                <b>{count[s]}</b> {STATUS_LABEL[s].toLowerCase()}
              </span>
            ))}
            <span className={m.dim}>{list.length} kept, newest first</span>
          </p>
        </div>
        <div aria-label="Show" className={m.seg} role="radiogroup">
          {VIEWS.map(f => (
            <label className={`${m.segItem} ${view === f.id ? m.segOn : ''}`} key={f.id}>
              <input checked={view === f.id} name="view" onChange={() => setView(f.id)} type="radio" value={f.id} />
              {f.label}
            </label>
          ))}
        </div>
      </header>

      <div className={m.filters}>
        <div aria-label="From" className={m.chips} role="group">
          {(['all', 'site', 'pool'] as const).map(s => (
            <button aria-pressed={source === s} className={`${m.chip} ${source === s ? m.chipOn : ''}`} key={s} onClick={() => setSource(s)} type="button">
              {s === 'all' ? 'Everywhere' : s === 'site' ? 'Site' : 'Pool'}
            </button>
          ))}
        </div>
        {kinds.length > 1 && (
          <div aria-label="Kind" className={m.chips} role="group">
            {(['all', ...kinds] as const).map(k => (
              <button aria-pressed={kind === k} className={`${m.chip} ${kind === k ? m.chipOn : ''}`} key={k} onClick={() => setKind(k)} type="button">
                {k === 'all' ? 'Every kind' : TYPE_LABEL[k]}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className={m.error} role="alert">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className={m.empty}>{list.length ? 'Nothing in this view.' : 'Nothing yet. Messages arrive from the Suggest page and the pool’s Report app.'}</p>
      ) : (
        <ol className={m.list}>
          {shown.map(x => {
            const draft = notes[x.id]
            const note = draft ?? x.note ?? ''
            const dirty = draft !== undefined && draft.trim() !== (x.note ?? '')
            const closed = x.status === 'done' || x.status === 'no'
            return (
              <li className={`${m.item} ${closed ? m.itemClosed : ''}`} key={x.id}>
                <div className={m.meta}>
                  <span className={`${m.badge} ${m[`b_${x.type}`] ?? ''}`}>{TYPE_LABEL[x.type] ?? x.type}</span>
                  <span className={m.src}>{isSite(x) ? 'site' : 'pool'}</span>
                  <time className={m.time} dateTime={new Date(x.at).toISOString()} title={when(x.at)}>
                    {ago(x.at, now)}
                  </time>
                  <code className={m.id}>{x.id.toUpperCase()}</code>
                </div>
                <div className={m.body}>
                  <div className={m.main}>
                    <p className={m.text}>{x.text}</p>
                    <dl className={m.facts}>
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
                        <dd>{x.contact ? `${isSite(x) ? '' : 'Discord '}${x.contact}` : <span className={m.dim}>none</span>}</dd>
                      </div>
                      <div>
                        <dt>Sent</dt>
                        <dd>{when(x.at)}</dd>
                      </div>
                    </dl>
                    {x.seed && (
                      <p className={m.seed}>
                        <ShieldAlert aria-hidden size={14} strokeWidth={2} />A seed was removed from this text before it was stored.
                      </p>
                    )}
                    <div className={m.note}>
                      <label htmlFor={`note-${x.id}`}>Your note (only you see it)</label>
                      <textarea
                        id={`note-${x.id}`}
                        maxLength={NOTE_MAX}
                        onChange={e => setNotes(n => ({ ...n, [x.id]: e.target.value }))}
                        placeholder="What to do, where it went, why it was declined"
                        value={note}
                      />
                      <div className={m.noteRow}>
                        <span>{x.updated ? `Changed ${ago(x.updated, now)}` : ''}</span>
                        <button className={m.saveNote} disabled={!dirty || busy === x.id} onClick={() => save(x.id, { note })} type="button">
                          Save note
                        </button>
                      </div>
                    </div>
                  </div>
                  {x.img && (
                    <a
                      aria-label={`Open the screenshot of ${x.id.toUpperCase()}`}
                      className={m.shot}
                      href={`/api/pool/reports/image?id=${x.id}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {/* biome-ignore lint/performance/noImgElement: a moderator-only image route, never optimised or cached */}
                      <img alt="" decoding="async" loading="lazy" src={`/api/pool/reports/image?id=${x.id}`} />
                      <span className={m.shotTag}>
                        {x.img.type.toUpperCase()} · {Math.max(1, Math.round(x.img.bytes / 1000))} KB
                        <ExternalLink aria-hidden size={12} strokeWidth={2} />
                      </span>
                    </a>
                  )}
                </div>
                <div className={m.actions}>
                  <select
                    aria-label={`Status of ${x.id.toUpperCase()}`}
                    className={`${m.select} ${m[`s_${x.status}`] ?? ''}`}
                    disabled={busy === x.id}
                    onChange={e => save(x.id, { status: e.target.value as ReportStatus })}
                    value={x.status}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  {x.status === 'new' && (
                    <button disabled={busy === x.id} onClick={() => save(x.id, { status: 'seen' })} type="button">
                      Mark seen
                    </button>
                  )}
                  {!closed && (
                    <button className={m.primary} disabled={busy === x.id} onClick={() => save(x.id, { status: 'done' })} type="button">
                      <Check aria-hidden size={15} strokeWidth={2.4} />
                      Done
                    </button>
                  )}
                  <button className={m.ghost} onClick={() => copy(x)} type="button">
                    {copied === x.id ? <Check aria-hidden size={15} strokeWidth={2.4} /> : <Copy aria-hidden size={15} strokeWidth={2} />}
                    {copied === x.id ? 'Copied' : 'Copy as GitHub issue'}
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
