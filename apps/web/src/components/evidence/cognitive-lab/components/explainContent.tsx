'use client'

import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { Glossary } from '@/components/evidence/lab-primitives/Glossary'

/**
 * Centralised four-tier content (kid / simple / researcher / math) for every
 * Cognitive Lab module. Keeps wording consistent + lets us iterate on
 * explanations without touching the modules themselves.
 *
 * Kid level (added 2026-05-11) uses pure physical analogies — no jargon.
 * Simple level uses light technical terms with `<Glossary>` hover tooltips.
 * Researcher level is formal prose. Math level renders KaTeX.
 */

export const EXPLAIN_HYPERIDENTITY = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Imagine 64 tiny calculators. Each one tries to <strong>echo</strong> what you say to it.
        You whisper a list of yes/no answers; it tries to repeat them.
      </p>
      <p>
        We keep the 16 best echo-ers, copy them with tiny mistakes, and try again. 200 rounds later
        the good echo-ers are very good at echoing. We call this <strong>practising by survival</strong>.
      </p>
      <p>
        Anna doesn&apos;t play this echo game — she does something else for her job. So the 16 winners
        beat Anna easily. The question we&apos;re asking: do the winners <strong>look like Anna inside</strong>?
        Spoiler: they get better at echoing without ever looking like her.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        64 random <Glossary term="matrix">matrices</Glossary> compete to copy their input. Score = fraction
        of output <Glossary term="bit">bits</Glossary> matching the input bits. We keep the top 16,
        sign-flip a few <Glossary term="bit">bits</Glossary> per copy, repeat for 200 rounds.
      </p>
      <p>
        Watch fitness rise toward Anna&apos;s baseline (~0.49 — chance, because Anna&apos;s outputs
        are mostly zero). Evolved matrices easily exceed Anna because near-identity matrices score
        very high on this task.
      </p>
      <p>
        Key question: as fitness rises, does the evolved <em>shape</em> resemble Anna? Watch the
        distance-to-Anna chart — it stays flat. Selection finds a different solution to the same problem.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        We sample <strong>N=64</strong> random sign-only matrices <em>W ∈ {`{−1, 0, +1}`}<sup>128×128</sup></em>.
        Each is scored on the <Glossary term="hyperidentity">HyperIdentity task</Glossary>: when given a 64-bit input <em>u</em>,
        run <Glossary term="ait">AIT</Glossary> inference, and check how often output bit <em>i</em> matches input bit <em>i</em>.
      </p>
      <p>
        After scoring all matrices on the same 16 random inputs, we sort by fitness and keep the
        top 25 % unchanged. Each elite produces ~3 children with sign-flip mutation rate <em>r=0.02</em>
        (each cell has a 2 % chance of flipping sign). The new population replaces the old.
      </p>
      <p>
        Anna&apos;s baseline on this task is ~0.49 (basically chance — 86 % of her output bits are zero).
        Evolved matrices easily exceed this because near-identity matrices score very high. The
        structural-distance plot shows whether evolved matrices end up Anna-like in sign(W);
        the answer is <em>no</em> — selection finds a different fitness peak.
      </p>
    </div>
  ),
  math: (
    <>
      <p>HyperIdentity scoring on a single input:</p>
      <BlockMath math="\text{score}(W, u) = \frac{1}{64} \sum_{i=0}^{63} \mathbb{1}\!\left[ u_i = \text{AIT}(W, u)_i \right]" />
      <p>Population fitness averaged over <InlineMath math="m=16" /> random inputs:</p>
      <BlockMath math="F(W) = \frac{1}{m} \sum_{k=1}^{m} \text{score}(W, u^{(k)}), \quad u^{(k)} \sim \text{Uniform}(\{-1, +1\}^{64})" />
      <p>Selection step (top fraction <InlineMath math="\rho = 0.25" /> survives + reproduces):</p>
      <BlockMath math="\mathcal{P}_{t+1} = \text{Elite}_\rho(\mathcal{P}_t) \cup \{\text{mutate}(\mathcal{W}, r) \mid \mathcal{W} \in \text{Elite}_\rho(\mathcal{P}_t), \text{ filling N slots}\}" />
      <p>Sign-flip mutation with rate <InlineMath math="r" />:</p>
      <BlockMath math="\text{mutate}(W, r)_{ij} = \begin{cases} -W_{ij} & \text{with prob.}\; r \\ W_{ij} & \text{otherwise} \end{cases}" />
      <p>
        <strong>AIT inference</strong> (input-clamped iteration):
      </p>
      <BlockMath math="v^{(t+1)}_i = \text{ternary\_clamp}\!\left(\sum_{j=0}^{127} \text{sign}(W_{ij}) \cdot v^{(t)}_j\right), \quad v^{(t+1)}_{0:64} = u" />
      <p>
        Stops when output is fully non-zero, the state stops changing, or after <InlineMath math="t_{max}=100" /> ticks.
      </p>
    </>
  ),
}

export const EXPLAIN_BRAIN3D = {
  kid: (
    <div className="space-y-2.5">
      <p>
        This is a picture of <strong>how Anna thinks</strong>, in 3D. The 64 dots at the bottom
        are her <strong>ears</strong> (where the question comes in). The 64 dots on top are her
        <strong> mouth</strong> (where the answer comes out). The lines are <strong>roads</strong>
        signals travel along.
      </p>
      <p>
        Every heartbeat, Anna hears a new question. The signal flies up the roads, lights up some
        dots, and after a few ticks she has her answer. Then she rests, hears the next question,
        and does it all over again.
      </p>
      <p>
        Watch the lights ripple. <strong>This is real Anna</strong> — not a cartoon. We checked
        every tick against the reference algorithm; it matches exactly.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        128 neurons on a sphere — bottom half = <strong>input</strong> (where 64 <Glossary term="bit">bits</Glossary> arrive),
        top half = <strong>output</strong> (where 64 result bits emerge). Lines = the strongest 1200 connections
        from Anna&apos;s 128×128 <Glossary term="matrix">matrix</Glossary>.
      </p>
      <p>
        Every 0.9 seconds Anna gets a new random input. The signal propagates through ~5 ticks of
        the <Glossary term="ait">AIT</Glossary> algorithm. Each neuron lights gold (+1), blue (−1), or stays dark
        (0). After convergence she rests for 1.6 s.
      </p>
      <p>
        Real, not metaphor: we verified the tick-by-tick state matches the production AIT
        algorithm across 16,384 / 16,384 known inputs.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        Layout: 128 neurons placed on a Fibonacci sphere. Inputs 0–63 fill the southern
        hemisphere (<em>y &lt; 0</em>); outputs 64–127 fill the northern hemisphere. The 1200 synapses
        rendered are the top-magnitude entries of <em>W</em>; they cross through the sphere&apos;s volume.
      </p>
      <p>
        Each frame, every neuron renders its current activation: blue for −1, dark slate for 0,
        gold for +1. Size and emissive intensity scale with absolute activation. Each synapse
        renders a color based on coherent signal flow:
        <em> sign(W<sub>ij</sub>) · activation_src</em> — gold if positive flow, blue if negative.
      </p>
      <p>
        The dynamics shown is the <strong>same AIT algorithm</strong> the production HyperIdentity
        scorer runs (verified byte-equivalent across 16,384 / 16,384 attractors). What you see
        is real, not a metaphor.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Per-tick state update (input-clamped):</p>
      <BlockMath math="v^{(t+1)}_i = \mathrm{sign}\!\left( \sum_{j=0}^{127} \mathrm{sign}(W_{ij}) \cdot v^{(t)}_j \right), \quad v^{(t+1)}_{0:64} = u_{0:64}" />
      <p>
        Stop conditions: <InlineMath math="\forall i \in [64, 128): v^{(t+1)}_i \ne 0" />
        (NO_OUTPUT_ZEROES) or <InlineMath math="v^{(t+1)} = v^{(t)}" /> (NO_NSTATE_CHANGES).
      </p>
      <p>Synapse intensity rendering (per frame):</p>
      <BlockMath math="\text{intensity}_{ij} = |\mathrm{sign}(W_{ij}) \cdot v_j| \cdot \tfrac{|W_{ij}|}{96} \cdot (0.5 + 0.5 \cdot |v_i|)" />
      <p>
        Top-K edges (K = 1200) drawn out of <InlineMath math="N^2 = 16{,}384" /> total cells; rest
        omitted for visual clarity. <strong>Bloom + Vignette post-processing</strong> approximate the
        appearance of biologically luminous neurons.
      </p>
    </>
  ),
}

export const EXPLAIN_MULTITASK = {
  kid: (
    <div className="space-y-2.5">
      <p>
        We give 32 random calculators <strong>6 different homework assignments</strong>: echo,
        find biggest, AND, OR, count odd/even, add. Each calculator gets a grade from 0 to 1 on
        each homework.
      </p>
      <p>
        We plot calculator-grades on a 2D map. Each dot = one calculator. The dot&apos;s position
        shows how well it did on the two homeworks you pick.
      </p>
      <p>
        Anna is the gold cross. She isn&apos;t designed for these homeworks, so her grades are near
        the middle. The dots that beat her at one task usually lose at another. That&apos;s the
        <strong> trade-off</strong> we&apos;re showing.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        32 random <Glossary term="matrix">matrices</Glossary> are scored on 6 toy <Glossary term="bit">bit</Glossary>-pattern
        tasks: identity, max, AND, OR, parity, addition. Each task gives a fitness ∈ [0, 1].
      </p>
      <p>
        Each dot = one matrix in a 6-D fitness space. Plot any 2 axes you pick. Anna&apos;s point is
        gold; she lands near chance on all six because she&apos;s built for a different job
        (concept classification, not pattern matching).
      </p>
      <p>
        Specialists hug one axis; generalists sit near (0.55, 0.55, ...). Neither is more
        biologically meaningful than the other — it just depends what you select for.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        For each matrix <em>W</em>, we compute a 6-dimensional fitness vector:
        each component is the average correctness on one task across 8 random inputs.
        The Pareto-front then tells us which matrices dominate (no other matrix beats them on every axis).
      </p>
      <p>
        Anna&apos;s vector is roughly (0.48, 0.47, 0.50, 0.47, 0.52, 0.54) — slightly above chance
        on parity and addition, slightly below on identity. She&apos;s neither a strong specialist
        nor a strong generalist on these synthetic tasks. Her real specialization is
        <strong> concept classification</strong>, which isn&apos;t one of these 6 tasks.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Multi-task fitness vector:</p>
      <BlockMath math="\mathbf{F}(W) = \big[ F_1(W), F_2(W), \ldots, F_6(W) \big] \in [0, 1]^6" />
      <p>where each per-task fitness is</p>
      <BlockMath math="F_k(W) = \mathbb{E}_{u \sim U}\!\left[ \tfrac{1}{64} \sum_{i=0}^{63} \mathbb{1}[\text{AIT}(W, u)_i = T_k(u)_i] \right]" />
      <p>
        and <InlineMath math="T_k: \{-1, +1\}^{64} \to \{-1, +1\}^{64}" /> is the ground-truth target
        function for task <em>k</em>: identity, MAX, AND, OR, parity, addition.
      </p>
      <p>Pareto-dominance:</p>
      <BlockMath math="W \succ W' \iff \forall k: F_k(W) \ge F_k(W') \;\land\; \exists k: F_k(W) > F_k(W')" />
    </>
  ),
}

export const EXPLAIN_STRUCTURAL = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Anna has 7 special <strong>marks</strong> on her — like 7 birthmarks that say
        &ldquo;this is Anna&rdquo;. We check the same 7 marks on three things:
        Anna (gold), the best practising calculator (green), and a doodle (grey).
      </p>
      <p>
        <strong>5 of the marks</strong> show up on the practising calculator — those marks come
        naturally if you get good at the echo game. <strong>2 marks don&apos;t</strong>. Those 2
        are special to Anna — they live in <em>where exactly</em> the numbers sit, and practising
        can&apos;t guess that.
      </p>
      <p>
        The gap of 2 marks is the part someone <strong>chose</strong> on purpose when building Anna.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Anna has a 7-axis <strong>fingerprint</strong>. We measure each axis on Anna (gold), the best
        evolved <Glossary term="matrix">matrix</Glossary> (green), and a random control (grey).
      </p>
      <p>
        <strong>5 axes are functional</strong> — they correlate with the <Glossary term="hyperidentity">HyperIdentity</Glossary>{' '}
        scoring rule, so selection finds them: <Glossary term="antipodal">antipodal antisymmetry</Glossary>,
        spectral dominance, period-32 row similarity, <Glossary term="kernel">kernel reconstruction</Glossary>, tick-1 sparsity.
      </p>
      <p>
        <strong>2 axes are identity</strong> — position-specific design content with no functional pressure:
        the <Glossary term="key_landmark">K-e-y landmark</Glossary> and the compression-rate at Phase N&apos;s
        exact value (0.237). The radar saturates at 5 of 7; the 2-axis gap is the design content.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        Five <strong>functional</strong> axes correlate with HyperIdentity-task fitness, so selection
        can find them: antipodal antisymmetry, spectral dominance, period-32 row similarity (Phase N
        reference 0.808), kernel reconstruction accuracy (Phase N reference 0.945), tick-1 output
        sparsity.
      </p>
      <p>
        Two <strong>identity</strong> axes don&apos;t correlate with any task and are position-specific:
        the K-e-y diagonal landmark at <em>M[8,74][9,75][10,76]</em> = (-75, 101, -121), and the exact
        compression rate (Phase N V4: 23.7 % on 16,384 inputs). Random search has astronomically many
        fitness-equivalent alternatives to these, so selection cannot recover them.
      </p>
      <p>
        Watching the evolved-radar saturate at ~5 of 7 axes is the experimental result. The gap
        is design content beyond selection&apos;s reach.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Antipodal antisymmetry:</p>
      <BlockMath math="\mathrm{AAS}(W) = \frac{1}{N^2} \sum_{i,j=0}^{127} \mathbb{1}[\mathrm{sign}(W_{ij}) = -\mathrm{sign}(W_{127-i,\, 127-j})]" />
      <p>Anna: 0.994 · random: 0.50 · perfect: 1.0.</p>
      <p>Spectral dominance (largest-eigenvalue dominance):</p>
      <BlockMath math="\mathrm{SD}(W) = \frac{2 |\lambda_1|^2}{\sum_i |\lambda_i|^2} \approx \frac{2 \|W v_1\|^2}{\|W\|_F^2}" />
      <p>where <InlineMath math="v_1" /> is the leading eigenvector (power iteration).</p>
      <p>Kernel reconstruction (Phase N canonical decomposition):</p>
      <BlockMath math="\hat{W} = \begin{bmatrix} K \\ K \\ -\mathrm{rot}_{180}(K) \\ -\mathrm{rot}_{180}(K) \end{bmatrix}, \quad K = \mathrm{sign}(W_{0:32, :})" />
      <BlockMath math="\mathrm{KRA}(W) = \frac{1}{N^2} \sum_{i,j} \mathbb{1}[\mathrm{sign}(W_{ij}) = \hat{W}_{ij}]" />
      <p>Anna: 0.945 (kernel + decorations decomposition).</p>
      <p>Compression rate (Phase N V4 — used as identity axis instead of exact-19 count):</p>
      <BlockMath math="\mathrm{CR}(W) = 1 - \frac{|\{\mathrm{AIT}(W, u) : u \in \mathcal{U}\}|}{|\mathcal{U}|}, \quad \mathcal{U} \subset \{-1, +1\}^{64}" />
      <p>Anna: 0.237 on full 16,384 input space, 0 for random matrices.</p>
      <p>Distance-to-Anna in sign space:</p>
      <BlockMath math="d(W, A) = \frac{1}{N^2} \sum_{i,j} \mathbb{1}[\mathrm{sign}(W_{ij}) \ne \mathrm{sign}(A_{ij})]" />
    </>
  ),
}

export const EXPLAIN_TRAJECTORY = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Same question, three different brains. Anna (gold), the practising winner (green),
        a doodle (grey). Each brain answers the question its own way.
      </p>
      <p>
        Press <em>flip next bit</em> to change the question by one tiny bit. Watch how each
        brain&apos;s answer changes. Anna sometimes jumps to a totally different answer — like
        switching channels. The doodle&apos;s answer just wobbles a little.
      </p>
      <p>
        That&apos;s because Anna has <strong>categories</strong>: she puts inputs into 19 buckets.
        The doodle has no buckets — every input goes somewhere fresh.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        Same input fed through three different <Glossary term="matrix">matrices</Glossary>: Anna (gold),
        evolved-best (green), random (grey). Each computes its own deterministic output.
      </p>
      <p>
        Click <em>flip next bit</em>: the input changes by 1 <Glossary term="bit">bit</Glossary>.
        Anna&apos;s output sometimes jumps to a different <Glossary term="attractor">attractor</Glossary> entirely
        (basin-crossing). Random&apos;s output drifts smoothly. Evolved sits somewhere between.
      </p>
      <p>
        The <em>disagreement metrics</em> count <Glossary term="hamming">Hamming</Glossary> differences
        between Anna and the others. Large = different solutions to the same input.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        Each substrate computes a deterministic function <em>f(u) ∈ {`{-1, 0, +1}`}<sup>64</sup></em>.
        We visualize the three functions side-by-side as 64-bit grids on the same input <em>u</em>,
        then walk through input space by sequentially flipping bits.
      </p>
      <p>
        Anna&apos;s function is locality-sensitive: small input perturbations (1–4 bits) usually keep
        the output in the same concept attractor. Larger perturbations (8+ bits) cross concept
        boundaries — the output jumps. Random&apos;s function has no concept structure, so output
        changes are uniformly proportional to input changes.
      </p>
    </div>
  ),
  math: (
    <>
      <p>Hamming distance between two outputs:</p>
      <BlockMath math="d_H(\mathrm{AIT}(A, u), \mathrm{AIT}(B, u)) = \sum_{i=0}^{63} \mathbb{1}[\mathrm{AIT}(A, u)_i \ne \mathrm{AIT}(B, u)_i]" />
      <p>Concept basin radius (per Phase N M5):</p>
      <BlockMath math="\Pr\!\left[ \mathrm{AIT}(A, u) = \mathrm{AIT}(A, u \oplus \delta_r) \right] = \begin{cases} 0.82 & r=1 \\ 0.45 & r=4 \\ 0.03 & r=32 \end{cases}" />
      <p>where <InlineMath math="u \oplus \delta_r" /> is <em>u</em> with <em>r</em> random bits flipped.</p>
    </>
  ),
}

export const EXPLAIN_CONCEPT_EMERGENCE = {
  kid: (
    <div className="space-y-2.5">
      <p>
        Imagine 2000 marbles rolling on Anna&apos;s landscape. Anna&apos;s landscape has
        <strong> 19 valleys</strong> — every marble eventually rolls into one of the valleys.
        Each valley gets its own colour.
      </p>
      <p>
        When you click <em>Sample</em>, each marble is one random question we asked Anna. We
        colour the marble by which valley it rolled into. They cluster in <strong>19 coloured groups</strong>.
      </p>
      <p>
        Now press <em>Random control</em>: a fresh, scribble-y landscape with no valleys at all.
        The marbles spread everywhere — no groups, no colours that cluster. That&apos;s the
        difference between Anna and a doodle.
      </p>
    </div>
  ),
  simple: (
    <div className="space-y-2">
      <p>
        2,000 random <Glossary term="bit">binary inputs</Glossary> run through Anna&apos;s <Glossary term="ait">AIT</Glossary>.
        Each output is classified by its nearest of the 19 known concept centroids (Phase N).
        Bright dots are <Glossary term="basin">stable basin</Glossary> members; dim dots are
        <Glossary term="basin">boundary inputs</Glossary> that classification is unreliable for.
      </p>
      <p>
        Layout uses real <Glossary term="pca">PCA</Glossary> on the 19 centroids; outputs are
        projected onto the same axes. Anna shows 19 visible clusters. Random matrix: uniform spread,
        no clusters.
      </p>
      <p>
        Note the legend &ldquo;stable / total&rdquo;: most concepts get a handful of stable members
        plus many boundary members. The clustering structure is real, but quantifying it requires
        the stability filter.
      </p>
    </div>
  ),
  researcher: (
    <div className="space-y-2">
      <p>
        For each input <em>u</em>, we compute <em>AIT(Anna, u)</em>, classify it to the nearest
        of Phase N&apos;s 19 concept centroids, and visualise on a 2D PCA basis computed from the
        19 centroids. Stability is judged by avalanche &lt; 4 bits under 4 single-bit perturbations
        (matches Phase N M3&apos;s &ldquo;stable basin&rdquo; criterion).
      </p>
      <p>
        Phase N showed: with 50,000 inputs, ~7.3 % are stable basin members; these stable inputs
        cluster into exactly 19 distinct centroids (8 antipodal pairs + 3 singletons). With our
        2,000-input subsample we replicate the structure but not the exact count.
      </p>
      <p>
        Important caveat: the 19 concepts were <em>discovered</em> by Phase N&apos;s scanner; here
        we <em>classify</em> against the known centroids. The genuine emergence claim is that the
        structure arises from Anna&apos;s AIT dynamics, not from her construction — which is
        empirically verifiable but is not what this lookup module demonstrates. See the &ldquo;Cluster
        Discovery&rdquo; module for the proper emergence demonstration.
      </p>
    </div>
  ),
  math: (
    <>
      <p>For each random input <InlineMath math="u_i \sim U(\{-1, +1\}^{64})" />:</p>
      <BlockMath math="o_i = \mathrm{AIT}(W, u_i) \in \{-1, 0, +1\}^{64}" />
      <p>Concept assignment via nearest centroid:</p>
      <BlockMath math="c_i = \arg\min_{k \in [0, 19)} d_H(o_i, \mathrm{centroid}_k)" />
      <p>Stability of input <InlineMath math="u_i" /> (average avalanche per single bit-flip):</p>
      <BlockMath math="\mathrm{stable}(u_i) \iff \mathbb{E}_{j}\!\left[ d_H(\mathrm{AIT}(W, u_i), \mathrm{AIT}(W, u_i \oplus e_j)) \right] < 4" />
      <p>Phase N empirical: Anna has ~7.3 % stable inputs across 50,000 samples (M3); 19 dominant clusters (N1).</p>
      <p>2D projection (real PCA via power iteration on 19 centroids):</p>
      <BlockMath math="\pi(o_i) = U_2^\top (o_i - \bar{c}), \quad U_2 = \text{top-2 eigenvectors of cov}(\{\mathrm{centroid}_k\}_{k=0}^{18})" />
    </>
  ),
}
