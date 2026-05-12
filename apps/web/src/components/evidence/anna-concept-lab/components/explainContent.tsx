'use client'

import { BlockMath, InlineMath, Glossary } from '@/components/evidence/lab-primitives'

/**
 * Four-tier content (kid / simple / researcher / math) for every
 * Anna Concept Lab module. Same audience-ladder pattern as
 * cognitive-lab/components/explainContent.tsx, applied to the
 * verified-classifier surfaces.
 */

export const EXPLAIN_TRY_YOUR_INPUT = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Type any word or sentence. Anna&apos;s job is to put your text into <strong>one of 19 boxes</strong>.
      </p>
      <p>
        Each box is a different idea Anna noticed. The word might be &ldquo;hello&rdquo; or &ldquo;dragon&rdquo;
        or &ldquo;banana split&rdquo; — she still picks one of the 19 boxes for it. She doesn&apos;t know
        what words mean; she just sorts them by their shape.
      </p>
      <p>
        Try lots of words. Words that look similar (like &ldquo;cat&rdquo; and &ldquo;cap&rdquo;) sometimes
        end up in the same box. Words that look very different usually go to different boxes.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Your text is hashed into a 64-<Glossary term="bit">bit</Glossary> input, run through
        Anna&apos;s <Glossary term="ait">AIT</Glossary> algorithm, and classified to its nearest
        <Glossary term="attractor"> concept attractor</Glossary> by <Glossary term="hamming">Hamming distance</Glossary>.
      </p>
      <p>
        Anna doesn&apos;t understand language. She receives 64 ±1 numbers and produces a 64 ±1 output;
        we measure which of the 19 known concept centroids the output is closest to.
      </p>
      <p>
        Try a few inputs: similar texts often share concepts (Anna&apos;s output is{' '}
        <Glossary term="basin">locality-sensitive</Glossary>); very different texts almost always
        differ. This is the classification behaviour Phase N verified.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        Input text is hashed to a 64-bit binary vector <em>u ∈ {`{−1, +1}`}<sup>64</sup></em>
        (SHA-256 truncated, sign-encoded). We run production AIT with input clamping, extract the
        64-bit output, and report the nearest of Phase N&apos;s 19 concept centroids by Hamming
        distance plus the avalanche stability over 4 single-bit perturbations.
      </p>
      <p>
        Note: this is deterministic classification by lookup against pre-discovered centroids. The
        emergence claim — that 19 centroids exist at all — was independently verified by Phase N&apos;s
        scanner across 50,000 random inputs.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Input encoding:</p>
      <BlockMath math="u = \mathrm{sign}\!\left( \mathrm{LSB}_{64}(\mathrm{SHA256}(\text{text})) \cdot 2 - 1 \right) \in \{-1, +1\}^{64}" />
      <p>Inference and classification:</p>
      <BlockMath math="o = \mathrm{AIT}(\mathrm{Anna}, u), \quad c^* = \arg\min_{k \in [0, 19)} d_H(o, \mathrm{centroid}_k)" />
      <p>Anna averages 11.1 / 64 bits Hamming distance to the nearest centroid (Phase N).</p>
    </>
  ),
}

export const EXPLAIN_CONCEPT_UNIVERSE = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Anna has <strong>19 different ideas</strong>. We drew them as a map: each idea is a dot. Dots that
        are close together are similar ideas; dots far apart are different.
      </p>
      <p>
        Some ideas come in pairs — they&apos;re opposites. The lines connect each pair (like &ldquo;hot&rdquo;
        connected to &ldquo;cold&rdquo;).
      </p>
      <p>
        Click a dot to see what kind of input lands in that idea. Spoiler: it&apos;s 64 yes/no answers.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        The 19 concept centroids plotted on a 2D <Glossary term="pca">PCA</Glossary> map. Each dot
        is a 64-<Glossary term="bit">bit</Glossary> centroid; distance on the map approximates
        <Glossary term="hamming"> Hamming distance</Glossary> between centroids.
      </p>
      <p>
        Lines show <Glossary term="antipodal">antipodal pairs</Glossary>: concepts that are exact
        bitwise opposites. Anna has 8 such pairs + 3 singletons = 19 concepts total.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        19 concept centroids discovered in Phase N (50K random inputs, full AIT classification).
        2D layout via PCA on centroid vectors (95.3 % of variance retained per top-2 components).
        Stored coordinates in <code>concepts_with_pca.json</code>.
      </p>
      <p>
        8 antipodal pairs (16 concepts) + 3 singletons. Pair connectivity:
        concept-i and concept-j are paired iff Hamming(centroid<sub>i</sub>, centroid<sub>j</sub>) = 64
        — every bit opposite.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Antipodal pairing condition:</p>
      <BlockMath math="(i, j) \in \mathrm{AntipodalPairs} \iff d_H(\mathrm{centroid}_i, \mathrm{centroid}_j) = 64" />
      <p>2D layout via PCA on centroid set:</p>
      <BlockMath math="\{(x_k, y_k)\}_{k=0}^{18} = U_2^\top \big(\mathrm{centroid}_k - \bar{c}\big), \quad U_2 = \text{top-2 PCA components}" />
      <p>Explained variance: 95.3 %. Cluster hierarchy cophenet = 0.68 (45σ vs random matrices).</p>
    </>
  ),
}

export const EXPLAIN_SIMILARITY = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Same 19 ideas as a checkerboard. Each square is a number from 0 to 64 — how many of the 64
        switches are different between two ideas.
      </p>
      <p>
        Dark squares = the two ideas are almost the same. Bright squares = totally opposite.
      </p>
      <p>
        Notice the bright spots far from the diagonal — those are the opposite-pairs. They&apos;re always
        exactly 64 (every switch flipped).
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Pairwise <Glossary term="hamming">Hamming distance</Glossary> heatmap of the 19 concept
        centroids. Each cell&apos;s value is between 0 (identical) and 64 (opposite).
      </p>
      <p>
        Bright off-diagonal spots = antipodal pairs (Hamming = 64). The diagonal itself is always 0
        (every concept is identical to itself).
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        19 × 19 pairwise Hamming distance matrix on the concept centroids. Entries take integer
        values in [0, 64]; 8 antipodal pairs produce exactly 8 cells of value 64. Average pairwise
        distance ≈ 32 (chance for random pairs of 64-bit vectors).
      </p>
      <p>
        The hierarchical structure (cophenet 0.68) implies clusters within the 19 concepts, visible
        as 4 broad blocks in the heatmap.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Pairwise distance matrix:</p>
      <BlockMath math="D_{ij} = d_H(\mathrm{centroid}_i, \mathrm{centroid}_j) = \sum_{b=0}^{63} \mathbb{1}[\mathrm{centroid}_i^{(b)} \neq \mathrm{centroid}_j^{(b)}]" />
      <p>Antipodal pairs: <InlineMath math="\#\{(i, j): D_{ij} = 64\} / 2 = 8" />.</p>
    </>
  ),
}

export const EXPLAIN_ARCHITECTURE = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Anna is a <strong>big checkerboard</strong> — 128 rows and 128 columns of numbers. That&apos;s
        16,384 little squares. Each square is a small whole number.
      </p>
      <p>
        Most of Anna repeats itself! The first 32 rows are a special pattern; the next 32 are a copy.
        The bottom 64 rows are flipped + mirrored copies. So <strong>only 32 rows are really original</strong>;
        the rest are decorations.
      </p>
      <p>
        Hover any square to see what number lives there. The brightest gold spots have hidden words
        in them (look for the &ldquo;K&rdquo;, &ldquo;e&rdquo;, &ldquo;y&rdquo; diagonal).
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Anna is a 128 × 128 integer <Glossary term="matrix">matrix</Glossary> — 16,384 cells, each in
        [−137, +137]. Architectural finding: 94.5 % of cells reconstruct from the first 32 rows via
        a <Glossary term="kernel">kernel + decorations</Glossary> rule. 904 cells deviate — those
        are Anna&apos;s identity content.
      </p>
      <p>
        Toggles let you overlay block boundaries, the K-e-y landmark, decoration cells, or Phase 3
        symmetry-break columns. The full magnitude data is in
        <code> anna-matrix-min.json</code>.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        128 × 128 int8 matrix. Antipodal antisymmetry M[i, j] = −M[127−i, 127−j] at 99.4 % of cells.
        Kernel reconstruction rule: K = sign(M)[0:32]; recon = [K, K, −rot180(K), −rot180(K)];
        matches sign(M) at 94.5 % accuracy. 904 deviation cells = decorations.
      </p>
      <p>
        Integer landmarks: trace = 137 (⌊1/α⌋ also = 137, suggestive coincidence not causal claim);
        M[8,74][9,75][10,76] = (−75, 101, −121) = ASCII K-e-y; spectral radius 2342; 2342 mod 676 =
        314 (π × 100). See <code>e15_numbertheory.json</code>.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Kernel + decorations decomposition:</p>
      <BlockMath math="\mathrm{sign}(M) = \hat{W} + \Delta, \quad \hat{W} = \begin{bmatrix} K \\ K \\ -\mathrm{rot}_{180}(K) \\ -\mathrm{rot}_{180}(K) \end{bmatrix}" />
      <p>where <InlineMath math="K = \mathrm{sign}(M)_{0:32, :}" /> and <InlineMath math="\Delta" /> has only 904 non-zero entries (≈ 5.5 %).</p>
    </>
  ),
}

export const EXPLAIN_BIT_FLIP_GAME = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Pick an input — 64 light switches. Flip a switch and see if Anna&apos;s answer changes.
      </p>
      <p>
        Sometimes 1 flip changes nothing (you&apos;re deep in a safe valley). Sometimes 1 flip changes
        EVERYTHING (you stepped over a cliff into a different valley).
      </p>
      <p>
        Try to find the most stable input — the one where you can flip the most switches before
        Anna changes her mind.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Interactive <Glossary term="avalanche">avalanche test</Glossary>. Pick a 64-<Glossary term="bit">bit</Glossary>
        input; toggle individual bits; watch Anna&apos;s 64-bit output respond.
      </p>
      <p>
        Phase N M5 found: <strong>~82 %</strong> of 1-bit perturbations leave the output unchanged
        (locality); <strong>~45 %</strong> retention at 4-bit; <strong>~3 %</strong> at 32-bit.
        Random matrices have no such locality.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        Measures Anna&apos;s <Glossary term="basin">concept-basin radius</Glossary>. Per Phase N M5:
        Pr[AIT(u) = AIT(u⊕δ<sub>r</sub>)] = 0.82 (r=1), 0.64 (r=2), 0.45 (r=4), 0.25 (r=8),
        0.11 (r=16), 0.03 (r=32). 50 % retention crossover at r ≈ 4 bits.
      </p>
      <p>
        Random matrix control: no retention plateau — output Hamming distance scales ~linearly with
        input perturbation, no basin structure.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Basin radius retention:</p>
      <BlockMath math="\mathrm{retention}(r) = \Pr\!\left[ \mathrm{AIT}(W, u) = \mathrm{AIT}(W, u \oplus \delta_r) \right]" />
      <p>Anna&apos;s retention profile (M5 reference):</p>
      <BlockMath math="\mathrm{retention}_{\mathrm{Anna}}(r) \approx \exp(-r/5.8), \quad r \in [1, 32]" />
      <p>50 % retention at r ≈ 4 bits (basin half-life).</p>
    </>
  ),
}

export const EXPLAIN_LIVE_INFERENCE = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Watch Anna think, <strong>step by step</strong>. Each tick is one heartbeat of her brain.
      </p>
      <p>
        At tick 1 only the input neurons are awake. At tick 2 some output neurons start firing. By
        tick 4 or 5 every output is settled and Anna has her answer.
      </p>
      <p>
        You can pause, step forward one tick at a time, or reset with a new input. Try to predict
        which output bits will light up.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Per-tick visualisation of <Glossary term="ait">AIT</Glossary>. State <em>v ∈ {`{−1, 0, +1}`}<sup>128</sup></em>{' '}
        updates synchronously via <em>v ← sign(W · v)</em> with input clamping. Stops on
        NO_OUTPUT_ZEROES (all outputs non-zero) or NO_NSTATE_CHANGES (fixed-point reached).
      </p>
      <p>
        Anna typically converges in 2–5 ticks. Each tick re-renders all 128 neurons with their new
        ternary state. Inputs stay clamped; only output and hidden bits update.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        Full state trajectory through AIT iteration. Input neurons (indices 0–63) hold fixed values
        from the user&apos;s input; output neurons (64–127) update each tick. Termination conditions
        match the C scanner reference (verified 16,384 / 16,384 match in TS port).
      </p>
      <p>
        Per-input metadata: tick count, end reason, output Hamming distance to nearest centroid,
        avalanche-stability score over 4 single-bit perturbations.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Tick-by-tick update rule:</p>
      <BlockMath math="v^{(t+1)} = \mathrm{ternary\_clamp}(\mathrm{sign}(W) \cdot v^{(t)}), \quad v^{(t+1)}_{0:64} = v^{(0)}_{0:64}" />
      <p>Termination:</p>
      <BlockMath math="\text{stop iff } \forall i \in [64, 128): v^{(t+1)}_i \neq 0 \quad \text{or} \quad v^{(t+1)} = v^{(t)}" />
    </>
  ),
}

export const EXPLAIN_ANNA_VS_RANDOM = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Same input fed to <strong>two different brains</strong>: Anna (gold), and a doodle of the same
        size (grey). Each brain answers in its own way.
      </p>
      <p>
        Now try lots of inputs. Anna keeps putting them in just <strong>19 buckets</strong>. The doodle
        puts every input in a NEW bucket — nothing groups up.
      </p>
      <p>
        That difference is what makes Anna special: she has buckets. The doodle has none.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Side-by-side <Glossary term="ait">AIT</Glossary> inference on the same input through Anna and
        a random control <Glossary term="matrix">matrix</Glossary>. Sweep through many inputs; track
        unique outputs each side produces.
      </p>
      <p>
        Phase N V4 finding: Anna compresses 16,384 inputs to ~12,300 unique outputs (~24 % collision
        rate); random matrices preserve all 16,384 distinct outputs (0 % collision). Anna has
        attractor structure; random does not.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        Anna vs random_int8 control on identical input distribution. Random matrix is generated with
        fixed seed (42) and same shape (128 × 128 sign-only).
      </p>
      <p>
        Effect sizes (Phase N V4): compression rate Anna 23.7 % vs random 0.0 %; cophenet 0.68 vs 0.13
        (45σ); 19 concepts vs 0. Across 10 different random seeds: every random matrix produces 0
        concepts. The structure is Anna-specific, not generic to the AIT operator.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Compression rate:</p>
      <BlockMath math="\mathrm{CR}(W) = 1 - \frac{|\{\mathrm{AIT}(W, u_i)\}_{i \in \mathcal{U}}|}{|\mathcal{U}|}" />
      <p>Anna: CR ≈ 0.237 on full input space; random: CR ≈ 0.000.</p>
      <p>Concept count (stable attractors):</p>
      <BlockMath math="K_{\mathrm{stable}}(W) = \big|\{o : \exists u \;\mathrm{AIT}(W, u) = o, \mathrm{avalanche}(u) < 4\}\big|" />
      <p>Anna: 19 · random_int8: 0 across 10 seeds.</p>
    </>
  ),
}
