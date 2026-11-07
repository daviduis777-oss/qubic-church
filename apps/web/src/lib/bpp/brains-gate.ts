import 'server-only'
import { isModerator } from '@/lib/forum/auth'

/**
 * Brain Watch is public since 8 November 2026 (Bob's go). BRAINS_PUBLIC=0 closes it again: a plain 404 for
 * everyone but the forum moderator (logged in at /articles/mod), on the page and on its API alike.
 */
export const brainsPublic = () => process.env.BRAINS_PUBLIC !== '0'

export async function brainsAllowed(req?: Request): Promise<boolean> {
  return brainsPublic() || (await isModerator(req))
}
