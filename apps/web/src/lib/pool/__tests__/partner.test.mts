// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/partner.test.mts
// The miner stays in our app: no link out to the partner, and Maria never writes its address.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const { POOL } = await import('../config.ts')
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

test('partner: named in plain text on the page, never linked', () => {
  const page = src('../../../app/[locale]/pool/page.tsx')
  assert.doesNotMatch(page, /href=\{POOL\.partner\.url\}/)
  assert.match(page, /Our partner \{POOL\.partner\.name\} operates the pool infrastructure/)
  assert.match(page, /Our partner: \{POOL\.partner\.name\}/)
})

test('prompt: the setup page is named by where it opens in the app, never by its address', () => {
  assert.doesNotMatch(POOL.setupRef, /https?:|codedonqubic/)
  assert.match(src('../prompt.ts'), /'POOL\.onboardingUrl': POOL\.setupRef/)
})

test('maria: her X account is linked under her intro on the pool page', async () => {
  const { MARIA } = await import('../qc.ts')
  assert.equal(MARIA.x.url, 'https://x.com/maria_aigarth')
  assert.match(src('../../../app/[locale]/pool/qc.tsx'), /href=\{MARIA\.x\.url\}/)
})
