/**
 * The hidden "Aigarth Pool" tab. While POOL_PUBLIC is off only the forum moderator sees it; once it is on, everyone.
 * The moderator cookie is httpOnly, so the browser asks GET /api/pool/gate: {ok:true} for those who may see
 * the pool, a plain {ok:false} for everyone else (a 200, so no visitor's console shows an error on every page). The nav renders the link only after a yes, never hidden with CSS.
 * Pure and browser safe: the route and the nav share these, and the tests hold them.
 */

export const POOL_TAB = { href: '/pool', label: 'Aigarth Pool' } as const
export const POOL_GATE_URL = '/api/pool/gate'

/** Who may see the pool page, its API and the tab: everyone once public, the moderator before. */
export function canSeePool(g: { isPublic: boolean; moderator: boolean }): boolean {
  return g.isPublic || g.moderator
}

export type GateReply = { status: 200; body: { ok: true; preview: boolean } } | { status: 200; body: { ok: false } }

/** The gate endpoint's answer. preview: the page is still private, so the tab can say so to the moderator. */
export function gateReply(allowed: boolean, isPublic: boolean): GateReply {
  return allowed ? { status: 200, body: { ok: true, preview: !isPublic } } : { status: 200, body: { ok: false } }
}

export type PoolTab = { show: boolean; preview: boolean }
export const NO_TAB: PoolTab = { show: false, preview: false }

/** Ask the gate once. Anything but a 200 with ok:true (a 404, a network error, odd JSON) means no tab. */
export async function probePoolTab(f: (url: string, init?: RequestInit) => Promise<Response> = fetch): Promise<PoolTab> {
  try {
    const r = await f(POOL_GATE_URL, { cache: 'no-store', credentials: 'same-origin' })
    if (r.status !== 200) return NO_TAB
    const j = (await r.json()) as { ok?: unknown; preview?: unknown }
    return j?.ok === true ? { show: true, preview: j.preview === true } : NO_TAB
  } catch {
    return NO_TAB
  }
}
