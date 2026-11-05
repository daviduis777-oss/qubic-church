// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/brain-public.test.mts
// Public tests for the brain plumbing. They need no brain: the public fallback is safe, the loader and the route
// are wired as documented, and the brain files are gone. The guard against brain text in public code needs the
// private phrase list, so it runs only with MARIA_BRAIN_DIR (a maria-aigarth-botv3 checkout, branch pool-brain)
// and skips without it; the list is never stored in this repo.
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'

const S = await import('../brain-schema.ts')
const P = await import('../prompt.ts')
const { brainFile } = await import('../brain-local.ts')
const { POOL } = await import('../config.ts')

const WEB = new URL('../../../../', import.meta.url).pathname
const read = (p: string) => readFileSync(join(WEB, p), 'utf8')

const walk = (dir: string): string[] =>
  readdirSync(join(WEB, dir)).flatMap(n => {
    const p = join(dir, n)
    return statSync(join(WEB, p)).isDirectory() ? walk(p) : [p]
  })

/** The private phrase list: tests/guard-phrases.json next to the brain file that MARIA_BRAIN_DIR names. */
const BRAIN_DIR = process.env.MARIA_BRAIN_DIR || ''
const guardFile = BRAIN_DIR ? join(dirname(brainFile(BRAIN_DIR)), 'tests', 'guard-phrases.json') : ''
const NO_GUARD = !BRAIN_DIR ? 'needs the private phrase list: set MARIA_BRAIN_DIR to the pool/ folder of a maria-aigarth-botv3 checkout (branch pool-brain)' : false

test('the public site carries no brain text (phrase list from MARIA_BRAIN_DIR)', { skip: NO_GUARD }, () => {
  assert.ok(existsSync(guardFile), `${guardFile} is missing`)
  const phrases: string[] = JSON.parse(readFileSync(guardFile, 'utf8')).phrases
  assert.ok(phrases.length >= 20, `only ${phrases.length} phrases`)
  const files = [...walk('src'), ...walk('scripts')].filter(f => /\.(ts|tsx|mts|mjs|js|json|md|mdx)$/.test(f))
  assert.ok(files.length > 200, `only ${files.length} files scanned`)
  const fallback = P.mariaSystemPrompt(S.FALLBACK_BRAIN) + P.mariaRequestBlock(S.FALLBACK_BRAIN, [{ role: 'user', content: 'hi there, my rig stopped' }])
  for (const [f, text] of [...files.map(f => [f, read(f)]), ['the fallback prompt', fallback]]) {
    // backslashes dropped, so a phrase copied into a regular expression counts too
    const t = text.replace(/\\/g, '')
    for (const p of phrases) assert.ok(!t.includes(p), `${f} contains brain text: "${p.slice(0, 24)}..."`)
  }
})

test('the brain files are gone from the public repo', () => {
  for (const gone of ['src/lib/pool/faq.ts', 'src/lib/pool/rules.ts', 'src/lib/pool/__tests__/brain-env.mts']) assert.ok(!existsSync(join(WEB, gone)), `${gone} still exists`)
  assert.doesNotMatch(read('src/lib/pool/knowledge.ts'), /export const (FACTS|ECOSYSTEM|PREDATES)\b/)
  for (const f of walk('src/lib/pool/__tests__').filter(f => !f.endsWith('brain-public.test.mts'))) assert.doesNotMatch(read(f), /MARIA_BRAIN_DIR=.*--test|await import\('\.\/brain-env/, `${f} still needs the brain`)
})

test('fallback: valid, safe, generic, and fully filled', () => {
  const b = P.checkedBrain(S.FALLBACK_BRAIN)
  assert.equal(b.version, 'fallback')
  const p = P.mariaSystemPrompt(b, new Date('2026-11-05T12:00:00Z'))
  assert.doesNotMatch(p, /\{\{|\}\}|undefined/)
  assert.ok(p.startsWith(`You are Maria, the mining helper of ${POOL.name}.`))
  for (const re of [/wallet seed/, /income, profit, payback/, /coin prices/, /Do not make up commands/, POOL.onboardingUrl, /funds belong in a new wallet/, /NOW \(computed by code/])
    assert.ok(typeof re === 'string' ? p.includes(re) : re.test(p), String(re))
  assert.ok(p.length < 4000, `fallback is ${p.length} chars`)
  const r = P.mariaRequestBlock(b, [{ role: 'user', content: '¿Por qué se cierra mi minero?' }])
  assert.match(r, /^REQUEST\n- Answer language: Spanish/)
  assert.match(P.mariaRequestBlock(b, [{ role: 'user', content: `seed ${'abcdefghijklmnopqrstuvwxyz'.repeat(3).slice(0, 55)}` }]), /wallet seed was removed/)
  assert.equal(P.stalenessNote(b, 'Our runs in epoch 233 showed this.'), '')
})

test('brain file: validated, unknown placeholders and sources rejected', () => {
  const ok = structuredClone(S.FALLBACK_BRAIN)
  assert.doesNotThrow(() => S.validateBrain(ok))
  assert.throws(() => S.validateBrain({ ...ok, version: '' }), /version/)
  assert.throws(() => S.validateBrain({ ...ok, blocks: { ...ok.blocks, playbook: 3 } }), /blocks\.playbook/)
  assert.throws(() => S.validateBrain({ ...ok, facts: [{ topic: 'CPU', text: 'x', sources: ['nowhere'] }] }), /facts\[0\]/)
  assert.throws(() => S.validateBrain({ ...ok, faq: { themes: { a: 'A' }, entries: [{ id: 'x', theme: 'b', q: 'q', must: [], sources: [], asOf: 'now' }] } }), /unknown theme/)
  assert.throws(() => S.validateBrain({ ...ok, select: { ...ok.select, factInFaq: '(' } }), /factInFaq/)
  assert.throws(() => P.checkedBrain({ ...ok, prompt: 'Hi {{POOL.nmae}}' }), /unknown placeholder \{\{POOL\.nmae\}\}/)
  assert.throws(() => S.validateBrain('{}'), /not an object/)
})

test('templates: placeholders fill once, an empty whole-line placeholder drops its line', () => {
  assert.equal(S.fill(['a {{x}}', '{{y}}', 'b'], { x: '1', y: '' }), 'a 1\nb')
  assert.equal(S.fill('{{x}}', { x: '{{y}}' }), '{{y}}')
  assert.throws(() => S.fill('{{z}}', {}), /unknown placeholder/)
  let n = 0
  const v = S.lazyVars({ x: () => String(++n) })
  assert.equal(S.fill('{{x}} {{x}}', v), '1 1')
})

test('loader: private repo and ref by env, server only, cached, never breaks the route', () => {
  assert.deepEqual(S.BRAIN_DEFAULTS, { repo: 'daviduis777-oss/maria-aigarth-botv3', ref: 'pool-brain', path: 'pool/brain.json' })
  assert.equal(S.brainApiUrl(), 'https://api.github.com/repos/daviduis777-oss/maria-aigarth-botv3/contents/pool/brain.json?ref=pool-brain')
  const b = read('src/lib/pool/brain.ts')
  assert.match(b, /^import 'server-only'/)
  for (const re of [/process\.env\.MARIA_BRAIN_TOKEN/, /process\.env\.MARIA_BRAIN_REPO/, /process\.env\.MARIA_BRAIN_REF/, /application\/vnd\.github\.raw\+json/, /revalidate: BRAIN_REVALIDATE, tags: \[BRAIN_TAG\]/, /BRAIN_REVALIDATE = 600/, /FALLBACK_BRAIN/, /console\.warn/])
    assert.match(b, re)
  const route = read('src/app/api/pool/maria/route.ts')
  assert.match(route, /const \{ brain \} = await getBrain\(\)/)
  assert.match(route, /text: mariaSystemStatic\(brain, measured\), cache_control: \{ type: 'ephemeral' \}/)
  assert.match(route, /\{ type: 'text', text: mariaNowBlock\(\) \},\n\s*\{ type: 'text', text: request \}/)
  assert.match(route, /stalenessNote\(brain, said, last\.content\)/)
})

test('client code never imports the brain or the prompt assembly', () => {
  const ui = [...walk('src/components/pool'), ...walk('src/app/[locale]/pool')]
  for (const f of ui) assert.doesNotMatch(read(f), /@\/lib\/pool\/(brain|brain-schema|brain-local|prompt)['/]/, f)
  for (const f of walk('src/lib/pool').filter(f => !f.includes('__tests__')))
    if (!/\/(prompt|brain|brain-local)\.ts$/.test(f)) assert.doesNotMatch(read(f), /from '\.\/(brain|brain-local|prompt)(\.ts)?'/, `${f} imports the brain loader or the prompt`)
})
