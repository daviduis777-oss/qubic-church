import { githubApi } from '@/lib/forum/github'
import { FORUM_TAG } from '@/lib/forum/revalidate'

/**
 * A member's avatar, read from the repository, so a picture uploaded in the cabinet shows at once
 * instead of after the next deploy (public/forum/avatars only changes on a build).
 * The URL carries ?v=<upload time>, so each version is cached for good by browsers and the CDN.
 * Without GITHUB_TOKEN, or when GitHub fails, it redirects to the copy in public/.
 */
const FILE = /^[a-z0-9_-]{1,40}\.jpg$/

export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params
  if (!FILE.test(file)) return new Response('Not found', { status: 404 })
  const token = process.env.GITHUB_TOKEN
  if (token) {
    try {
      // Cached under the forum tag: an upload (a write) drops it, like the rest of the forum's data.
      const r = await fetch(`${githubApi()}/contents/apps/web/public/forum/avatars/${file}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw', 'X-GitHub-Api-Version': '2022-11-28' },
        next: { tags: [FORUM_TAG], revalidate: 86400 },
        signal: AbortSignal.timeout(8000),
      })
      if (r.ok) {
        const body = await r.arrayBuffer()
        if (body.byteLength > 2 && new Uint8Array(body)[0] === 0xff) {
          return new Response(body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' } })
        }
      }
    } catch {
      // fall through to the bundled copy
    }
  }
  return Response.redirect(new URL(`/forum/avatars/${file}`, req.url), 307)
}
