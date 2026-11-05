import 'server-only'
import { isModerator } from '@/lib/forum/auth'
import { canSeePool } from './nav'

/**
 * The pool page is a private preview until POOL_PUBLIC=1.
 * Until then only the forum moderator (logged in at /articles/mod) sees the page or reaches its API.
 */
export const poolPublic = () => process.env.POOL_PUBLIC === '1'

export async function poolAllowed(req?: Request): Promise<boolean> {
  const isPublic = poolPublic()
  // once public, no cookie is read at all
  return canSeePool({ isPublic, moderator: !isPublic && (await isModerator(req)) })
}
