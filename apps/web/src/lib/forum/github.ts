import 'server-only'

/**
 * The forum's storage is the site's own GitHub repository:
 * pending posts are Issues labelled forum-pending; approved posts are committed
 * into src/data/articles/*.json, which redeploys the site. No database.
 */
const REPO = process.env.GITHUB_REPO || 'daviduis777-oss/qubic-church'
const API = `https://api.github.com/repos/${REPO}`

function headers() {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN is not set')
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' }
}

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) }, cache: 'no-store' })
  if (!r.ok) throw new Error(`GitHub ${r.status} ${path}: ${(await r.text()).slice(0, 200)}`)
  return (await r.json()) as T
}

export const LABEL_PENDING = 'forum-pending'
export const LABEL_APPROVED = 'forum-approved'
export const LABEL_REJECTED = 'forum-rejected'

export type Pending = {
  kind: 'topic' | 'reply'
  title: string
  text: string
  board?: 'open'
  topic?: string
  xUrl?: string
  author: { auth: 'qubic' | 'trip'; id: string; name: string; handle: string }
  date: string
}

export type Issue = { number: number; title: string; body: string; created_at: string; labels: { name: string }[]; html_url: string }

export async function createPending(p: Pending): Promise<Issue> {
  const title = `[${p.kind}] ${p.title.slice(0, 80)} · ${p.author.name}`
  return gh<Issue>('/issues', { method: 'POST', body: JSON.stringify({ title, body: '```json\n' + JSON.stringify(p, null, 1) + '\n```', labels: [LABEL_PENDING] }) })
}

export async function listPending(): Promise<(Issue & { data: Pending })[]> {
  const issues = await gh<Issue[]>(`/issues?state=open&labels=${LABEL_PENDING}&per_page=50&sort=created&direction=asc`)
  return issues.flatMap(i => {
    const m = i.body?.match(/```json\n([\s\S]*?)\n```/)
    if (!m) return []
    try {
      return [{ ...i, data: JSON.parse(m[1]!) as Pending }]
    } catch {
      return []
    }
  })
}

export async function getPending(n: number): Promise<(Issue & { data: Pending }) | null> {
  const i = await gh<Issue>(`/issues/${n}`)
  const m = i.body?.match(/```json\n([\s\S]*?)\n```/)
  if (!m || !i.labels.some(l => l.name === LABEL_PENDING)) return null
  return { ...i, data: JSON.parse(m[1]!) as Pending }
}

export async function closePending(n: number, label: string, comment?: string) {
  if (comment) await gh(`/issues/${n}/comments`, { method: 'POST', body: JSON.stringify({ body: comment }) })
  await gh(`/issues/${n}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed', labels: [label] }) })
}

export async function countPendingBy(id: string): Promise<number> {
  const all = await listPending()
  return all.filter(i => i.data.author.id === id).length
}

/** Read a JSON file from the default branch. */
export async function readJson<T>(path: string): Promise<{ data: T; sha: string }> {
  const f = await gh<{ content: string; sha: string }>(`/contents/${path}`)
  return { data: JSON.parse(Buffer.from(f.content, 'base64').toString('utf8')) as T, sha: f.sha }
}

/** Commit a JSON file to the default branch (one commit = one deploy). */
export async function writeJson(path: string, data: unknown, sha: string, message: string) {
  const content = Buffer.from(JSON.stringify(data, null, 1) + '\n', 'utf8').toString('base64')
  await gh(`/contents/${path}`, { method: 'PUT', body: JSON.stringify({ message, content, ...(sha ? { sha } : {}), committer: { name: 'Qubic Church Forum', email: 'forum@qubic.church' } }) })
}
