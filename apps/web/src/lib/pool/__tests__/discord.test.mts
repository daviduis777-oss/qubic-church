// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/discord.test.mts
// What Qubic Discord #mining-general (31 Jul to 4 Nov 2026) taught Maria: new log errors, new FAQ entries,
// new facts, and the privacy rules for what came from the channel.
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { diagnose, RULES, SYMPTOMS } = await import('../doctor.ts')
const { SOURCES } = await import('../knowledge.ts')
const { classifyGpu } = await import('../hardware.ts')
const { TIPS } = await import('../practice.ts')
const { POOL } = await import('../config.ts')

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




test('doctor: Ant Colony work files locked by another process (Windows, 2 Oct 2026)', () => {
  for (const l of [
    "System.IO.IOException: The process cannot access the file 'C:\\qli-client\\tmp.ant_9600_0.part' because it is being used by another process.",
    'qli-client\\tmp.ant_9600_2.part is being used by another process',
  ]) assert.equal(first(l), 'ant-temp-locked', l)
  assert.notEqual(first('The file report.docx is being used by another process'), 'ant-temp-locked')
  assert.match(RULES.find(x => x.id === 'ant-temp-locked')!.fix[0]!, /start one copy only/)
})




/* ---------- prompt and card ---------- */


