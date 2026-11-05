// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/tip.test.mts
// Tip Maria: one address for the whole site, a quiet button under an answer, never asked for in a reply.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const D = await import('../../donate.ts')
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

test('donate: one address, used by the donate page, the footer and Tip Maria', () => {
  assert.match(D.DONATION_ADDRESS, /^[A-Z]{60}$/)
  for (const f of ['../../../app/[locale]/donate/page.tsx', '../../../components/site-footer.tsx', '../../../components/pool/maria/tip.tsx']) {
    const s = src(f)
    assert.match(s, /from '@\/lib\/donate'/, f)
    assert.doesNotMatch(s, /'[A-Z]{60}'/, `${f} keeps no copy of the address`)
  }
  assert.match(D.ATRIUM.line, /Atrium/)
  assert.match(D.ATRIUM.line, /film about Come-from-Beyond/)
  assert.doesNotMatch(D.ATRIUM.line, /—/)
})

test('tip: a quiet chip beside Report a problem, its own screen, not an app on the home grid', async () => {
  const ask = src('../../../components/pool/maria/AskFlow.tsx')
  assert.match(ask, /\{ value: 'report', label: 'Report a problem', quiet: true \},\n\s+\{ value: 'tip', label: 'Tip Maria', quiet: true \}/)
  const app = src('../../../components/pool/maria/MariaApp.tsx')
  assert.match(app, /e\.screen === 'tip' && <TipApp go=\{go\} \/>/)
  const { APPS } = await import('../qc.ts')
  assert.ok(!APPS.some(a => (a.id as string) === 'tip'), 'not on the home grid')
  const tip = src('../../../components/pool/maria/tip.tsx')
  assert.match(tip, /QRCodeSVG/)
  assert.match(tip, /CopyButton/)
  assert.match(tip.replace(/\s+/g, " "), /will ever write to you for a tip or ask for your seed/)
})
