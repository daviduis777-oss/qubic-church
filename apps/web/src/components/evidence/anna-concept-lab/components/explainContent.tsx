'use client'

import {
  BlockMath,
  InlineMath,
  Glossary,
} from '@/components/evidence/lab-primitives'

/**
 * Four-tier content (kid / simple / researcher / math) for the rendered
 * Anna Concept Lab modules. Same audience-ladder pattern as
 * cognitive-lab/components/explainContent.tsx.
 */

export const EXPLAIN_ARCHITECTURE = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Anna is a <strong>big checkerboard</strong>: 128 rows and 128 columns of
        numbers. That&apos;s 16,384 little squares. Each square is a small whole
        number.
      </p>
      <p>
        Most of Anna repeats itself! The first 32 rows are a special pattern;
        the next 32 are a copy. The bottom 64 rows are flipped + mirrored
        copies. So <strong>only 32 rows are really original</strong>; the rest
        follow from them, with a few exceptions.
      </p>
      <p>Hover any square to see what number lives there.</p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Anna is a 128 × 128 integer <Glossary term="matrix">matrix</Glossary>:
        16,384 cells, each in [−128, +127]. 94.5 % of the cell signs reconstruct
        from the first 32 rows via a{' '}
        <Glossary term="kernel">kernel + decorations</Glossary> rule. 904 cells
        do not follow that rule.
      </p>
      <p>
        Toggles let you overlay block boundaries, the K-e-y cells, the cells
        that do not follow the rule, or Phase 3 symmetry-break columns. The full
        magnitude data is in
        <code> anna-matrix-min.json</code>.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        128 × 128 int8 matrix. The mirror rule M[i, j] + M[127−i, 127−j] = −1
        holds at 99.58 % of cells (16,316 of 16,384). Kernel reconstruction
        rule: K = sign(M)[0:32]; recon = [K, K, −rot180(K), −rot180(K)]; matches
        sign(M) at 94.5 % accuracy. 904 cells deviate.
      </p>
      <p>
        Integer landmarks: trace = 137 comes from one 100/100 diagonal pair that
        is very likely a data entry error (the corrected table has trace −64);
        the K-e-y values at M[8,74][9,75][10,76] are not unusual under a fair
        null model. Neither is evidence of design.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Kernel + decorations decomposition:</p>
      <BlockMath math="\mathrm{sign}(M) = \hat{W} + \Delta, \quad \hat{W} = \begin{bmatrix} K \\ K \\ -\mathrm{rot}_{180}(K) \\ -\mathrm{rot}_{180}(K) \end{bmatrix}" />
      <p>
        where <InlineMath math="K = \mathrm{sign}(M)_{0:32, :}" /> and{' '}
        <InlineMath math="\Delta" /> has only 904 non-zero entries (≈ 5.5 %).
      </p>
    </>
  ),
}

export const EXPLAIN_BIT_FLIP_GAME = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Pick an input: 64 light switches. Anna runs and ends with 64 output
        switches. Flip one input switch and run again.
      </p>
      <p>
        Sometimes 1 flip changes nothing in the output. Sometimes 1 flip changes
        many output switches. We count how many output switches differ.
      </p>
      <p>
        Try to find an input where you can flip many switches before the output
        changes at all.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Interactive <Glossary term="avalanche">avalanche test</Glossary>. Pick a
        64-<Glossary term="bit">bit</Glossary>
        input, toggle individual bits, and compare the 64-bit output after the
        run with the anchor&apos;s output by Hamming distance (how many bits
        differ).
      </p>
      <p>
        Reported in Phase N M5 (not independently re-run): about{' '}
        <strong>82 %</strong> of 1-bit perturbations leave the output unchanged,
        about <strong>45 %</strong> at 4 bits and about <strong>3 %</strong> at
        32 bits.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        Measures how often the output stays identical under input bit flips.
        Reported in Phase N M5: Pr[AIT(u) = AIT(u⊕δ<sub>r</sub>)] = 0.82 (r=1),
        0.64 (r=2), 0.45 (r=4), 0.25 (r=8), 0.11 (r=16), 0.03 (r=32).
      </p>
      <p>
        This describes output sensitivity only. It does not show that outputs
        fall into a small set of stable end states.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Retention at perturbation radius r:</p>
      <BlockMath math="\mathrm{retention}(r) = \Pr\!\left[ \mathrm{AIT}(W, u) = \mathrm{AIT}(W, u \oplus \delta_r) \right]" />
      <p>Output distance shown in the game:</p>
      <BlockMath math="d_H\big(\mathrm{AIT}(W, u_{\mathrm{anchor}}), \mathrm{AIT}(W, u)\big) \in [0, 64]" />
    </>
  ),
}

export const EXPLAIN_LIVE_INFERENCE = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Watch Anna run, <strong>step by step</strong>. Each tick is one update
        of all neurons.
      </p>
      <p>
        At tick 1 only the input neurons are set. Then output neurons start to
        switch. The run stops when a stop rule fires. Some inputs stop after a
        few ticks, others need many more.
      </p>
      <p>
        You can pause, step forward one tick at a time, or reset with a new
        input. Try to predict which output bits will light up.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Per-tick visualisation of <Glossary term="ait">AIT</Glossary>. State{' '}
        <em>
          v ∈ {'{−1, 0, +1}'}
          <sup>128</sup>
        </em>{' '}
        updates synchronously via <em>v ← sign(W · v)</em> with input clamping.
        The run stops on NO_OUTPUT_ZEROES (all outputs non-zero),
        NO_NSTATE_CHANGES (one tick changed nothing) or the tick cap, as in the
        C scanner.
      </p>
      <p>
        The number of ticks depends on the input; some inputs need 22. The state
        at the stop is the output we show. It is not necessarily a state that
        stays unchanged under further ticks.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        Full state trajectory through AIT iteration. Input neurons (indices
        0–63) hold fixed values from the user&apos;s input; output neurons
        (64–127) update each tick. Stop conditions match the C scanner reference
        (verified 16,384 / 16,384 match in TS port).
      </p>
      <p>
        Per-input metadata: tick count, stop reason, Hamming distance of the
        output to the nearest of the stored reference states, and the share of
        single-bit input flips that leave the output unchanged.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Tick-by-tick update rule:</p>
      <BlockMath math="v^{(t+1)} = \mathrm{ternary\_clamp}(\mathrm{sign}(W) \cdot v^{(t)}), \quad v^{(t+1)}_{0:64} = v^{(0)}_{0:64}" />
      <p>Stop:</p>
      <BlockMath math="\text{stop iff } \forall i \in [64, 128): v^{(t+1)}_i \neq 0 \quad \text{or} \quad v^{(t+1)} = v^{(t)}" />
    </>
  ),
}
