import 'server-only'
import { revalidatePath, revalidateTag } from 'next/cache'

/** Cache tag on every live read of the forum's data (see ./live.ts). */
export const FORUM_TAG = 'forum'
/** Seconds before a cached copy is refetched even without a write. Pages under /articles use the same value. */
export const REVALIDATE = 300

/**
 * After a write to the forum's data: drop the cached copy and every rendered page under /articles,
 * in every locale, so the next view reads the new commit. `expire: 0` makes that view wait for fresh
 * data instead of being served the stale page once. Never throws: the write itself already succeeded.
 */
export function revalidateForum() {
  try {
    revalidateTag(FORUM_TAG, { expire: 0 })
    revalidatePath('/[locale]/articles', 'layout')
  } catch (e) {
    console.warn(`[forum] revalidation failed: ${(e as Error).message}`)
  }
}
