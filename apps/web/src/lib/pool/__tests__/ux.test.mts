// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/ux.test.mts
// The UX audit fixes: the rental branch, the QC. prefix, honest statistics, rig states and the share helper.
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { buildPlan, checkWorkerInput, HIVE_WORKER_TEMPLATE, PREFIX_WHY } = await import('../wizard.ts')
const { MINER_COMMAND } = await import('../practice.ts')
const { POOL, RIG, MEASURE } = await import('../config.ts')
const { aggregate } = await import('../aggregate.ts')
const { usage } = await import('../usage.ts')
const { FIELD_SAMPLES, rigKey } = await import('../measure.ts')
const { statsView, newestEraSummary, splitEras, realRigs, runDates } = await import('../stats-view.ts')
const { STATS, SHARE, PAYOUT_TERMS } = await import('../ui-config.ts')
const { pick } = await import('../hardware.ts')
const R = await import('../rig.ts')
const { shareLink, shareText, xIntentUrl } = await import('../share.ts')
const { epochAt } = await import('../epoch.ts')

type Sample = import('../measure.ts').Sample
type Reading = import('../rig.ts').RigReading

// mid epoch 238: Fri 6 Nov 2026 15:00 UTC
const NOW = new Date(Date.UTC(2026, 10, 6, 15))
const T = NOW.getTime()
const CUR = epochAt(NOW).epoch
const ADDR = 'A'.repeat(60)
const base = { avx: 'unknown' as const, wallet: ADDR, worker: 'QC.5080-a', dedicated: true }
const cmds = (p: ReturnType<typeof buildPlan>) => p.steps.map(s => s.command ?? '').join('\n')
const text = (p: ReturnType<typeof buildPlan>) => JSON.stringify(p)

/* ---------------- Connect: the rental branch ---------------- */

test('rental: the container procedure, never the bare-metal one', () => {
  const p = buildPlan({ ...base, os: 'linux', hw: 'nvidia', where: 'rental', threads: 128, gpuCount: 7 })
  assert.deepEqual(p.procedures.map(x => x.id), ['rental'])
  assert.doesNotMatch(cmds(p), /apt upgrade|ubuntu-drivers|sudo reboot|useradd|systemctl|nvidia-smi -pm/)
  assert.match(cmds(p), /\/root\/qubic-miner\/run\.sh/)
  assert.ok(p.steps.some(s => s.title === 'No drivers, no reboot'))
  assert.ok(p.steps.some(s => /CUDA/.test(s.body ?? '') && /image/i.test(s.title)))
  assert.ok(p.steps.some(s => /On-start/.test(s.body ?? '')))
  assert.equal(p.values[0]!.value, 'Linux (rented container)')
  // 128 threads for 7 cards is above 12 per card: no CPU warning
  assert.ok(!p.warnings.some(w => /per card/.test(w)))
})

test('rental: a rented box is Linux even when another system was handed over', () => {
  const p = buildPlan({ ...base, os: 'windows', hw: 'nvidia', where: 'rental' })
  assert.deepEqual(p.procedures.map(x => x.id), ['rental'])
  assert.equal(p.shell.label, 'Terminal')
  assert.ok(!p.steps.some(s => /schtasks|Coreinfo/.test(s.command ?? '')))
})

test('gpu count: warns under 12 threads per card, and only for NVIDIA', () => {
  const farm = buildPlan({ ...base, os: 'hiveos', hw: 'nvidia', threads: 12, gpuCount: 6 })
  const w = farm.warnings.find(x => /per card/.test(x))
  assert.ok(w)
  assert.match(w!, /12 CPU threads for 6 cards is under 12 per card/)
  assert.ok(!buildPlan({ ...base, os: 'linux', hw: 'nvidia', threads: 24, gpuCount: 2 }).warnings.some(x => /per card/.test(x)))
  assert.ok(buildPlan({ ...base, os: 'linux', hw: 'nvidia', threads: 23, gpuCount: 2 }).warnings.some(x => /per card/.test(x)))
  assert.ok(!buildPlan({ ...base, os: 'linux', hw: 'cpu', threads: 4 }).warnings.some(x => /per card/.test(x)))
  assert.equal(RIG.threadsPerGpu, 12)
})

test('no repeated questions: a GPU plan drops the AVX check, a given thread count drops the count step', () => {
  const win = buildPlan({ ...base, os: 'windows', hw: 'nvidia', threads: 16 })
  const titles = win.steps.map(s => s.title)
  assert.ok(!titles.includes('Check for AVX-512'))
  assert.ok(!titles.includes('Count the threads'))
  assert.equal(win.shell.label, 'Command Prompt')
  assert.equal(win.shell.prompt, false)
  // threads not given: the count step stays, so the user can find it
  assert.ok(buildPlan({ ...base, os: 'windows', hw: 'nvidia' }).steps.some(s => s.title === 'Count the threads'))
  // a CPU plan with unknown AVX keeps the check; a known one drops it
  assert.ok(buildPlan({ ...base, os: 'linux', hw: 'cpu', avx: 'unknown' }).steps.some(s => s.title === 'Check for AVX-512'))
  assert.ok(!buildPlan({ ...base, os: 'linux', hw: 'cpu', avx: 'avx512' }).steps.some(s => s.title === 'Check for AVX-512'))
  assert.ok(!buildPlan({ ...base, os: 'macos', hw: 'apple', avx: 'apple', threads: 12 }).steps.some(s => s.title === 'Count the threads'))
})

/* ---------------- the QC. prefix ---------------- */

test('worker: the wizard refuses a name without QC., and says the fixed name', () => {
  assert.deepEqual(checkWorkerInput('QC.rig-a'), { ok: true, value: 'QC.rig-a' })
  assert.deepEqual(checkWorkerInput('  QC.7x5080-a '), { ok: true, value: 'QC.7x5080-a' })
  const bare = checkWorkerInput('rig-a')
  assert.equal(bare.ok, false)
  assert.match((bare as { message: string }).message, /Start the name with QC\. For example QC\.rig-a\./)
  assert.ok((bare as { message: string }).message.includes(PREFIX_WHY))
  // close but not exact: lowercase, a dash, a missing dot
  for (const near of ['qc.rig-a', 'Qc.rig-a', 'QC-rig-a', 'QCrig-a']) {
    const r = checkWorkerInput(near)
    assert.equal(r.ok, false, near)
    assert.match((r as { message: string }).message, /capital Q, capital C, then a dot/, near)
  }
  assert.equal(checkWorkerInput('QC.').ok, false)
  assert.equal(checkWorkerInput('QC.rig a').ok, false)
  assert.equal(checkWorkerInput(`QC.${'x'.repeat(70)}`).ok, false)
})

test('worker: every plan carries the name, the why, and the prefix in the values step', () => {
  const p = buildPlan({ ...base, os: 'linux', hw: 'nvidia' })
  assert.equal(p.worker.name, 'QC.5080-a')
  assert.equal(p.worker.why, PREFIX_WHY)
  assert.match(p.steps[1]!.body!, /starts with QC\., exactly/)
  assert.match(p.values.find(v => v.label === 'Worker name')!.why!, /^Must begin with the QC\. prefix\. One/)
})

test('hiveos: the exact flight-sheet template, a farm-wide sheet, no missing placeholder', () => {
  const p = buildPlan({ ...base, os: 'hiveos', hw: 'nvidia', worker: 'QC.3070-farm' })
  assert.equal(HIVE_WORKER_TEMPLATE, `${POOL.workerPrefix}%WORKER_NAME%`)
  assert.equal(p.worker.template, 'QC.%WORKER_NAME%')
  assert.equal(p.worker.rigName, '3070-farm')
  assert.ok(p.values.some(v => v.value === 'QC.%WORKER_NAME%'))
  const tpl = p.steps.find(s => s.title === 'Put QC.%WORKER_NAME% in the worker template')
  assert.ok(tpl)
  assert.match(tpl!.body!, /Name this rig 3070-farm in HiveOS and the pool sees it as QC\.3070-farm/)
  assert.ok(p.steps.some(s => s.title === 'Apply it to your rigs' && /every rig in the farm/.test(s.body ?? '')))
  assert.ok(!p.steps.some(s => s.title === 'Apply it to this rig only'))
  // no step mentions a placeholder that no HiveOS step contains
  assert.ok(!p.steps.some(s => (s.body ?? '').includes(MINER_COMMAND)))
  assert.ok(p.steps.some(s => s.title === 'Take the HiveOS values from the setup page'))
  assert.ok(p.steps.some(s => /Installation URL/.test(s.body ?? '')))
})

test('plans: the fee line, no est. on the dashboard check, no em dashes', () => {
  for (const os of ['linux', 'windows', 'macos', 'hiveos'] as const) {
    for (const where of ['own', 'rental'] as const) {
      const p = buildPlan({ ...base, os, hw: os === 'macos' ? 'apple' : 'nvidia', where, gpuCount: 2, threads: 8 })
      assert.doesNotMatch(text(p), /—/)
      assert.equal(p.terms, `Pool fee ${POOL.feePercent}%. The pool sends rewards to this address after each weekly epoch.`)
      assert.ok(!p.checks.some(c => /\(est\.\)/.test(c.body ?? '') && /appears on the pool/.test(c.title)))
    }
  }
})

/* ---------------- statistics honesty ---------------- */

let seq = 0
const mk = (o: { gpu?: string | null; cpu?: string; n?: number; sph: number; epoch?: number; src?: 'pool' | 'log' }): Sample => {
  const hw = { cpu: o.cpu ?? 'EPYC 9654', gpu: o.gpu ?? null, gpuCount: o.gpu ? (o.n ?? 1) : 0, mode: (o.gpu ? 'gpu' : 'cpu') as 'gpu' | 'cpu', owner: 'own' as const }
  seq++
  return { v: 1, source: o.src ?? 'log', at: seq, key: rigKey(hw), hw, result: { epoch: o.epoch ?? CUR, solPerHour: o.sph }, dedupe: `d${seq}` }
}
const summary = (list: Sample[]) => ({ ...aggregate(list, CUR, T), usage: usage(list, CUR) })

test('stats: our 3 test rentals alone are never shown as miner statistics', () => {
  const v = statsView(summary(FIELD_SAMPLES))
  assert.equal(v.real, 0)
  assert.equal(v.show, false)
  assert.equal(v.need, STATS.minRealRigs)
  // the test runs are listed as test runs, newest era only
  assert.equal(v.tests.epoch, 233)
  assert.deepEqual(v.tests.current.map(f => f.epoch), [233, 233])
  assert.deepEqual(v.tests.older.map(f => f.epoch), [229])
  assert.equal(v.tests.current.find(f => f.gpu === 'RTX 4090')!.perCard, 610)
  // a field row is never a miner row
  assert.ok(v.rows.every(r => r.source !== 'field'))
})

test('stats: miner statistics appear from STATS.minRealRigs saved rigs', () => {
  const nine = Array.from({ length: STATS.minRealRigs - 1 }, (_, i) => mk({ gpu: 'RTX 4090', sph: 600 + i }))
  assert.equal(statsView(summary([...FIELD_SAMPLES, ...nine])).show, false)
  const ten = [...nine, mk({ gpu: 'RTX 5080', sph: 400 })]
  const v = statsView(summary([...FIELD_SAMPLES, ...ten]))
  assert.equal(v.real, STATS.minRealRigs)
  assert.equal(v.show, true)
  assert.ok(v.rows.some(r => r.label === 'RTX 4090' && r.latest.n === 9 && r.source === 'log'))
  // our 4090 test run is listed apart, not folded into the miners' row
  assert.ok(v.rows.every(r => r.source !== 'field'))
  assert.equal(realRigs(null), 0)
})

test('stats: one era per table, the 5070 Ti 4.5 sol/h of epoch 229 never next to epoch 233 rows', () => {
  const old = [mk({ gpu: 'RTX 5070 Ti', sph: 4.5, epoch: 229 }), mk({ gpu: 'RTX 3080', sph: 3, epoch: 229 })]
  const now = Array.from({ length: 10 }, (_, i) => mk({ gpu: i % 2 ? 'RTX 4090' : 'RTX 5080', sph: 500 + i, epoch: 237 }))
  const v = statsView(summary([...old, ...now]))
  assert.equal(v.eraEpoch, 237)
  assert.ok(v.rows.every(r => r.latest.epoch >= 237 - MEASURE.olderAfterEpochs))
  assert.deepEqual(v.older.map(r => r.label).sort(), ['RTX 3080', 'RTX 5070 Ti'])
  assert.ok(!v.rows.some(r => r.label === 'RTX 5070 Ti'))
  const s = splitEras([229, 233, 238, 237], x => x)
  assert.deepEqual([s.epoch, s.current, s.older], [238, [238, 237], [229, 233]])
})

test('stats: the picker quotes no rate from an older era', () => {
  const sum = summary(FIELD_SAMPLES)
  const era = newestEraSummary(sum)!
  assert.ok(!era.rows.some(r => r.latest.epoch === 229))
  const card = pick({ mode: 'own', cpu: 'Ryzen 9 9950X', gpu: 'RTX 5070 Ti' }, sum).cards.find(c => /5070/.test(c.title))!
  assert.equal(card.measured, undefined)
  // the 233 era still shows: the 4090 card carries its measured line
  const c4090 = pick({ mode: 'own', cpu: 'Xeon E5-2696 v3', gpu: 'RTX 4090', gpuCount: 4 }, sum).cards.find(c => /4090/.test(c.title))!
  assert.match(c4090.measured!.line, /epoch 233/)
  assert.equal(runDates([{ at: '2026-10-01T16:00:00Z' }, { at: '2026-10-03T08:27:00Z' }]), '1 to 3 Oct 2026')
})

/* ---------------- My rig: states ---------------- */

const rd = (over: Partial<Reading> = {}): Reading => ({
  source: 'log',
  worker: 'QC.5070ti-a',
  at: T - 60_000,
  epoch: CUR,
  hw: { gpu: 'RTX 5070 Ti', gpuCount: 2, cpu: 'EPYC 7B12', threads: 48, mode: 'gpu' },
  solutions: 3100,
  solPerHour: 410,
  uptimeMin: 600,
  its: { CUDA: 760 },
  rejected: 12,
  series: [],
  faults: [],
  ...over,
})

test('rig: a rig added seconds ago is waiting for first data, never "No signal"', () => {
  const st = R.rigStatus(null, NOW)
  assert.equal(st.status, 'waiting')
  assert.equal(st.title, 'Waiting for first data')
  assert.doesNotMatch(st.line, /Check the machine/)
  assert.equal(R.coachLine(null, st).id, 'waiting')
  const f = R.freshness(null, st, NOW)
  assert.equal(f.shareable, false)
})

test('rig: numbers from a previous epoch carry that epoch, never "this epoch"', () => {
  const old = rd({ epoch: CUR - 1, at: T - 3 * 86_400_000 })
  const st = R.rigStatus(old, NOW)
  assert.equal(st.status, 'no-signal')
  const f = R.freshness(old, st, NOW)
  assert.equal(f.previousEpoch, true)
  assert.equal(f.stale, true)
  assert.equal(f.scope, `epoch ${CUR - 1}`)
  assert.equal(f.note, `epoch ${CUR - 1} · 3 d ago`)
  assert.equal(f.shareable, false)
  // fresh and current: shareable, "in this log"
  const ok = R.freshness(rd(), R.rigStatus(rd(), NOW), NOW)
  assert.deepEqual([ok.stale, ok.previousEpoch, ok.scope, ok.note, ok.shareable], [false, false, 'in this log', undefined, true])
  // stale within the epoch: still no card
  const quiet = rd({ at: T - 3 * 3600_000 })
  const fq = R.freshness(quiet, R.rigStatus(quiet, NOW), NOW)
  assert.deepEqual([fq.stale, fq.previousEpoch, fq.shareable], [true, false, false])
  assert.equal(fq.note, `epoch ${CUR} · 3 h ago`)
})

test('rig: the card endpoint refuses a stale or waiting rig', () => {
  const card = R.cardFrom(rd(), R.rigStatus(rd(), NOW), { kind: 'none', text: '' })
  assert.equal(R.checkCard(card).ok, true)
  const stale = R.checkCard({ ...card, st: 'no-signal' })
  assert.equal(stale.ok, false)
  assert.match((stale as { error: string }).error, /fresh/)
  assert.equal(R.checkCard({ ...card, st: 'waiting' }).ok, false)
})

/* ---------------- sharing ---------------- */

test('share: one helper for the link, the post text and the X intent', () => {
  assert.deepEqual(shareLink(false), { url: SHARE.previewUrl, text: 'qubic.church/mine-qubic' })
  assert.deepEqual(shareLink(true), { url: SHARE.publicUrl, text: 'qubic.church/pool' })
  const card = R.cardFrom(rd(), R.rigStatus(rd(), NOW), { kind: 'none', text: '' })
  const t = shareText(card)
  assert.equal(t, `My rig in the Qubic Church Pool, epoch ${CUR}: 410 sol/h on 2x RTX 5070 Ti · EPYC 7B12, read from my miner log. Set up with Maria, the mining coach.`)
  assert.doesNotMatch(t, /—|\$|USD|\bQUBIC\b/)
  assert.doesNotMatch(t, /earn|profit|income/i)
  const u = new URL(xIntentUrl(t, shareLink(false)))
  assert.equal(`${u.origin}${u.pathname}`, 'https://x.com/intent/post')
  assert.equal(u.searchParams.get('text'), t)
  assert.equal(u.searchParams.get('url'), 'https://qubic.church/mine-qubic')
  assert.match(shareText({ ...card, src: 'demo' }), /^A demo rig .*sample numbers\./)
})

test('payout terms: the method and the minimum stay placeholders until the partner confirms them', () => {
  assert.equal(PAYOUT_TERMS.method, null)
  assert.equal(PAYOUT_TERMS.minimum, null)
  assert.equal(PAYOUT_TERMS.pending, 'Details coming soon.')
})
