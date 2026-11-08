// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/qcpool.test.mts
// Aigarth Pool: the hidden nav tab and its gate endpoint, the page order and its copy, Maria's home screen.
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

test('gate endpoint: {ok:true} for those allowed, a plain {ok:false} for everyone else', () => {
  assert.deepEqual(N.gateReply(true, false), { status: 200, body: { ok: true, preview: true } })
  assert.deepEqual(N.gateReply(true, true), { status: 200, body: { ok: true, preview: false } })
  assert.deepEqual(N.gateReply(false, false), { status: 200, body: { ok: false } })
  // a no says nothing about why: no hint that a page or a moderator exists
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

test('nav: the Aigarth Pool link is rendered only after the gate says yes, never in the static list', () => {
  assert.deepEqual(N.POOL_TAB, { href: '/pool', label: 'Aigarth Pool' })
  const nav = src('../../../components/church/navigation/GlobalNavTrigger.tsx')
  const list = nav.slice(nav.indexOf('const LINKS'), nav.indexOf('] as const'))
  assert.doesNotMatch(list, /'\/pool'|Aigarth Pool|QC Pool/)
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
  assert.equal(Q.JOIN.title, 'Join Aigarth Pool.')
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
  // no date for her move to Aigarth (the pool's name, Aigarth Pool, is not the move)
  assert.doesNotMatch(all, /revolutionary|crown of|game.?chang|guarantee|profit|\b20[0-9]{2}\b[^"]*Aigarth(?! Pool)/i)
  // how she learns is not explained
  assert.doesNotMatch(JSON.stringify(Q.MARIA), /fine-tun|train(ed|ing)|weights|dataset|model/i)
})

/* ---------------- Maria's home screen ---------------- */

test('home screen: nine apps, each a real screen, each shown once in the grid or the dock', () => {
  assert.deepEqual(
    Q.APPS.map(a => a.label),
    ['Pick hardware', 'Connect', 'Fix my rig', 'My rig', 'Ask Maria', 'The record', 'Who mines', 'Help', 'Report'],
  )
  const app = src('../../../components/pool/maria/MariaApp.tsx')
  for (const a of Q.APPS) assert.match(app, new RegExp(`e\\.screen === '${a.id}'`), a.id)
  // labels fit an iOS label: one short line
  for (const a of Q.APPS) assert.ok(a.label.length <= 13, a.label)
  for (const ai of [true, false, null]) {
    const dock = Q.dockApps(ai)
    const grid = Q.gridApps(ai)
    assert.equal(dock.length, 4)
    assert.equal(grid.length, 5)
    // a full row of four under her widget, the fifth (Report) on a second row under the small widgets
    const [row1, row2] = Q.gridRows(ai)
    assert.equal(row1.length, 4)
    assert.deepEqual(row2, ['report'])
    assert.deepEqual([...row1, ...row2], grid)
    assert.deepEqual([...dock, ...grid].sort(), Q.APPS.map(a => a.id).sort(), 'all nine, none twice')
    // the grid keeps the list's order
    assert.deepEqual(grid, Q.APPS.map(a => a.id).filter(id => grid.includes(id)))
  }
})

test('home screen: the dock holds the four most used, Ask Maria only once the AI is connected', () => {
  assert.deepEqual(Q.dockApps(true), ['pick', 'connect', 'doctor', 'ask'])
  assert.deepEqual(Q.dockApps(false), ['pick', 'connect', 'doctor', 'rig'])
  assert.deepEqual(Q.dockApps(null), Q.dockApps(false))
  assert.deepEqual(Q.gridApps(false), ['ask', 'record', 'who', 'help', 'report'])
  assert.deepEqual(Q.gridApps(true), ['rig', 'record', 'who', 'help', 'report'])
  assert.deepEqual(Q.askLabel(false), { pill: 'Ask Maria · coming soon', a11y: 'Ask Maria, coming soon' })
  assert.deepEqual(Q.askLabel(true), { pill: 'Ask Maria', a11y: 'Ask Maria' })
})

test('home screen: a pasted log in Ask Maria still goes to the log doctor', () => {
  const ask = src('../../../components/pool/maria/AskFlow.tsx')
  assert.match(ask, /if \(looksLikeLog\(raw\) && diagnose\(raw\)\.findings\.length\) return go\('doctor', \{ mode: raw \}\)/)
})

/* ---------------- Aigarth Pool: the name, Stage 0, who runs it, QC ---------------- */

test('name: Aigarth Pool everywhere the pool is named; the worker prefix stays QC.', async () => {
  assert.equal(POOL.name, 'Aigarth Pool')
  assert.equal(POOL.workerPrefix, 'QC.')
  const { PREFIX_WHY } = await import('../wizard.ts')
  assert.equal(PREFIX_WHY, 'QC. tags the machine as Aigarth Pool. Without it the pool does not count it as ours.')
  assert.match(W.RECORD.line, /^Every contribution through Aigarth Pool is recorded\.$/)
})

test('stage 0: one short line in the Join block, no dates, no promises, no game', () => {
  assert.deepEqual(Q.JOIN.stage, { label: 'Stage 0', line: 'The pool will keep growing from here.' })
  assert.doesNotMatch(JSON.stringify(Q.JOIN.stage), /\b20\d\d\b|week|month|soon|will (pay|earn)|game|—/i)
  const qc = src('../../../app/[locale]/pool/qc.tsx')
  const join = qc.slice(qc.indexOf('export function Join'))
  assert.ok(join.indexOf('JOIN.stage.label') > 0 && join.indexOf('JOIN.stage.label') < join.indexOf('JOIN.title'), 'the stage line sits above the title')
})

test('footer: the partner and the report link, no affiliation disclaimer', () => {
  assert.equal((Q as Record<string, unknown>).AFFILIATION, undefined)
  const page = src('../../../app/[locale]/pool/page.tsx')
  const foot = page.slice(page.indexOf('className={p.partners}'))
  assert.doesNotMatch(foot, /not affiliated/)
  assert.match(foot, /<ReportLink/)
})

test('QC wording: miner-facing pool copy says QC, never Qubic Church', () => {
  const files = [
    '../../../app/[locale]/pool/page.tsx',
    '../../../app/[locale]/pool/qc.tsx',
    '../../../app/[locale]/pool/why.tsx',
    '../../../app/[locale]/pool/ReportLink.tsx',
    '../../../app/[locale]/pool/reports/ReportsBoard.tsx',
    '../../../components/pool/maria/apps.tsx',
    '../../../components/pool/maria/home.tsx',
    '../../../components/pool/maria/report.tsx',
    '../../../components/pool/maria/flows.tsx',
    '../../../components/pool/maria/rig.tsx',
    '../../../app/api/pool/card/route.tsx',
    '../qc.ts',
    '../why.ts',
    '../wizard.ts',
    '../doctor.ts',
    '../knowledge.ts',
    '../share.ts',
    '../report.ts',
    '../config.ts',
  ]
  for (const f of files) assert.doesNotMatch(src(f), /Qubic Church|QC Pool/, f)
  // the quote section's line stays
  assert.match(src('../../../app/[locale]/pool/page.tsx') + src('../../../app/[locale]/pool/qc.tsx') + src('../../../app/[locale]/pool/why.tsx'), /<Hero/)
})

test('report link: the page opens the phone\'s Report app, and /pool#report opens it on load', () => {
  const link = src('../../../app/[locale]/pool/ReportLink.tsx')
  assert.match(link, /<button/)
  assert.match(link, /Report a bug, idea or update/)
  assert.match(link, /OPEN_APP_EVENT/)
  const app = src('../../../components/pool/maria/MariaApp.tsx')
  assert.match(app, /addEventListener\(OPEN_APP_EVENT/)
  assert.match(app, /window\.location\.hash === '#report'/)
  assert.match(src('../../../app/[locale]/pool/PoolStage.tsx'), /id="maria-phone"/)
})
