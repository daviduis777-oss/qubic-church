import { NextResponse } from 'next/server'
import { getBrain } from '@/lib/pool/brain'
import { MARIA_LIMITS } from '@/lib/pool/config'
import { poolAllowed } from '@/lib/pool/gate'
import { mariaNowBlock, mariaRequestBlock, mariaSystemStatic, stalenessNote } from '@/lib/pool/prompt'
import { clientIp, takeMessage } from '@/lib/pool/ratelimit'
import { redactWallets } from '@/lib/pool/redact'
import { marketPromptBlock, ratesFrom } from '@/lib/pool/market'
import { liveOffers } from '@/lib/pool/market-fetch'
import { measureStore } from '@/lib/pool/store'

export const dynamic = 'force-dynamic'

type Msg = { role: 'user' | 'assistant'; content: string }

const TOOLS_HINT = 'Pick hardware, Connect my machine and Fix my rig still work: they run right here, without the AI.'
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/**
 * The model, configurable with MARIA_MODEL. Blind grades, 30 fresh items each, 5 Nov 2026, same prompt per exam:
 * exam 4 Sonnet 86.7%, Haiku 65.0%; exam 5 Sonnet 80.0%, Haiku 70.0%. Both favour Sonnet; the default stays Haiku
 * until Bob decides.
 */
const model = () => process.env.MARIA_MODEL || 'claude-sonnet-5-5'
const fail = (status: number, reason: string, message: string) => NextResponse.json({ reason, message }, { status, headers })

/**
 * Ask Maria: free-form questions to the Anthropic Messages API, streamed back as plain text.
 * Wallet strings are removed before anything leaves the server; request bodies are never logged.
 */
export async function POST(req: Request) {
  if (!(await poolAllowed(req))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })

  const body = (await req.json().catch(() => null)) as { messages?: unknown } | null
  const raw = Array.isArray(body?.messages) ? (body.messages as unknown[]) : []
  const messages: Msg[] = raw
    .filter((m): m is Msg => !!m && typeof m === 'object' && ((m as Msg).role === 'user' || (m as Msg).role === 'assistant') && typeof (m as Msg).content === 'string')
    .slice(-MARIA_LIMITS.maxTurns * 2)
    .map(m => ({ role: m.role, content: redactWallets(m.content).slice(0, MARIA_LIMITS.maxInput * 2) }))
  while (messages.length && messages[0]!.role !== 'user') messages.shift()
  const last = messages.at(-1)
  if (!last || last.role !== 'user' || !last.content.trim()) return fail(400, 'empty', 'Write a question first.')
  if (last.content.length > MARIA_LIMITS.maxInput) return fail(413, 'too_long', `Keep it under ${MARIA_LIMITS.maxInput} characters. For a long log, use Fix my rig.`)

  // Decided by code for this request: the answer language (from the user's own sentences only, never from pasted
  // log or config lines), and for a pasted log the pattern scan's findings as PRIVATE HINTS: unverified, for the AI
  // only, never mentioned to the user; the AI verifies each against the log and drops what the log does not support.
  // Only the fact that a seed was removed passes on.
  const rawLast = raw.filter((m): m is Msg => !!m && typeof m === 'object' && (m as Msg).role === 'user' && typeof (m as Msg).content === 'string').at(-1)?.content ?? ''

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return fail(503, 'no_key', `Ask Maria is offline: the AI is not connected yet. ${TOOLS_HINT}`)

  // the brain (prompt text, playbook, rules, FAQ) comes from the private repo, cached about 10 minutes;
  // without it a public fallback prompt with the hard safety rules answers, so the AI never goes down with it
  const { brain } = await getBrain()
  const request = mariaRequestBlock(brain, messages, rawLast)

  const quota = await takeMessage(clientIp(req), MARIA_LIMITS.perDay)
  if (!quota.ok) return fail(429, 'limit', `That is today's ${MARIA_LIMITS.perDay} questions from this connection. The limit resets at 00:00 UTC. ${TOOLS_HINT}`)

  // MEASURED table: a per-epoch snapshot, so the cached block only changes when the epoch does
  // LIVE RENTALS: cached for a few minutes; a marketplace that does not answer never blocks the reply
  const [measured, live] = await Promise.all([measureStore().promptSnapshot().catch(() => null), Promise.race([liveOffers().catch(() => null), new Promise<null>(r => setTimeout(() => r(null), 2500))])])

  let upstream: Response
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: model(),
        max_tokens: 700,
        // the long static prompt is cached; the epoch line and the request block (language, private hints) change per request
        system: [
          { type: 'text', text: mariaSystemStatic(brain, measured), cache_control: { type: 'ephemeral' } },
          { type: 'text', text: mariaNowBlock() },
          { type: 'text', text: request },
          { type: 'text', text: marketPromptBlock(live, ratesFrom(measured)) },
        ],
        messages,
        stream: true,
      }),
      cache: 'no-store',
    })
  } catch {
    return fail(502, 'upstream', `The AI did not answer. Try again in a minute. ${TOOLS_HINT}`)
  }
  if (!upstream.ok || !upstream.body) {
    console.warn('pool/maria upstream status', upstream.status)
    return fail(502, 'upstream', `The AI did not answer (${upstream.status}). Try again in a minute. ${TOOLS_HINT}`)
  }

  // Anthropic server-sent events -> plain text deltas.
  const dec = new TextDecoder()
  const enc = new TextEncoder()
  let buf = ''
  // the whole answer, for the staleness caveat appended after the last delta
  let said = ''
  let cut = false
  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const reader = upstream.body!.getReader()
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          let i: number
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const evt = buf.slice(0, i)
            buf = buf.slice(i + 2)
            const data = evt.split('\n').find(l => l.startsWith('data:'))?.slice(5).trim()
            if (!data) continue
            try {
              const j = JSON.parse(data) as { type?: string; delta?: { type?: string; text?: string } }
              if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta' && j.delta.text) {
                said += j.delta.text
                ctrl.enqueue(enc.encode(j.delta.text))
              }
              if (j.type === 'error') {
                cut = true
                ctrl.enqueue(enc.encode('\n\nThe answer was cut off. Ask again.'))
              }
            } catch {}
          }
        }
      } catch {
        cut = true
        ctrl.enqueue(enc.encode('\n\nThe answer was cut off. Ask again.'))
      }
      // E229/E233-era numbers without their "predates" caveat get one short line, in the user's language
      const note = cut ? '' : stalenessNote(brain, said, last.content)
      if (note) ctrl.enqueue(enc.encode(note))
      ctrl.close()
    },
  })
  return new Response(stream, { headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8', 'X-Maria-Remaining': String(quota.remaining) } })
}

export async function GET(req: Request) {
  if (!(await poolAllowed(req))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
  // brain: the private brain's version stamp, or "fallback" (no token, fetch failed or a malformed file)
  const { brain } = await getBrain()
  return NextResponse.json({ ai: Boolean(process.env.ANTHROPIC_API_KEY), perDay: MARIA_LIMITS.perDay, maxInput: MARIA_LIMITS.maxInput, brain: brain.version }, { headers })
}
