'use client'

import { Check, ImagePlus, LoaderCircle, ShieldAlert, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { containsAddress, hadSeed } from '@/lib/pool/redact'
import { REPORT, type ReportType, redactReport, SITE_TYPES } from '@/lib/pool/report'
import { kb, type Shot, shrink } from '@/lib/pool/shrink-image'
import { cn } from '@/lib/utils'

/** The page the visitor came from, if it was on this site: a hint for the moderator, never sent as a full URL. */
function cameFrom(): string {
  try {
    const r = document.referrer ? new URL(document.referrer) : null
    if (r && r.host === window.location.host && !r.pathname.endsWith('/suggest')) return r.pathname
  } catch {}
  const q = new URLSearchParams(window.location.search).get('from')
  return q?.startsWith('/') ? q : '/'
}

/** One form: a kind, the text, an optional handle and screenshot. It posts to /api/feedback. */
export function SuggestForm() {
  const ids = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<ReportType>('idea')
  const [text, setText] = useState('')
  const [contact, setContact] = useState('')
  const [trap, setTrap] = useState('')
  const [shot, setShot] = useState<Shot | null>(null)
  const [shotBusy, setShotBusy] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<'edit' | 'sending' | 'sent'>('edit')
  const [sent, setSent] = useState<{ id: string; seed: boolean } | null>(null)
  const [page, setPage] = useState('/')
  useEffect(() => setPage(cameFrom()), [])

  const kind = SITE_TYPES.find(t => t.id === type) ?? SITE_TYPES[0]!
  const len = redactReport(text).text.length
  const ready = len >= REPORT.minText && len <= REPORT.maxText && !shotBusy && phase === 'edit'
  const secret = hadSeed(text) || containsAddress(text)

  const pick = async (f: File | undefined) => {
    if (!f) return
    setError('')
    setShotBusy(true)
    try {
      setShot(await shrink(f))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That picture could not be attached.')
    } finally {
      setShotBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setPhase('sending')
    setError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, text: redactReport(text).text, contact: contact.trim() || undefined, image: shot?.dataUrl, page, website: trap }),
      })
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; seed?: boolean; error?: string }
      if (!res.ok || !j.ok) throw new Error(j.error ?? 'It did not go through. Try again in a minute.')
      setSent({ id: j.id ?? '', seed: Boolean(j.seed) })
      setPhase('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'It did not go through. Try again in a minute.')
      setPhase('edit')
    }
  }

  const again = () => {
    setText('')
    setShot(null)
    setSent(null)
    setError('')
    setPhase('edit')
  }

  if (phase === 'sent' && sent)
    return (
      <section aria-live="polite" className="border border-gold/40 bg-card p-6 sm:p-8">
        <p className="flex items-center gap-2 text-lg font-medium text-foreground">
          <Check aria-hidden className="size-5 text-gold" />
          Sent. Thank you.
        </p>
        <p className="mt-3 leading-relaxed text-fg-2">
          It is in the list now
          {sent.id && sent.id !== 'r0' ? (
            <>
              {' '}
              as <code className="font-mono text-foreground">{sent.id.toUpperCase()}</code>
            </>
          ) : null}
          . {contact.trim() ? `If we have a question or it ships, we may write to ${contact.trim()}.` : 'We read every message.'}
        </p>
        {sent.seed && <p className="mt-3 text-sm text-fg-2">A seed or an address was in the text. It was removed before the message was stored.</p>}
        <button
          className="mt-6 inline-flex h-10 items-center border border-gold/50 px-4 text-sm font-medium text-gold transition-colors hover:border-gold hover:bg-gold/10"
          onClick={again}
          type="button"
        >
          Send another
        </button>
      </section>
    )

  return (
    <form className="space-y-6 border border-border bg-card p-6 sm:p-8" noValidate onSubmit={send}>
      <fieldset>
        <legend className="eyebrow mb-3 text-muted-foreground">What is it?</legend>
        <div className="flex flex-wrap gap-2">
          {SITE_TYPES.map(t => (
            <label
              className={cn(
                'relative inline-flex h-10 cursor-pointer items-center border px-4 text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold',
                type === t.id ? 'border-gold bg-gold/10 text-gold' : 'border-border text-fg-2 hover:border-gold/50 hover:text-foreground',
              )}
              key={t.id}
            >
              <input
                checked={type === t.id}
                className="absolute inset-0 cursor-pointer opacity-0"
                name={`${ids}type`}
                onChange={() => setType(t.id)}
                type="radio"
                value={t.id}
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="block font-medium text-foreground" htmlFor={`${ids}text`}>
          {kind.ask}
        </label>
        <textarea
          aria-describedby={`${ids}count`}
          className="mt-2 block min-h-40 w-full resize-y border border-border bg-background px-3 py-2.5 leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          id={`${ids}text`}
          maxLength={REPORT.maxText + 200}
          onChange={e => setText(e.target.value)}
          placeholder={kind.placeholder}
          value={text}
        />
        <p className={cn('mt-1.5 text-right text-xs tabular-nums', len > REPORT.maxText ? 'text-destructive' : 'text-muted-foreground')} id={`${ids}count`}>
          {len < REPORT.minText ? `At least ${REPORT.minText} characters` : `${len.toLocaleString('en-US')} / ${REPORT.maxText.toLocaleString('en-US')}`}
        </p>
        {secret && (
          <p className="mt-2 flex items-start gap-2 text-sm text-fg-2">
            <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
            This looks like a seed or a wallet address. It will be removed before the message is stored. Never share a seed with anyone.
          </p>
        )}
      </div>

      <div>
        <label className="block font-medium text-foreground" htmlFor={`${ids}contact`}>
          Your Discord or X handle <span className="font-normal text-muted-foreground">(optional, if you would like a reply)</span>
        </label>
        <input
          autoComplete="off"
          className="mt-2 block h-11 w-full border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none sm:max-w-xs"
          id={`${ids}contact`}
          maxLength={40}
          onChange={e => setContact(e.target.value)}
          placeholder="@name"
          value={contact}
        />
      </div>

      <div aria-hidden className="hidden">
        <label>
          Website
          <input autoComplete="off" onChange={e => setTrap(e.target.value)} tabIndex={-1} value={trap} />
        </label>
      </div>

      <div>
        {shot ? (
          <div className="flex items-center gap-3">
            {/* biome-ignore lint/performance/noImgElement: a local preview of a data URL */}
            <img alt="Your screenshot" className="h-16 w-auto border border-border" src={shot.dataUrl} />
            <span className="text-sm text-fg-2">Screenshot, {kb(shot.bytes)}</span>
            <button
              aria-label="Remove the screenshot"
              className="inline-flex size-9 items-center justify-center text-fg-2 hover:text-foreground"
              onClick={() => setShot(null)}
              type="button"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ) : (
          <button
            className="inline-flex h-10 items-center gap-2 border border-dashed border-border px-4 text-sm text-fg-2 transition-colors hover:border-gold/50 hover:text-foreground disabled:opacity-60"
            disabled={shotBusy}
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            {shotBusy ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <ImagePlus aria-hidden className="size-4" />}
            {shotBusy ? 'Preparing the picture' : 'Add a screenshot (optional)'}
          </button>
        )}
        <input
          accept="image/*"
          aria-label="Screenshot file"
          className="hidden"
          onChange={e => pick(e.target.files?.[0])}
          ref={fileRef}
          tabIndex={-1}
          type="file"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        className="inline-flex h-11 items-center gap-2 bg-gold px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!ready}
        type="submit"
      >
        {phase === 'sending' && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
        {phase === 'sending' ? 'Sending' : 'Send'}
      </button>
    </form>
  )
}
