// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/discord.test.mts
// What Qubic Discord #mining-general (31 Jul to 4 Nov 2026) taught Maria: new log errors, new FAQ entries,
// new facts, and the privacy rules for what came from the channel.
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { diagnose, RULES, SYMPTOMS } = await import('../doctor.ts')
const { FAQ, FAQ_THEMES } = await import('../faq.ts')
const { FACTS, SOURCES } = await import('../knowledge.ts')
const { classifyGpu } = await import('../hardware.ts')
const { mariaSystemPrompt, sourcesBlock } = await import('../prompt.ts')
const { HARD_RULES } = await import('../rules.ts')
const { TIPS } = await import('../practice.ts')
const { POOL } = await import('../config.ts')
const { renderMiningCard } = await import('../../../../scripts/pool-card.mts')

const NOW = new Date('2026-11-04T12:00:00Z')
const ids = (log: string) => diagnose(log).findings.map(f => f.id)
const first = (log: string) => diagnose(log).findings[0]?.id
const MONEY = /\$\s?\d|\bUSD\b|€|\bearn(ing)?s? per\b|\bprofit\b|\bROI\b|payback|revenue|per day you/i

/* ---------- doctor: log lines miners posted ---------- */

test('doctor: the Windows GPU kernel error (9 to 14 Oct 2026)', () => {
  const line = "2026-10-09 05:15:40.611 [INFO]  [GPU] Trainer: [QJM ERROR] Kernel with original name 'kern_solve_cand_start' not found in map."
  assert.equal(first(line), 'gpu-kernel-missing')
  assert.equal(diagnose(line).status, 'fault')
  assert.equal(first('[QJM ERROR] kernel lookup failed'), 'gpu-kernel-missing')
  // a healthy it/s line next to it does not hide it
  assert.ok(!ids(`[CUDA] 49 it/s\n${line}`).includes('mining'))
  const r = RULES.find(x => x.id === 'gpu-kernel-missing')!
  assert.match(r.fix.join(' '), /current miner/)
  assert.match(r.fix.join(' '), /CPU only/)
})

test('doctor: a damaged stats file (1 Oct 2026)', () => {
  const line = 'failed to restore persisted solutions | epoch=233 error="decode stats file C:\\q\\stats.233.lock: invalid character \'\\x00\' looking for beginning of value"'
  assert.equal(first(line), 'stats-file')
  assert.equal(diagnose(line).status, 'check')
  assert.equal(first('open /q/stats.237.lock: bad data'), 'stats-file')
  assert.match(RULES.find(x => x.id === 'stats-file')!.fix[0]!, /stats\.<epoch>\.lock/)
})

test('doctor: Ant Colony parent cache misses are pool side (21 Oct 2026, Parent LUT in epoch 231)', () => {
  for (const l of ['AntColony: parent 7f3a not found — server cache miss', 'proxy: 0 walks served', 'ERROR Parent LUT missing for task 231', '[ANT] server cache miss']) {
    assert.equal(first(l), 'ant-parent', l)
    assert.equal(diagnose(l).status, 'fine', l)
  }
  assert.match(RULES.find(x => x.id === 'ant-parent')!.fix[0]!, /do not restart/i)
  // "walks served" with work is not a miss
  assert.notEqual(first('proxy: 120 walks served'), 'ant-parent')
})

test('doctor: phone "Authentication failed" and waiting for tasks', () => {
  assert.equal(first('Authentication failed'), 'auth')
  assert.equal(first('[POOL] authentication failed, closing'), 'auth')
  assert.equal(first('Waiting to receive tasks from AntColony...'), 'epoch-idle')
  assert.match(RULES.find(x => x.id === 'epoch-idle')!.fix.join(' '), /for hours outside an epoch change/)
  // older rules keep their place
  assert.equal(first('Epoch transition, waiting for new epoch'), 'epoch-idle')
  assert.equal(first('[GPU] 401 Unauthorized'), 'auth')
})

test('doctor: new symptoms from the channel', () => {
  for (const id of ['new-algo-zero', 'old-gpu', 'paid-less', 'payout-late']) assert.ok(SYMPTOMS.some(s => s.id === id), id)
  assert.match(SYMPTOMS.find(s => s.id === 'new-algo-zero')!.finding.means, /at least 3 days/)
  assert.match(SYMPTOMS.find(s => s.id === 'paid-less')!.finding.means, /3125/)
  assert.match(SYMPTOMS.find(s => s.id === 'payout-late')!.finding.fix.join(' '), /Never the seed/)
  for (const id of ['gpu-kernel-missing', 'stats-file', 'ant-parent']) {
    const r = RULES.find(x => x.id === id)!
    assert.ok(r.fix.length > 0 && (r.sources?.length ?? 0) > 0, id)
  }
  const text = JSON.stringify([RULES, SYMPTOMS])
  assert.doesNotMatch(text, /—/)
  assert.doesNotMatch(text, MONEY)
})

/* ---------- picker: old cards ---------- */

test('picker: pre-Turing cards are a skip, Turing and newer still work', () => {
  for (const g of ['GTX 1050 Ti', 'NVIDIA GeForce GTX 1080', 'Tesla K80', 'GTX 980']) assert.equal(classifyGpu(g)?.verdict, 'Skip', g)
  for (const g of ['GTX 1660 Super', 'RTX 2060', 'Tesla T4']) assert.equal(classifyGpu(g)?.verdict, 'Works', g)
  assert.equal(classifyGpu('RTX 4090')?.verdict, 'Good')
  assert.match(classifyGpu('GTX 1050 Ti')!.reasons[0]!, /epoch 237/)
})

/* ---------- facts and FAQ ---------- */

test('facts: score threshold, weighting, payout timing, algorithm versions, old cards, AMD date', () => {
  const all = FACTS.map(f => f.text).join('\n')
  for (const re of [/scores above 3125 counted for nothing; lower is better/, /weighted by score, not counted equally/, /up to about 10 days/, /at least 3 days to settle/, /binary change in epoch 233/, /GTX 1050 Ti/, /no operator confirmation/, /EPYC 9534/])
    assert.match(all, re)
  assert.ok(SOURCES['qli-team'].date.length > 0)
  // the facts that came from the channel carry no money words (older field facts may name rental prices)
  const fromDiscord = FACTS.filter(f => f.sources.some(id => id === 'qli-team' || id === 'community')).map(f => f.text).join('\n')
  assert.doesNotMatch(fromDiscord, MONEY)
})

test('faq: new themes and entries, each with its Discord date where it came from the channel', () => {
  assert.ok('start' in FAQ_THEMES && 'mobile' in FAQ_THEMES)
  for (const id of ['how-start', 'client-closes', 'mine-or-buy', 'old-gpu', 'small-pc', 'motherboard', 'kern-error', 'auto-update', 'zero-new-algo', 'paid-less', 'not-in-wallet', 'solo-pool', 'epoch-change', 'score', 'android', 'jetski-status', 'which-pool', 'scam-dm', 'gpu-unlock'])
    assert.ok(FAQ.some(e => e.id === id), id)
  for (const e of FAQ.filter(x => x.cite)) assert.match(e.cite!, /^Qubic Discord #mining-general, .*20\d\d/, e.id)
  assert.match(FAQ.find(e => e.id === 'pool-power')!.a, /MinerLab was no longer active/)
  assert.match(FAQ.find(e => e.id === 'android')!.a, /^Not on this pool/)
  assert.match(FAQ.find(e => e.id === 'gpu-unlock')!.a, /^Not recommended/)
  assert.match(FAQ.find(e => e.id === 'mine-or-buy')!.a, /no buy or sell opinions/)
})

test('privacy: no community handles, no wallet strings; Tier 1 handles only in citations', () => {
  // community members who posted in the channel; they must never appear in what Maria says
  const community = ['Kevarms', 'humungus35', 'STILL DADDY', 'daniblubb', 'Egregius', 'aman238', 'Crumbel', 'Kronos', 'roofeeoff', 'SEXYSHINOBI', 'DON_15UBIC', 'Hetdev', 'GrannyGrip69', 'e4lmeida', 'neener', 'Gaimwr', 'Distinguished Gentleman', 'CH_ZG', '10Choux', 'Hyper9s', 'Smarty', 'bigcash2011', 'Orda', 'MontanaGanache', 'Elite_Soldier', 'Vaintor', 'Aaaaaa', 'QubicChurch']
  const said = JSON.stringify([FAQ.map(e => [e.q, e.a]), FACTS, RULES, SYMPTOMS, TIPS, HARD_RULES])
  for (const h of community) assert.ok(!said.includes(h), h)
  const everything = JSON.stringify([FAQ, FACTS, RULES, SYMPTOMS, TIPS, SOURCES])
  for (const h of community) assert.ok(!everything.includes(h), `${h} in a citation`)
  assert.doesNotMatch(everything, /[A-Z]{60}|(?<![a-z])[a-z]{55}(?![a-z])/)
  // Tier 1 names stay out of answers; they appear only in cite / source labels
  for (const e of FAQ) assert.doesNotMatch(e.a, /Pomm3sgab3l|Zoxx/, e.id)
})

test('doctor: Ant Colony work files locked by another process (Windows, 2 Oct 2026)', () => {
  for (const l of [
    "System.IO.IOException: The process cannot access the file 'C:\\qli-client\\tmp.ant_9600_0.part' because it is being used by another process.",
    'qli-client\\tmp.ant_9600_2.part is being used by another process',
  ]) assert.equal(first(l), 'ant-temp-locked', l)
  assert.notEqual(first('The file report.docx is being used by another process'), 'ant-temp-locked')
  assert.match(RULES.find(x => x.id === 'ant-temp-locked')!.fix[0]!, /start one copy only/)
})

test('recovered operator answers: idle at the epoch change, phone blacklist, mining power risk, pools counted', () => {
  const a = (id: string) => FAQ.find(e => e.id === id)!.a
  assert.match(a('epoch-change'), /Just wait until the backend has received the update/)
  assert.doesNotMatch(a('epoch-change'), /suggested stopping/)
  assert.match(a('android'), /blacklist for too many shares too fast/)
  assert.match(a('rent-worth'), /fewer coins than you expect/)
  assert.match(a('pool-power'), /2 public and one independent/)
  assert.match(a('zero-new-algo'), /find a good branch/)
  assert.match(RULES.find(x => x.id === 'auth')!.fix.join(' '), /blacklisted for sending too many shares/)
})

test('jetski: status with dates, never "gone since 10 Oct", never recommended', () => {
  const all = JSON.stringify([FAQ, FACTS, RULES, SYMPTOMS, TIPS, HARD_RULES, SOURCES])
  assert.doesNotMatch(all, /gone since|left Qubic about|10 Oct 2026\)/i)
  assert.doesNotMatch(all, /jetski[^"]{0,20}\b(now )?gone\b/i)
  assert.ok(HARD_RULES.some(r => /Recommend only Qubic Church Pool/.test(r) && /18 Sep 2026/.test(r) && /still operating and paying on 3 Nov 2026/.test(r)))
  const st = FAQ.find(e => e.id === 'jetski-status')!
  assert.match(st.a, /^Not recommended here; I recommend only Qubic Church Pool/)
  for (const re of [/18 Sep 2026/, /might be paused/, /no ARM support/, /epoch 236 payout set for 4 Nov/, /until 2 Nov/]) assert.match(st.a, re)
})

test('no jetski recommendation and no partner name in the new material', () => {
  const all = JSON.stringify([FAQ, FACTS, RULES, SYMPTOMS, TIPS])
  assert.doesNotMatch(all, new RegExp(`\\b${POOL.partner.name}\\b`))
  assert.doesNotMatch(all, /recommend(ed)? (the )?jetski|use jetski|switch to jetski|mine (via|on) jetski/i)
  assert.ok(HARD_RULES.some(r => /third-party miners, GPU unlock tools/.test(r)))
})

/* ---------- prompt and card ---------- */

test('prompt: sources listed once, tags in facts, compact triage, under 17k tokens', () => {
  const p = mariaSystemPrompt(NOW)
  assert.match(p, /\nSOURCES \(tag = source, date/)
  assert.match(sourcesBlock(), /- QLI team = Qubic Discord #mining-general, QLI team \(Pomm3sgab3l, Zoxx\) \(1 Aug to 4 Nov 2026\)/)
  assert.equal(p.match(/Our field runs, epoch 233 \(30 Sep to 3 Oct 2026\)/g)!.length, 1)
  assert.match(p, /Steps in PROCEDURES\./)
  assert.match(p, /up to about 10 days/)
  assert.match(p, /kern_solve_cand_start/)
  // the partner is named once, in the answer to "who runs the pool" (owner-confirmed, Nov 2026)
  assert.equal(p.match(/\bCODED\b/g)!.length, 1)
  assert.match(p, /Who runs it: only when the user asks who runs or operates the pool, say: "Qubic Church Pool runs on the infrastructure of our partner CODED \(confirmed by the pool owner\)\."/)
  assert.doesNotMatch(p, /—/)
  // Budget raised from 16k to 17k tokens for the exam fixes (checklist, open cases, log reading, epoch log), Nov 2026.
  assert.ok(p.length / 4 <= 17_000, `prompt is about ${Math.round(p.length / 4)} tokens`)
})

test('discord card: carries the new FAQ entries with their Discord citations', () => {
  const md = renderMiningCard('abc1234')
  for (const e of FAQ) assert.ok(md.includes(e.a), e.id)
  for (const e of FAQ.filter(x => x.cite)) assert.ok(md.includes(e.cite!), e.id)
  assert.match(md, /Вопросы майнеров: Phones and Android/)
  assert.match(md, /Железо: алгоритм и версии майнера/)
})
