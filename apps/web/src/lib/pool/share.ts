/**
 * Where a share card points, and the "Post on X" intent. One helper for the card image, the share sheet
 * and the intent, so the three never disagree. Pure and browser safe.
 *
 * While the pool is a private preview, /pool is a 404 for viewers, so the card points to the public
 * field guide (/mine-qubic) until POOL_PUBLIC is on.
 */
import { POOL } from './config.ts'
import { fmtRate } from './measure.ts'
import type { CardData } from './rig.ts'
import { SHARE } from './ui-config.ts'

export type ShareLink = { url: string; text: string }

/** The link on the card and in the post: /pool once public, the field guide before. */
export function shareLink(isPublic: boolean): ShareLink {
  const url = isPublic ? SHARE.publicUrl : SHARE.previewUrl
  return { url, text: url.replace(/^https?:\/\//, '') }
}

/** The post text: the rig's rate and epoch, where the numbers come from. Rates only, never income. */
export function shareText(c: Pick<CardData, 'src' | 'rate' | 'ep' | 'hw'>): string {
  const hw = c.hw && c.hw !== 'Hardware not given' ? ` on ${c.hw}` : ''
  const from = c.src === 'demo' ? 'A demo rig' : 'My rig'
  const note = c.src === 'log' ? ', read from my miner log' : c.src === 'demo' ? ', sample numbers' : ''
  return `${from} in ${POOL.name}, epoch ${c.ep}: ${fmtRate(c.rate)} sol/h${hw}${note}. Set up with Maria, the mining coach.`
}

/** X web intent with the text and the link. The image cannot ride along: the sheet saves it for the user to attach. */
export function xIntentUrl(text: string, link: ShareLink): string {
  return `${SHARE.xIntent}?${new URLSearchParams({ text, url: link.url }).toString()}`
}
