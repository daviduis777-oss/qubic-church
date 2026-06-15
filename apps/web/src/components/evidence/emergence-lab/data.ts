// Static data for the Anna.exe & Emergence lab tab.
// Source: audit/2026-06-10-anna-exe/ (EMERGENT_GENERALIZATION_RESULT.md,
// REVERSE_ENGINEERING_REPORT.md, NOVELTY_CHECK.md). Honest neutral framing:
// the contribution is methodological; prior art is named. No "first AI" claim.

export interface DecompositionRow {
  component: string
  emerges: boolean
  evidence: string
}

// The decomposition theorem: every algorithm component can emerge by selection
// except the bare iterate-and-check primitive.
export const DECOMPOSITION: DecompositionRow[] = [
  { component: 'The cell function (full adder)', emerges: true, evidence: 'Phase 1 — 26/26 seeds, exact to width 128' },
  { component: 'Carry direction / information flow', emerges: true, evidence: 'Phase 3 — 5/5, bit-exact to 512' },
  { component: 'Wiring dimensionality (2-D)', emerges: true, evidence: 'Phase 5 — 12/12 rank-2, exact to 32×32' },
  { component: 'Connectivity vs distractors', emerges: true, evidence: 'Phase 6/7 — local link recovered; affine address found' },
  { component: 'Internal representation (state machine)', emerges: true, evidence: 'Phase 9 — 12/12 invent mod-3, exact to length 128' },
  { component: 'Task-generality (one substrate, many tasks)', emerges: true, evidence: 'Phase 10 — mod-2/3/4; mod-5 = search edge' },
  { component: 'Composition of a primitive', emerges: true, evidence: 'Phase 11/12 — one adder → 6 capabilities' },
  { component: 'Higher-order structure (shift-and-add)', emerges: true, evidence: 'Phase 13 — multiplication discovered' },
  { component: 'Loop flow (2-D nested loop)', emerges: true, evidence: 'Phase 14 — the array-multiplier flow' },
  { component: 'Loop bound / when to stop', emerges: true, evidence: 'Phase 15 — 8/8 self-halt at exactly W+1, to width 32' },
  { component: 'The bare iterate-and-check primitive', emerges: false, evidence: 'Logically entailed by unbounded input — a finite-description limit, not a search-budget one' },
]

export interface Phase {
  n: string
  title: string
  tested: string
  result: string
}

// The phase ladder (core 15 + extended note).
export const PHASES: Phase[] = [
  { n: '1', title: 'Cell function', tested: 'One module evolved only on 2-bit addition (16 examples), then tiled with one binary channel', result: '26/26 seeds length-generalize; identical exact full adder; exact to width 128 (500k random pairs). Controls A/B/C make it a proof.' },
  { n: '3', title: 'Carry direction', tested: 'Cells can read both neighbours; which direction does the carry flow?', result: '5/5 converge to left-only (correct low-to-high); bit-exact to width 512 (zero wrong of 2,052,000 bits).' },
  { n: '4', title: 'Topology under over-provisioning', tested: 'Spare registers + 8 candidate channels', result: 'Footprint-minimizing search lifts 2/12 → 9/12; every winner uses the carry-direction offset.' },
  { n: '5', title: 'Wiring dimensionality', tested: '2-D parity-prefix, provably impossible for any 1-D wiring', result: '12/12 use exactly {N, W, NW}, verified rank 2, exact 2×2 → 32×32. Correctness is itself a proof of dimensionality.' },
  { n: '6/7', title: 'Connectivity & addressing', tested: 'Menu with a global-broadcast distractor; then no menu, cell reads a·i+b', result: 'Local link recovered 8/8; affine addressing discovers a=1,b=−1 (predecessor) 15/15 to width 32.' },
  { n: '8', title: 'Pre-registered noise law', tested: 'Predicted when emergence is clean vs noisy, on a new task', result: 'One half FAILED → refined (over-provisioning must coincide with overfit-ability). A law that survived its own falsification.' },
  { n: '9', title: 'Invented internal representation', tested: 'mod-3 divisibility with a blank register, trained on lengths {3,4,5}', result: '12/12 generalize exactly (80k random strings; a wrong rule would pass with prob ~10⁻³⁴⁹). Each seed invents its own machine.' },
  { n: '10', title: 'Task-generality', tested: 'Divisibility by k ∈ {2,3,4,5} on a fixed substrate', result: 'mod-2/3/4 generalize to 128; mod-5 unsolved within budget (search edge, not capacity).' },
  { n: '11/12', title: 'Composition', tested: 'A frozen full adder composed into many capabilities', result: 'One block → 6 generalizing capabilities (ADD, SUB, INC, DEC, NEG, GE). Selection self-assembles them.' },
  { n: '13', title: 'Higher-order structure', tested: 'Discover the addend rule over a frozen accumulate skeleton', result: '2/12 compute exact N×M to width 16 — shift-and-add discovered.' },
  { n: '14', title: 'Loop flow', tested: 'Frozen multiplier cell, bare grid — which direction feeds accumulator vs carry?', result: 'Exactly 1/16 direction pairs gives the array-multiplier flow to width 12.' },
  { n: '15', title: 'Loop bound', tested: 'Per-cell done bit, halt on consensus', result: '8/8 compute the sum and self-terminate; at width 16 every input halts at exactly step 17 = W+1.' },
  { n: '16–27', title: 'Extended ladder', tested: 'In-context recall, few-shot induction, world-model, agents, self-model, interpretability', result: 'Few-shot learner identified bit-exactly as version-space elimination; recorded with prior art and effect sizes named.' },
]

export interface NoveltyItem {
  phenomenon: string
  prior: string
}

export const NOVELTY: { verdict: string; items: NoveltyItem[]; theOneNew: string } = {
  verdict:
    'Four independent adversarial literature passes agreed: the novelty is methodological, not phenomenal. The contribution is the exactly-decidable, exhaustively-verifiable substrate with matched controls and pre-registration, plus the unification of a ladder shown before only piecemeal and approximately.',
  items: [
    { phenomenon: 'Coverage / noise law', prior: 'Kashtan & Alon 2005 (near-identical substrate)' },
    { phenomenon: 'Modularity via connection cost', prior: 'Clune, Mouret & Lipson 2013' },
    { phenomenon: 'Evolved arithmetic / multiplier', prior: 'Miller & Thompson 2000' },
    { phenomenon: 'Evolved finite-state machine', prior: 'Fogel 1966' },
    { phenomenon: 'Evolved internal representation', prior: 'Beer 2003' },
    { phenomenon: 'Selection invents structure', prior: 'Thompson 1996' },
    { phenomenon: 'Emerged few-shot learner', prior: "Mitchell's version-space elimination" },
    { phenomenon: 'Evolved in-context learning', prior: 'VSML / Kirsch; Najarro & Risi' },
  ],
  theOneNew:
    'The one narrow candidate-new identification: reading an emerged few-shot learner bit-exactly as a known symbolic algorithm (version-space elimination). Even this is flagged pending a citation-graph check before any "first".',
}

export interface SubstrateFact {
  label: string
  value: string
}

export const SUBSTRATE: SubstrateFact[] = [
  { label: 'What it is', value: "CFB's Aigarth evolution engine (not the published Anna Matrix, not qubic/core)" },
  { label: 'Substrate', value: '100-cell ternary lookup-table cellular automaton, ≤100 timesteps, control-cell halting' },
  { label: 'Task', value: '7-bit + 7-bit addition (16,384 operand pairs = Anna 128×128 element count)' },
  { label: 'Search', value: '(1+1) evolution strategy — mutate one trit, accept if not worse, 1,000,000 epochs' },
  { label: 'Randomness', value: 'RDRAND (hardware) for tasks and mutations → every run unique, non-reproducible' },
  { label: 'Bounty', value: '1,000,000,000 QU for “score 0” — analysis finds it out of reach for the binary’s blind single-trit search' },
]

export interface AnnaVersion {
  version: string
  built: string
  change: string
}

export const VERSIONS: AnnaVersion[] = [
  { version: 'v1 (Anna.exe)', built: 'Jun 10 14:15', change: 'Base engine: (1+1)-ES, EPOCH/pos/neg/neu telemetry' },
  { version: 'v2', built: 'Jun 10 19:13', change: 'Automatic "unsticking" + multithread + shared global best' },
  { version: 'v3', built: 'Jun 10 20:36', change: 'Manual SPACE-key drive; reskinned "spacecraft" telemetry' },
  { version: 'v4', built: 'Jun 13 11:51', change: 'Adds a state snapshot (Anna.data.snapshot0)' },
]
