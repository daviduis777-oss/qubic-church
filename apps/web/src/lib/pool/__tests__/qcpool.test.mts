// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/qcpool.test.mts
// QC Pool: the hidden nav tab and its gate endpoint, the page order and its copy, Maria's home screen.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const N = await import('../nav.ts')
const Q = await import('../qc.ts')
const W = await import('../why.ts')
const { POOL } = await import('../config.ts')

const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/* ---------------- who may see the pool ---------------- */

test('nav: the pool is visible to the moderator while private, to everyone once public', () => {
  assert.equal(N.canSeePool({ isPublic: false, moderator: false }), false)
  assert.equal(N.canSeePool({ isPublic: false, moderator: true }), true)
  assert.equal(N.canSeePool({ isPublic: true, moderator: false }), true)
  assert.equal(N.canSeePool({ isPublic: true, moderator: true }), true)
})

test('gate endpoint: {ok:true} for those allowed, a plain 404 for everyone else', () => {
  assert.deepEqual(N.gateReply(true, false), { status: 200, body: { ok: true, preview: true } })
  assert.deepEqual(N.gateReply(true, true), { status: 200, body: { ok: true, preview: false } })
  assert.deepEqual(N.gateReply(false, false), { status: 404, body: { error: 'Not found' } })
  // a 404 says nothing about why: no hint that a page or a moderator exists
  assert.doesNotMatch(JSON.stringify(N.gateReply(false, false)), /mod|pool|preview|private/i)
})

test('gate endpoint: the route uses the same gate as the page, never caches, never indexes', () => {
  const route = src('../../../app/api/pool/gate/route.ts')
  assert.match(route, /export async function GET\(req: Request\)/)
  assert.match(route, /gateReply\(await poolAllowed\(req\), poolPublic\(\)\)/)
  assert.match(route, /no-store/)
  assert.match(route, /noindex/)
  assert.match(route, /Vary: 'Cookie'/)
  assert.doesNotMatch(route, /export async function (POST|PUT|DELETE)/)
  // the gate itself goes through the shared helper, and reads no cookie once public
  const gate = src('../gate.ts')
  assert.match(gate, /canSeePool\(\{ isPublic, moderator: !isPublic && \(await isModerator\(req\)\) \}\)/)
  // the page still answers 404 to everyone else
  const page = src('../../../app/[locale]/pool/page.tsx')
  assert.match(page, /if \(!\(await poolAllowed\(\)\)\) notFound\(\)/)
})

test('nav probe: a tab only after a 200 with ok:true; anything else means no tab', async () => {
  const seen: { url: string; init?: RequestInit }[] = []
  const f = (res: Response | Error) => async (url: string, init?: RequestInit) => {
    seen.push({ url, init })
    if (res instanceof Error) throw res
    return res
  }
  assert.deepEqual(await N.probePoolTab(f(json(200, { ok: true, preview: true }))), { show: true, preview: true })
  assert.deepEqual(await N.probePoolTab(f(json(200, { ok: true, preview: false }))), { show: true, preview: false })
  assert.deepEqual(await N.probePoolTab(f(json(404, { error: 'Not found' }))), N.NO_TAB)
  assert.deepEqual(await N.probePoolTab(f(json(200, { ok: false }))), N.NO_TAB)
  assert.deepEqual(await N.probePoolTab(f(json(200, { ok: 'true' }))), N.NO_TAB)
  assert.deepEqual(await N.probePoolTab(f(json(500, { ok: true }))), N.NO_TAB)
  assert.deepEqual(await N.probePoolTab(f(new Response('<html>', { status: 200 }))), N.NO_TAB)
  assert.deepEqual(await N.probePoolTab(f(new Error('offline'))), N.NO_TAB)
  assert.ok(seen.every(x => x.url === '/api/pool/gate' && x.init?.cache === 'no-store' && x.init?.credentials === 'same-origin'))
})

test('nav: the QC Pool link is rendered only after the gate says yes, never in the static list', () => {
  assert.deepEqual(N.POOL_TAB, { href: '/pool', label: 'QC Pool' })
  const nav = src('../../../components/church/navigation/GlobalNavTrigger.tsx')
  const list = nav.slice(nav.indexOf('const LINKS'), nav.indexOf('] as const'))
  assert.doesNotMatch(list, /'\/pool'|QC Pool/)
  assert.match(nav, /probePoolTab\(\)/)
  // both the desktop and the mobile menu render the tab behind the same condition, and nowhere else
  assert.equal(nav.match(/\{pool\.show && \(/g)?.length, 2)
  assert.equal(nav.match(/href=\{POOL_TAB\.href\}/g)?.length, 2)
  // no hiding with CSS: no hidden, invisible or sr-only class on the tab
  const tabs = nav.split('{pool.show && (').slice(1).map(x => x.slice(0, x.indexOf(')}')))
  for (const t of tabs) assert.doesNotMatch(t, /\bhidden\b|invisible|sr-only|display:\s*none|opacity-0/)
})

/* ---------------- the page, top to bottom ---------------- */

test('page: the quote first, then join, then Maria beside her phone, then the details', () => {
  const page = src('../../../app/[locale]/pool/page.tsx')
  const order = ['<Hero', '<Join', '<MariaIntro', '<MariaApp', 'id="how"', 'id="hw"', '<RecordStrip', '<WhoMines', 'id="terms"', 'className={p.partners}']
  const at = order.map(x => page.indexOf(x))
  assert.ok(at.every(i => i > 0), `missing: ${order.filter((_, i) => at[i] < 0).join(', ')}`)
  assert.deepEqual([...at].sort((a, b) => a - b), at)
  // the repeated column is gone everywhere
  for (const f of ['../../../app/[locale]/pool/page.tsx', '../../../app/[locale]/pool/qc.tsx', '../../../app/[locale]/pool/why.tsx']) {
    assert.doesNotMatch(src(f), /ask miners|ASK_SPAN|\bASK\b|<Why\b|Independence/)
  }
})

test('copy: verbatim where it must be, our aim never a claim about others, no em dashes', () => {
  assert.equal(Q.JOIN.title, 'Join Qubic Church Pool.')
  assert.match(Q.JOIN.aim, /^Our key task is decentralization\. We aim to keep Qubic’s founding principle/)
  assert.match(Q.JOIN.aim, /no single operator/)
  assert.deepEqual(
    Q.JOIN.proofs.map(p => p.id),
    ['wallet', 'record', 'coach', 'fee'],
  )
  assert.ok(Q.JOIN.proofs.find(p => p.id === 'fee')!.text.includes(`${POOL.feePercent}%`))
  assert.equal(Q.MARIA.role, 'Our self-learning mining coach.')
  assert.match(Q.MARIA.body[0]!, /develops with every rig she helps and every question she answers/)
  assert.ok(Q.MARIA.body.includes('Today she runs on Claude by Anthropic. She is built to move to Aigarth when it is ready.'))
  const all = JSON.stringify({ Q, W })
  assert.doesNotMatch(all, /—/)
  assert.doesNotMatch(all, /\bthe (only )?independent pool\b/i)
  assert.doesNotMatch(all, /revolutionary|crown of|game.?chang|guarantee|profit|\b20[0-9]{2}\b.*Aigarth/i)
  // how she learns is not explained
  assert.doesNotMatch(JSON.stringify(Q.MARIA), /fine-tun|train(ed|ing)|weights|dataset|model/i)
})

/* ---------------- Maria's home screen ---------------- */

test('home screen: eight apps, each a real screen, each shown once in the grid or the dock', () => {
  assert.deepEqual(
    Q.APPS.map(a => a.label),
    ['Pick hardware', 'Connect', 'Fix my rig', 'My rig', 'Ask Maria', 'The record', 'Who mines', 'Help'],
  )
  const app = src('../../../components/pool/maria/MariaApp.tsx')
  for (const a of Q.APPS) assert.match(app, new RegExp(`e\\.screen === '${a.id}'`), a.id)
  // labels fit an iOS label: one short line
  for (const a of Q.APPS) assert.ok(a.label.length <= 13, a.label)
  for (const ai of [true, false, null]) {
    const dock = Q.dockApps(ai)
    const grid = Q.gridApps(ai)
    assert.equal(dock.length, 4)
    assert.equal(grid.length, 4, 'one full row of four')
    assert.deepEqual([...dock, ...grid].sort(), Q.APPS.map(a => a.id).sort(), 'all eight, none twice')
    // the grid keeps the list's order
    assert.deepEqual(grid, Q.APPS.map(a => a.id).filter(id => grid.includes(id)))
  }
})

test('home screen: the dock holds the four most used, Ask Maria only once the AI is connected', () => {
  assert.deepEqual(Q.dockApps(true), ['pick', 'connect', 'doctor', 'ask'])
  assert.deepEqual(Q.dockApps(false), ['pick', 'connect', 'doctor', 'rig'])
  assert.deepEqual(Q.dockApps(null), Q.dockApps(false))
  assert.deepEqual(Q.gridApps(false), ['ask', 'record', 'who', 'help'])
  assert.deepEqual(Q.gridApps(true), ['rig', 'record', 'who', 'help'])
  assert.deepEqual(Q.askLabel(false), { pill: 'Ask Maria · coming soon', a11y: 'Ask Maria, coming soon' })
  assert.deepEqual(Q.askLabel(true), { pill: 'Ask Maria', a11y: 'Ask Maria' })
})

test('home screen: a pasted log in Ask Maria still goes to the log doctor', () => {
  const ask = src('../../../components/pool/maria/AskFlow.tsx')
  assert.match(ask, /if \(looksLikeLog\(raw\) && diagnose\(raw\)\.findings\.length\) return go\('doctor', \{ mode: raw \}\)/)
})
