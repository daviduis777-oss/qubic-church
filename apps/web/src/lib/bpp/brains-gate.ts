import 'server-only'
import { isModerator } from '@/lib/forum/auth'

/**
 * Brain Watch is a private preview until BRAINS_PUBLIC=1: a plain 404 for everyone but the forum moderator
 * (logged in at /articles/mod), on the page and on its API alike. Same gate as the pool.
 */
export const brainsPublic = () => process.env.BRAINS_PUBLIC === '1'

export async function brainsAllowed(req?: Request): Promise<boolean> {
  return brainsPublic() || (await isModerator(req))
}
