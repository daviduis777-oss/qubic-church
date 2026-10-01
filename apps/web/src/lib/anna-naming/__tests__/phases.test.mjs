// Run: node --experimental-strip-types apps/web/src/lib/anna-naming/__tests__/phases.test.mjs

const { getPublicPhaseTitle, getMethodologyLabel, getCombinedMethodologyLabel } =
 await import('../phases.ts')

const cases = [
 ['D1', 'Multi-task generality, bias-corrected'],
 ['D1+D1b+D1c', 'Multi-task generality, bias-corrected'],
 ['D1b', 'Multi-task generality, bias-corrected'],
 ['D1c', 'Multi-task generality, bias-corrected'],
 ['D2', 'Reproducible across 100 random seeds'],
 ['D4b', 'Magnitude threshold sweep'],
 ['D5', '7-position bit signature'],
 ['D10', 'Why outputs are 86 % zeros'],
 ['E2', 'Quasi-Anna robustness test'],
 ['E5', 'Encoded mathematical constants'],
 ['E15', 'Encoded mathematical constants'],
 ['E5+E15', 'Encoded mathematical constants'],
 ['E9', 'Reverse-engineering attempt'],
]

for (const [code, expected] of cases) {
 const got = getPublicPhaseTitle(code)
 if (got !== expected) {
 console.error(`FAIL: ${code} -> "${got}", expected "${expected}"`)
 process.exit(1)
 }
}

const ml = getMethodologyLabel('D')
if (!ml.includes('Phase D')) {
 console.error(`FAIL: methodology label malformed: ${ml}`)
 process.exit(1)
}

const cml = getCombinedMethodologyLabel(['D', 'E'])
if (!cml.includes('Phase D + Phase E') || !cml.includes('2026-05-04') || !cml.includes('2026-05-05')) {
 console.error(`FAIL: combined methodology label malformed: ${cml}`)
 process.exit(1)
}

// Suppress console.warn for unknown-code fallback to keep test output clean
const origWarn = console.warn
console.warn = () => {}
const unknown = getPublicPhaseTitle('Z99')
console.warn = origWarn
if (unknown !== 'Z99') {
 console.error(`FAIL: unknown code should fall through, got "${unknown}"`)
 process.exit(1)
}

console.log(`PASS: ${cases.length} phase titles + methodology label + combined label + fallback OK.`)
