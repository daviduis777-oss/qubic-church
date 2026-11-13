// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/reports.test.mts
// Reports: validation, size caps, redaction, the daily limit, storage without an IP, gating, the moderator's list.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const R = await import('../report.ts')
const S = await import('../report-store.ts')

const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const SEED = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc' // 55 lowercase letters
const ADDR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH' // 60 uppercase letters

/** A data URL whose bytes start like a JPEG or a WebP, padded to n bytes. */
const jpeg = (n = 400) => `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(n - 4, 7)]).toString('base64')}`
const webp = (n = 400) =>
  `data:image/webp;base64,${Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBPVP8 '), Buffer.alloc(n - 16, 3)]).toString('base64')}`

const good = { type: 'bug', text: 'The Connect app froze after I picked HiveOS.', ctx: { app: 'connect', step: 'os' } }

const store = (o: { now?: () => Date; salt?: string | null } = {}) => {
  const backend = S.memoryReports()
  let n = 0
  const r = S.createReports({
    backend,
    salt: o.salt === undefined ? 'test-salt-0123456789' : o.salt,
    now: o.now,
    id: () =>
      `r${String(++n)
        .padStart(12, 'a')
        .replace(/[^a-z2-9]/g, 'b')}`,
  })
  return { r, backend }
}

/* ---------------- validation ---------------- */

test('validation: a type, enough words, not too many', () => {
  assert.equal(R.checkReport(null).ok, false)
  assert.equal(R.checkReport({ ...good, type: 'rant' }).ok, false)
  assert.equal(R.checkReport({ ...good, text: 42 }).ok, false)
  const short = R.checkReport({ ...good, text: '   too short '.slice(0, 8) })
  assert.equal(short.ok, false)
  assert.match((short as { error: string }).error, /at least 10 characters/)
  assert.equal(R.checkReport({ ...good, text: 'x'.repeat(R.REPORT.maxText + 1) }).ok, false)
  assert.equal(R.checkReport({ ...good, text: 'x'.repeat(R.REPORT.maxText) }).ok, true)
  for (const type of ['bug', 'idea', 'update']) assert.equal(R.checkReport({ ...good, type }).ok, true, type)
  assert.deepEqual(
    R.REPORT_TYPES.map(t => t.label),
    ['Bug', 'Idea', 'Update'],
  )
})

test('validation: control characters out, newlines kept, blank runs folded', () => {
  const c = R.checkReport({ ...good, text: 'line one\u0007\r\nline two\n\n\n\n\n\nline three\u0000' })
  assert.ok(c.ok)
  assert.equal(c.value.text, 'line one\nline two\n\n\nline three')
})

test('validation: contact is an optional Discord handle, stored with an @', () => {
  assert.equal((R.checkReport({ ...good, contact: '' }) as { value: { contact?: string } }).value.contact, undefined)
  assert.equal((R.checkReport({ ...good, contact: 'miner.bob_7' }) as { value: { contact?: string } }).value.contact, '@miner.bob_7')
  assert.equal((R.checkReport({ ...good, contact: '@miner' }) as { value: { contact?: string } }).value.contact, '@miner')
  assert.equal((R.checkReport({ ...good, contact: 'OldName#1234' }) as { value: { contact?: string } }).value.contact, '@OldName#1234')
  for (const bad of ['a', 'has space', 'x'.repeat(41), 'https://evil.example', 'me@mail.com', 7])
    assert.equal(R.checkReport({ ...good, contact: bad }).ok, false, String(bad))
})

test('validation: the context is codes only; user text cannot ride along as a step', () => {
  assert.deepEqual(R.checkContext({ app: 'doctor', step: 'log:cuda-oom+low-threads' }), { app: 'doctor', step: 'log:cuda-oom+low-threads' })
  assert.deepEqual(R.checkContext({ app: 'doctor', step: 'my wallet is ABC and I typed' }), { app: 'doctor' })
  assert.deepEqual(R.checkContext({ app: '<script>' }), { app: 'unknown' })
  assert.deepEqual(R.checkContext(undefined), { app: 'unknown' })
  assert.equal(R.contextLine({ app: 'doctor', step: 'symptom:no-shares' }), 'Fix my rig · symptom:no-shares')
})

/* ---------------- size caps ---------------- */

test('screenshot: JPEG or WebP only, real magic bytes, at most 2 MB', () => {
  assert.equal(R.REPORT.imageMaxBytes, 2_000_000)
  assert.equal(R.REPORT.imageMaxPx, 1600)
  assert.ok(R.checkImage(jpeg()).ok)
  assert.ok(R.checkImage(webp()).ok)
  assert.equal((R.checkImage(jpeg(1000)) as { value: { bytes: number } }).value.bytes, 1000)
  // a PNG, an SVG, a GIF: refused (the browser re-encodes; anything else did not come from the app)
  assert.equal(R.checkImage(`data:image/png;base64,${Buffer.from('\x89PNG\r\n\x1a\n'.padEnd(200, 'x')).toString('base64')}`).ok, false)
  assert.equal(R.checkImage(`data:image/svg+xml;base64,${Buffer.from('<svg onload="x"/>'.padEnd(200)).toString('base64')}`).ok, false)
  // the type says JPEG, the bytes say otherwise
  assert.equal(R.checkImage(`data:image/jpeg;base64,${Buffer.alloc(400, 1).toString('base64')}`).ok, false)
  assert.equal(R.checkImage(`data:image/webp;base64,${Buffer.concat([Buffer.from('RIFF0000AVI '), Buffer.alloc(300)]).toString('base64')}`).ok, false)
  // too large, and the cheap length check refuses before any parsing
  assert.equal(R.checkImage(jpeg(R.REPORT.imageMaxBytes + 1)).ok, false)
  assert.ok(R.checkImage(jpeg(R.REPORT.imageMaxBytes)).ok)
  assert.equal(R.checkImage('x'.repeat(3_000_000)).ok, false)
  assert.equal(R.checkImage(42).ok, false)
  // too small to be a picture
  assert.equal(R.checkImage(jpeg(20)).ok, false)
})

test('screenshot: a report carries it only after the same checks', () => {
  assert.equal(R.checkReport({ ...good, image: 'data:image/gif;base64,R0lGOD' }).ok, false)
  const c = R.checkReport({ ...good, image: jpeg() })
  assert.ok(c.ok)
  assert.equal(c.value.image, jpeg())
})

test('downscale: the longest side at most 1600 px, never upscaled', () => {
  assert.deepEqual(R.fitWithin(3200, 1800), { w: 1600, h: 900 })
  assert.deepEqual(R.fitWithin(1179, 2556), { w: 738, h: 1600 })
  assert.deepEqual(R.fitWithin(800, 600), { w: 800, h: 600 })
  assert.deepEqual(R.fitWithin(0, 600), { w: 0, h: 0 })
  assert.equal(R.base64Bytes(Buffer.alloc(1000).toString('base64')), 1000)
  assert.equal(R.base64Bytes(Buffer.alloc(1001).toString('base64')), 1001)
})

/* ---------------- redaction ---------------- */

test('redaction: seeds and addresses are removed from the text before it is stored', async () => {
  const c = R.checkReport({ ...good, text: `My seed ${SEED} and address ${ADDR} do not work` })
  assert.ok(c.ok)
  assert.ok(!c.value.text.includes(SEED) && !c.value.text.includes(ADDR))
  assert.match(c.value.text, /\[seed removed\]/)
  assert.match(c.value.text, /\[address removed\]/)
  assert.equal(c.value.seed, true)
  // a seed with one letter lost in copying is still a seed
  assert.equal(R.redactReport(`x ${SEED.slice(1)} y`).seed, true)
  const { r, backend } = store()
  const saved = await r.add({ ...good, text: `help ${SEED} please, it fails` }, { ip: '1.2.3.4', ua: 'desktop · Linux · Firefox' })
  assert.ok(saved.ok)
  assert.equal(saved.value.seed, true)
  const raw = JSON.stringify([...backend.state.docs.values()])
  assert.ok(!raw.includes(SEED))
})

/* ---------------- the daily limit ---------------- */

test('rate limit: 5 reports per connection per UTC day; a refused report does not count', async () => {
  let now = new Date('2026-11-05T10:00:00Z')
  const { r, backend } = store({ now: () => now })
  const ctx = { ip: '203.0.113.9', ua: 'mobile · iOS · Safari' }
  assert.equal((await r.add({ ...good, text: 'short' }, ctx)).status, 422)
  for (let i = 0; i < R.REPORT.perDay; i++) assert.ok((await r.add(good, ctx)).ok, `report ${i + 1}`)
  const sixth = await r.add(good, ctx)
  assert.equal(sixth.ok, false)
  assert.equal(sixth.status, 429)
  assert.match((sixth as { error: string }).error, /today's 5 reports/)
  // another connection is not affected
  assert.ok((await r.add(good, { ...ctx, ip: '198.51.100.1' })).ok)
  // the next UTC day starts again
  now = new Date('2026-11-06T00:00:05Z')
  assert.ok((await r.add(good, ctx)).ok)
  // the rate keys hold an HMAC, never the IP
  const keys = [...backend.state.hits.keys()]
  assert.ok(keys.length >= 3)
  for (const k of keys) {
    assert.match(k, /^pool:report:rate:\d{4}-\d{2}-\d{2}:[0-9a-f]{24}$/)
    assert.ok(!k.includes('203.0.113.9') && !k.includes('198.51.100.1'))
  }
  assert.notEqual(S.rateKey('1.1.1.1', '2026-11-05', 'a'), S.rateKey('1.1.1.1', '2026-11-05', 'b'), 'salted')
})

test('rate limit: without a server secret in production, nothing is stored', async () => {
  const { r, backend } = store({ salt: null })
  const x = await r.add(good, { ip: '1.2.3.4', ua: 'desktop · macOS · Safari' })
  assert.equal(x.ok, false)
  assert.equal(x.status, 503)
  assert.equal(backend.state.list.length, 0)
})

/* ---------------- storage ---------------- */

test('storage: id, type, text, contact, context, device class, time; the image under its own key; never an IP', async () => {
  const at = new Date('2026-11-05T12:34:00Z')
  const { r, backend } = store({ now: () => at })
  const x = await r.add(
    { ...good, contact: 'bob', image: webp(800) },
    { ip: '192.0.2.77', ua: R.uaClass('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Version/18.1 Mobile/15E148 Safari/604.1') },
  )
  assert.ok(x.ok)
  const rec = x.value
  assert.match(rec.id, S.ID_PATTERN)
  assert.deepEqual(
    { type: rec.type, text: rec.text, contact: rec.contact, ctx: rec.ctx, ua: rec.ua, at: rec.at, status: rec.status, img: rec.img },
    {
      type: 'bug',
      text: good.text,
      contact: '@bob',
      ctx: { app: 'connect', step: 'os' },
      ua: 'mobile · iOS · Safari',
      at: at.getTime(),
      status: 'new',
      img: { type: 'webp', bytes: 800 },
    },
  )
  // the report JSON holds no image data; the image key holds the data URL
  const doc = backend.state.docs.get(S.reportKey(rec.id))!
  assert.ok(!doc.includes('base64'))
  assert.equal(backend.state.imgs.get(S.imageKey(rec.id)), webp(800))
  const everything = JSON.stringify({ docs: [...backend.state.docs], imgs: [...backend.state.imgs], hits: [...backend.state.hits], list: backend.state.list })
  assert.ok(!everything.includes('192.0.2.77'))
  assert.ok(!everything.includes('Mozilla'))
  // the moderator's image route gets bytes and a type
  const img = await r.image(rec.id)
  assert.equal(img?.type, 'image/webp')
  assert.equal(img?.bytes.byteLength, 800)
  assert.equal(await r.image('../../etc/passwd'), null)
})

test('storage: the list keeps the newest REPORT.keep, newest first, and drops the images of those it lets go', async () => {
  let t = Date.parse('2026-11-05T00:00:00Z')
  const backend = S.memoryReports()
  let n = 0
  const r = S.createReports({
    backend,
    salt: 's'.repeat(20),
    now: () => new Date((t += 1000)),
    id: () =>
      `r${(++n)
        .toString(32)
        .padStart(12, '2')
        .replace(/[01lo]/g, 'z')}`,
  })
  const ids: string[] = []
  for (let i = 0; i < R.REPORT.keep + 3; i++) {
    const x = await r.add({ ...good, image: i === 0 ? jpeg() : undefined }, { ip: `10.0.${i >> 8}.${i & 255}`, ua: 'desktop · Linux · Chrome' })
    assert.ok(x.ok)
    ids.push(x.value.id)
  }
  assert.equal(backend.state.list.length, R.REPORT.keep)
  assert.equal(backend.state.imgs.size, 0, 'the oldest report and its image are gone')
  const list = await r.list(10)
  assert.equal(list.length, 10)
  assert.deepEqual(
    list.map(x => x.id),
    ids.slice(-10).reverse(),
  )
  assert.ok(list.every((x, i) => i === 0 || x.at < list[i - 1]!.at))
})

test('storage: the REST backend sends SET with an expiry, LPUSH and LTRIM, and nothing about the sender', async () => {
  const sent: unknown[] = []
  const fetcher = (async (_url: string, init?: RequestInit) => {
    const cmds = JSON.parse(String(init?.body)) as string[][]
    sent.push(cmds)
    return new Response(JSON.stringify(cmds.map(c => ({ result: c[0] === 'INCR' ? 1 : c[0] === 'SET' ? 'OK' : 1 }))), { status: 200 })
  }) as typeof fetch
  const r = S.createReports({ backend: S.restReports('https://kv.example', 'token', fetcher), salt: 'test-salt-0123456789', id: () => 'rabcdefghijkm' })
  const x = await r.add({ ...good, image: jpeg() }, { ip: '192.0.2.5', ua: 'desktop · Windows · Edge' })
  assert.ok(x.ok)
  const flat = JSON.stringify(sent)
  assert.ok(!flat.includes('192.0.2.5'))
  const put = (sent.at(-1) as string[][]).map(c => c.slice(0, 2).concat(c.length > 3 ? c.slice(3) : []))
  assert.deepEqual(put, [
    ['SET', 'pool:report:img:rabcdefghijkm', 'EX', String(R.REPORT.ttlDays * 86400)],
    ['SET', 'pool:report:r:rabcdefghijkm', 'EX', String(R.REPORT.ttlDays * 86400)],
    ['LPUSH', 'pool:report:ids'],
    ['LTRIM', 'pool:report:ids', '-1'.replace('-1', String(R.REPORT.keep - 1))],
  ])
})

test('the moderator marks a report seen or done; nothing else changes', async () => {
  const { r } = store()
  const x = await r.add(good, { ip: '1.1.1.1', ua: 'desktop · Linux · Firefox' })
  assert.ok(x.ok)
  const seen = await r.setStatus(x.value.id, 'seen')
  assert.ok(seen.ok)
  assert.deepEqual({ ...seen.value, status: 'new', updated: undefined }, { ...x.value, updated: undefined })
  assert.equal((await r.list())[0]!.status, 'seen')
  assert.ok((await r.setStatus(x.value.id, 'done')).ok)
  assert.equal((await r.list())[0]!.status, 'done')
  assert.equal((await r.setStatus(x.value.id, 'deleted')).ok, false)
  assert.equal((await r.setStatus('rnope', 'done')).ok, false)
  assert.equal((await r.setStatus('rzzzzzzzzzzzz', 'done')).ok, false)
  assert.equal(S.parseReport('{"v":2}'), null)
  assert.equal(S.parseReport('not json'), null)
})

/* ---------------- device class and the GitHub issue ---------------- */

test('device class: form factor, system, browser; bots named as such; never the raw string', () => {
  const ua = {
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0': 'desktop · Windows · Edge',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15': 'desktop · macOS · Safari',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36': 'mobile · Android · Chrome',
    'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1': 'tablet · iOS · Chrome',
    'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0': 'desktop · Linux · Firefox',
    'curl/8.5.0': 'bot or script',
  }
  for (const [u, want] of Object.entries(ua)) assert.equal(R.uaClass(u), want, u)
  assert.equal(R.uaClass(null), 'unknown')
})

test('GitHub issue: a title from the first line, the text in a fence, the facts above it', () => {
  const rec = {
    v: 1 as const,
    id: 'rabcdefghijkm',
    type: 'bug' as const,
    text: 'Connect froze on HiveOS\nsteps: pick HiveOS, then nothing ```oops```',
    contact: '@bob',
    ctx: { app: 'connect', step: 'os' },
    ua: 'mobile · iOS · Safari',
    at: Date.parse('2026-11-05T12:34:00Z'),
    status: 'new' as const,
    img: { type: 'jpeg' as const, bytes: 120_000 },
  }
  const { title, body } = R.issueMarkdown(rec, 'https://qubic.church')
  assert.equal(title, '[Bug] Connect froze on HiveOS')
  assert.match(body, /\*\*From:\*\* Connect · os/)
  assert.match(body, /\*\*Contact:\*\* Discord @bob/)
  assert.match(body, /\*\*Reported:\*\* 2026-11-05 12:34 UTC/)
  // the text has backticks, so the fence is tildes and cannot be closed from inside
  assert.match(body, /~~~~text\nConnect froze on HiveOS\nsteps: pick HiveOS, then nothing ```oops```\n~~~~/)
  assert.match(body, /Aigarth Pool Report app/)
  assert.ok(R.issueMarkdown({ ...rec, text: 'x'.repeat(200) }).title.length <= 80)
})

/* ---------------- gating ---------------- */

test('gating: sending is behind the pool gate; reading and marking are for the moderator alone', () => {
  const post = src('../../../app/api/pool/report/route.ts')
  assert.match(post, /if \(!\(await poolAllowed\(req\)\)\) return notFound\(\)/)
  assert.doesNotMatch(post, /export async function (GET|PUT|PATCH|DELETE)/)
  assert.match(post, /no-store/)
  assert.match(post, /noindex/)
  // the body is never logged, the IP goes only to the rate key, the user agent only as a class
  assert.doesNotMatch(post, /console\./)
  assert.match(post, /ua: uaClass\(req\.headers\.get\('user-agent'\)\)/)
  const list = src('../../../app/api/pool/reports/route.ts')
  for (const m of ['GET', 'PATCH'])
    assert.match(list, new RegExp(`export async function ${m}\\(req: Request\\) \\{\\n  if \\(!\\(await isModerator\\(req\\)\\)\\) return notFound\\(\\)`), m)
  assert.doesNotMatch(list, /poolAllowed|POOL_PUBLIC|poolPublic/, 'public or not, only the moderator')
  const img = src('../../../app/api/pool/reports/image/route.ts')
  assert.match(img, /if \(!\(await isModerator\(req\)\)\) return NextResponse\.json\(\{ error: 'Not found' \}, \{ status: 404/)
  assert.match(img, /nosniff/)
  assert.match(img, /private, no-store/)
  for (const f of ['../../../app/[locale]/pool/reports/page.tsx', '../../../app/[locale]/mod/page.tsx']) {
    const page = src(f)
    assert.match(page, /if \(!\(await isModerator\(\)\)\) notFound\(\)/, f)
    assert.match(page, /index: false/, f)
    assert.doesNotMatch(page, /poolAllowed/, f)
  }
  // not linked anywhere a visitor could see
  for (const f of [
    '../../../app/[locale]/pool/page.tsx',
    '../../../app/[locale]/pool/qc.tsx',
    '../../../components/pool/maria/report.tsx',
    '../../../components/church/navigation/GlobalNavTrigger.tsx',
  ])
    assert.doesNotMatch(src(f), /\/pool\/reports|'\/mod'/, f)
})

test('the tracker: every kind and source, six statuses, a private note, the thumbnail, copy as an issue', () => {
  const board = src('../../../app/[locale]/mod/Tracker.tsx')
  assert.match(board, /TYPE_LABEL\[x\.type\]/)
  assert.match(board, /\/api\/pool\/reports\/image\?id=\$\{x\.id\}/)
  assert.match(board, /contextLine\(x\.ctx\)/)
  assert.match(board, /STATUSES\.map/)
  assert.match(board, /save\(x\.id, \{ note \}\)/)
  assert.match(board, /Copy as GitHub issue/)
  assert.match(board, /method: 'PATCH'/)
  // screenshots are fetched lazily from the gated route, never inlined into the page
  assert.doesNotMatch(src('../../../app/[locale]/mod/page.tsx'), /image\(/)
})

test('the tracker: status and note change together or apart; an empty note removes it; nothing else changes', async () => {
  const { r } = store()
  const x = await r.add(good, { ip: '1.1.1.1', ua: 'desktop · Linux · Firefox' })
  assert.ok(x.ok)
  for (const s of R.STATUSES) assert.ok((await r.update(x.value.id, { status: s })).ok, s)
  const n = await r.update(x.value.id, { status: 'planned', note: '  ship with the pool \u0007 ' })
  assert.ok(n.ok)
  assert.equal(n.value.note, 'ship with the pool')
  assert.equal(n.value.status, 'planned')
  assert.equal(typeof n.value.updated, 'number')
  assert.deepEqual({ ...n.value, status: 'new', note: undefined, updated: undefined }, { ...x.value, note: undefined, updated: undefined })
  assert.equal((await r.update(x.value.id, { note: 'x'.repeat(5000) })).ok && (await r.list())[0]!.note!.length, R.NOTE_MAX)
  const cleared = await r.update(x.value.id, { note: '' })
  assert.ok(cleared.ok && !('note' in cleared.value))
  assert.equal((await r.update(x.value.id, { note: 5 })).ok, false)
  assert.equal((await r.update(x.value.id, { status: 'archived' })).ok, false)
})

test('the Suggest form: site kinds, a page code, never a gate, the same store', () => {
  assert.deepEqual(
    R.SITE_TYPES.map(t => t.id),
    ['idea', 'update', 'tool', 'review', 'bug'],
  )
  for (const t of ['tool', 'review']) assert.ok(R.checkReport({ type: t, text: 'A calculator for the pool share, please.' }).ok, t)
  assert.equal(R.pageStep('/bpp9000/brains?x=1'), 'bpp9000.brains')
  assert.equal(R.pageStep('/ru/museum'), 'museum')
  assert.equal(R.pageStep('/'), 'home')
  assert.equal(R.pageStep('javascript:alert(1)'), 'home')
  assert.equal(R.pageStep(42), 'home')
  assert.equal(R.contextLine({ app: 'site', step: 'bpp9000.brains' }), 'Site · /bpp9000/brains')
  assert.equal(R.contextLine({ app: 'site', step: 'home' }), 'Site · /')
  const api = src('../../../app/api/feedback/route.ts')
  assert.doesNotMatch(api, /poolAllowed|isModerator/)
  assert.match(api, /app: 'site', step: pageStep\(body\.page\)/)
  assert.match(api, /reports\(\)\.add/)
  assert.match(api, /body\.website/)
  const form = src('../../../components/suggest/SuggestForm.tsx')
  assert.match(form, /text: redactReport\(text\)\.text/)
  assert.match(form, /'\/api\/feedback'/)
})

/* ---------------- the Report app ---------------- */

test('Report app: the warning, redaction before sending, images only, downscaled, no log attached', () => {
  const app = src('../../../components/pool/maria/report.tsx')
  const shrinker = src('../shrink-image.ts')
  assert.equal(R.REPORT_WARNING, "Don't include your seed or private keys in the screenshot.")
  assert.match(app, /\{REPORT_WARNING\}/)
  assert.match(app, /text: redactReport\(text\)\.text/)
  assert.match(app, /accept="image\/\*"/)
  assert.match(shrinker, /fitWithin\(pic\.w, pic\.h\)/)
  assert.match(shrinker, /toDataURL\('image\/webp', q\)/)
  assert.match(shrinker, /toDataURL\('image\/jpeg', q\)/)
  assert.match(shrinker, /REPORT\.rawMaxBytes/)
  // Fix my rig hands over rule ids, never the log; Ask Maria hands over the turn number, never the chat
  const flows = src('../../../components/pool/maria/flows.tsx')
  assert.match(flows, /go\('report', \{ from: 'doctor', step: reportStep\(v\) \}\)/)
  assert.match(flows, /\{ value: 'report', label: 'Report a problem', quiet: true \}/)
  const ask = src('../../../components/pool/maria/AskFlow.tsx')
  assert.match(ask, /go\('report', \{ from: 'ask', step: `answer:\$\{/)
  assert.match(ask, /label: 'Report a problem', quiet: true/)
  // no em dashes in what a miner reads
  assert.doesNotMatch(JSON.stringify({ T: R.REPORT_TYPES, W: R.REPORT_WARNING }) + app, /—/)
})
