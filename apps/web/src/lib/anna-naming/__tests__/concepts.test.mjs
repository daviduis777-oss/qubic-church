// Pure-Node assertion test for the concepts naming module.
// Mirrors the test_ait_typescript.mjs pattern.
// Run: node --experimental-strip-types apps/web/src/lib/anna-naming/__tests__/concepts.test.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../../../../../')
const conceptsPath = resolve(repoRoot, 'apps/web/public/data/phase_n/concepts.json')
const conceptsRaw = JSON.parse(readFileSync(conceptsPath, 'utf-8'))
// File is either a top-level array or {concepts: [...]} — handle both shapes.
const concepts = Array.isArray(conceptsRaw) ? conceptsRaw : conceptsRaw.concepts

let buildConceptNamingMap
try {
  ({ buildConceptNamingMap } = await import('../concepts.ts'))
} catch (e) {
  console.error('FAIL: concepts.ts not loadable:', e.message)
  process.exit(1)
}

const namingMap = buildConceptNamingMap(concepts)

if (namingMap.size !== concepts.length) {
  console.error(`FAIL: map size ${namingMap.size} != concepts length ${concepts.length}`)
  process.exit(1)
}

const c0 = namingMap.get(0)
if (!c0) throw new Error('FAIL: concept 0 missing from naming map')
if (c0.pairLabel !== 'A') throw new Error(`FAIL: c0 pairLabel expected "A", got "${c0.pairLabel}"`)
if (c0.polarity !== '+') throw new Error(`FAIL: c0 polarity expected "+", got "${c0.polarity}"`)
if (c0.display !== 'Pair A+') throw new Error(`FAIL: c0 display expected "Pair A+", got "${c0.display}"`)
if (c0.partnerLabel !== 'A-') throw new Error(`FAIL: c0 partnerLabel expected "A-", got "${c0.partnerLabel}"`)

const c1 = namingMap.get(1)
if (!c1 || c1.pairLabel !== 'A' || c1.polarity !== '-') throw new Error('FAIL: concept 1 should be A-')
if (c1.partnerLabel !== 'A+') throw new Error(`FAIL: c1 partnerLabel expected "A+", got "${c1.partnerLabel}"`)

const singletons = [...namingMap.values()].filter((c) => !c.isAntipodal)
if (singletons.length !== 3) throw new Error(`FAIL: expected 3 singletons, got ${singletons.length}`)

const singletonLabels = singletons.map((s) => s.pairLabel).sort()
if (JSON.stringify(singletonLabels) !== JSON.stringify(['S1', 'S2', 'S3'])) {
  throw new Error(`FAIL: singleton labels expected [S1,S2,S3], got ${JSON.stringify(singletonLabels)}`)
}

const c0Source = concepts.find((x) => x.concept_id === 0)
const c0FullExpected = `Pair A+ · #0 · cluster ${c0Source.cluster_size}`
if (c0.fullDisplay !== c0FullExpected) {
  throw new Error(`FAIL: fullDisplay expected "${c0FullExpected}", got "${c0.fullDisplay}"`)
}

// Pairing must be symmetric: every antipodal concept's partnerConceptId equals its partner's concept_id
for (const [, name] of namingMap) {
  if (name.isAntipodal) {
    const partner = namingMap.get(name.partnerConceptId)
    if (!partner) throw new Error(`FAIL: partner not in map for #${name.conceptId}`)
    if (partner.partnerConceptId !== name.conceptId) {
      throw new Error(`FAIL: partner symmetry broken: #${name.conceptId} partners ${name.partnerConceptId}, but ${name.partnerConceptId} partners ${partner.partnerConceptId}`)
    }
    if (name.pairLabel !== partner.pairLabel) {
      throw new Error(`FAIL: pair-label mismatch within partnership: ${name.pairLabel} vs ${partner.pairLabel}`)
    }
  }
}

console.log(
  `PASS: ${namingMap.size} concepts mapped, ${[...namingMap.values()].filter((c) => c.isAntipodal).length / 2} antipodal pairs, ${singletons.length} singletons, format and partnership symmetry correct.`,
)
