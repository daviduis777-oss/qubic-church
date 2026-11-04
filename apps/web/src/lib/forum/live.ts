import 'server-only'
import { cache } from 'react'
import { BUNDLED_INPUT, buildForum, type ForumInput, type MemberLink, type Profile, type Reply } from '@/lib/forum'
import type { Article } from '@/lib/articles'
import { githubApi } from './github'
import { ARTICLES_PATH, MEMBERS_PATH, PROFILES_PATH, REPLIES_PATH } from './publish'
import { FORUM_TAG, REVALIDATE } from './revalidate'

/**
 * The forum's data, read live from the repository instead of from the copy bundled at build time,
 * so a post shows up as soon as it is committed rather than after the next deploy.
 *
 * Every read goes through Next's data cache under the tag FORUM_TAG: pages are ISR, GitHub is asked
 * at most once per file per REVALIDATE seconds, and every write calls revalidateForum() (./revalidate.ts),
 * which drops the cache so the next view is fresh. Without GITHUB_TOKEN (local dev), or when GitHub fails,
 * the bundled JSON is used.
 */
export { FORUM_TAG, REVALIDATE }

async function readLive<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN is not set')
  // The raw media type returns the file itself, which also works past the 1 MB limit of the JSON form.
  const r = await fetch(`${githubApi()}/contents/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw', 'X-GitHub-Api-Version': '2022-11-28' },
    next: { tags: [FORUM_TAG], revalidate: REVALIDATE },
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) throw new Error(`GitHub ${r.status} for ${path}`)
  return (await r.json()) as T
}

/** One file, live, or its bundled copy when the live read fails. */
async function withFallback<T>(path: string, bundled: T, ok: (v: unknown) => boolean): Promise<{ data: T; live: boolean }> {
  try {
    const data = await readLive<T>(path)
    if (!ok(data)) throw new Error(`unexpected shape in ${path}`)
    return { data, live: true }
  } catch (e) {
    if (process.env.GITHUB_TOKEN) console.warn(`[forum] live read failed, using the bundled copy: ${(e as Error).message}`)
    return { data: bundled, live: false }
  }
}

const isObject = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The four data files: live when possible, file by file falling back to the bundle. */
export const getForumData = cache(async (): Promise<ForumInput & { source: 'github' | 'bundle' | 'mixed' }> => {
  const [articles, replies, profiles, members] = await Promise.all([
    withFallback<Article[]>(ARTICLES_PATH, BUNDLED_INPUT.articles, Array.isArray),
    withFallback<Reply[]>(REPLIES_PATH, BUNDLED_INPUT.replies, Array.isArray),
    withFallback<Record<string, Profile>>(PROFILES_PATH, BUNDLED_INPUT.profiles, isObject),
    withFallback<MemberLink[]>(MEMBERS_PATH, BUNDLED_INPUT.members ?? [], Array.isArray),
  ])
  const live = [articles, replies, profiles, members].filter(x => x.live).length
  return { articles: articles.data, replies: replies.data, profiles: profiles.data, members: members.data, source: live === 4 ? 'github' : live === 0 ? 'bundle' : 'mixed' }
})

/** The forum built from the live data. Memoized per request, so metadata and page share one build. */
export const getForum = cache(async () => buildForum(await getForumData()))
