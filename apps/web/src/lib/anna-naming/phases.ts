/**
 * Phase code -> public-facing title + tagline mapping.
 * Single source of truth for AigarthLabTab section headings.
 */

interface PhaseEntry {
 title: string
 tagline: string
}

const PHASE_TITLES: Record<string, PhaseEntry> = {
 D1: {
 title: 'Multi-task generality, bias-corrected',
 tagline:
 "Anna's outputs are 86 % zeros. After we subtract the bias-only prediction, 7 tasks still show genuine task-specific signal beyond marginal bit-frequency.",
 },
 D2: {
 title: 'Reproducible across 100 random seeds',
 tagline:
 "Cohen's d = 1.84 — well above the 0.8 'large effect' threshold. Reproduces across n = 100 seeds with Welch p < 10⁻²⁸.",
 },
 D4b: {
 title: 'Magnitude threshold sweep',
 tagline:
 'Cells with absolute value ≥ 64 do the work. Below 64 they add noise; above 64 the matrix goes too sparse.',
 },
 D5: {
 title: '7-position bit signature',
 tagline:
 'The exact 7 positions Chapter 27 found independently from a different angle — z-score 18σ above random period-4 cycles.',
 },
 D10: {
 title: 'Why outputs are 86 % zeros',
 tagline:
 'Antipodal symmetry biases the first 22 rows positive. The all-(−1) state with two exception neurons is a verified fixed point of the dynamics.',
 },
 E2: {
 title: 'Quasi-Anna robustness test',
 tagline:
 'Out of dozens of matrices with the same eigenvalues, Anna is the only one that generalizes from small to full inputs. The top siblings overfit.',
 },
 E5: {
 title: 'Encoded mathematical constants',
 tagline:
 'Trace = 137 (integer landmark; ⌊1/α⌋ = 137 is suggestive but not causal). Spectral radius − ARK supply = 314 (π × 100). Plus the K-e-y diagonal landmark.',
 },
 E9: {
 title: 'Reverse-engineering attempt',
 tagline:
 'No standard matrix family or naïve optimizer recovers Anna. The high spectral dominance is the unrecoverable signature.',
 },
}

const COMPOSITE_ALIASES: Record<string, string> = {
 'D1+D1b+D1c': 'D1',
 D1b: 'D1',
 D1c: 'D1',
 'E5+E15': 'E5',
 E15: 'E5',
}

const PHASE_METHODOLOGY: Record<string, { label: string; auditPath: string }> = {
 D: { label: 'Phase D', auditPath: '' },
 E: { label: 'Phase E', auditPath: '' },
 N: { label: 'Phase N', auditPath: '' },
}

export function getPublicPhaseTitle(code: string): string {
 const canonical = COMPOSITE_ALIASES[code] ?? code
 const entry = PHASE_TITLES[canonical]
 if (!entry) {
 if (typeof console !== 'undefined') {
 console.warn(`[anna-naming] unknown phase code "${code}"`)
 }
 return code
 }
 return entry.title
}

export function getPublicPhaseTagline(code: string): string {
 const canonical = COMPOSITE_ALIASES[code] ?? code
 return PHASE_TITLES[canonical]?.tagline ?? ''
}

export function getMethodologyLabel(phase: string): string {
 const m = PHASE_METHODOLOGY[phase]
 if (!m) return `Phase ${phase}`
 return `Methodology · ${m.label} · ${m.auditPath}`
}

export function getCombinedMethodologyLabel(phases: string[]): string {
 const parts = phases
 .map((p) => PHASE_METHODOLOGY[p])
 .filter((x): x is NonNullable<typeof x> => !!x)
 if (parts.length === 0) return `Methodology · Phase ${phases.join('+')}`
 const labels = parts.map((p) => p.label).join(' + ')
 const audits = parts.map((p) => p.auditPath).join(', ')
 return `Methodology · ${labels} · ${audits}`
}
