import 'server-only'
import { BRAIN_DEFAULTS, type Brain, brainApiUrl, FALLBACK_BRAIN } from './brain-schema.ts'
import { checkedBrain } from './prompt.ts'

/**
 * Maria's brain for the site, server only. It lives in the private repo (MARIA_BRAIN_REPO, default
 * daviduis777-oss/maria-aigarth-botv3) at pool/brain.json on MARIA_BRAIN_REF (default pool-brain), read through
 * the GitHub contents API with MARIA_BRAIN_TOKEN: a fine-grained token, that repository only, Contents and
 * Metadata read-only. The response is cached in the Next data cache for BRAIN_REVALIDATE seconds under
 * BRAIN_TAG (revalidateTag(BRAIN_TAG) drops it at once).
 *
 * Never breaks the site: without a token, on a failed fetch or a malformed file it returns the public
 * FALLBACK_BRAIN (hard safety rules and a generic coach instruction) and logs a warning.
 */
export const BRAIN_TAG = 'maria-brain'
export const BRAIN_REVALIDATE = 600

export type LoadedBrain = { brain: Brain; source: 'repo' | 'fallback'; reason?: string }

/** The last file text and its checked brain: the check assembles the whole prompt once, not per request. */
let memo: { text: string; brain: Brain } | null = null
/** One warning per reason per instance and BRAIN_REVALIDATE window, so a missing token does not flood the logs. */
const warned = new Map<string, number>()

function fallback(reason: string): LoadedBrain {
  const now = Date.now()
  if ((warned.get(reason) ?? 0) < now - BRAIN_REVALIDATE * 1000) {
    warned.set(reason, now)
    console.warn(`pool/maria brain: using the public fallback prompt (${reason})`)
  }
  return { brain: FALLBACK_BRAIN, source: 'fallback', reason }
}

export async function getBrain(): Promise<LoadedBrain> {
  const token = process.env.MARIA_BRAIN_TOKEN
  if (!token) return fallback('MARIA_BRAIN_TOKEN is not set')
  const url = brainApiUrl(process.env.MARIA_BRAIN_REPO || BRAIN_DEFAULTS.repo, process.env.MARIA_BRAIN_REF || BRAIN_DEFAULTS.ref)
  let text: string
  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw+json', 'X-GitHub-Api-Version': '2022-11-28' },
      next: { revalidate: BRAIN_REVALIDATE, tags: [BRAIN_TAG] },
      signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) return fallback(`GitHub answered ${r.status}`)
    text = await r.text()
  } catch (e) {
    return fallback(`fetch failed: ${e instanceof Error ? e.name : 'error'}`)
  }
  if (memo?.text === text) return { brain: memo.brain, source: 'repo' }
  try {
    const brain = checkedBrain(JSON.parse(text))
    memo = { text, brain }
    return { brain, source: 'repo' }
  } catch (e) {
    return fallback(`invalid brain file: ${e instanceof Error ? e.message.slice(0, 160) : 'parse error'}`)
  }
}
