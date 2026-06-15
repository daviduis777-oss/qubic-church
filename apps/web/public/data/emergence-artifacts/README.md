# Emergence — verify it yourself

Self-contained Python reproductions of two headline results from the Anna.exe / emergent-generalization
study (`audit/2026-06-10-anna-exe/`). Each runs a gradient-free (1+1) evolutionary search on an
exactly-verifiable substrate and checks the result by exhaustive / large-sample exact match far
beyond the training size. Deterministic (seeded), so you get the same numbers we do.

## Easiest — no install, runs in seconds

Two foolproof, zero-dependency verifiers (no numpy, no internet, work on any computer):

- **`verify_emergence.html`** — double-click it; it runs the whole "train on 16 tiny sums → correct on huge numbers" proof in your browser. Nothing to install.
- **`verify_emergence.py`** — `python3 verify_emergence.py` (standard Python 3 only, ~2 seconds).

Both print: trained on the 16 smallest sums → correct on every number tested, 0 wrong, up to 256-bit. That is the headline result — it found the method, not the answers.

## Setup (for the heavier full-study scripts below)

```
pip install -r requirements.txt   # numpy only
```

## Run

**Phase 1 — a length-generalizing adder emerges (train on 2-bit only, generalize to width 128):**

```
python3 synthesis_proof.py
```
Expected: `6/6 seeds length-generalise (W=2 train -> exact to W=128); 6/6 emerged modules are exact full adders.`
(needs `tiled_dev_ternary.py` in the same folder — included.) Runtime ~3-5 min.

**Phase 9 — an internal representation is invented (mod-3 divisibility, a 3-state machine):**

```
python3 modcount_emergence.py
```
Expected: `GENERALISES` — each seed invents its own mod-3 counter (mostly the minimal 3-state machine, some a redundant 4-state one) and is exact on 80,000 random strings
at lengths 16/32/64/128. (needs `cgp_emergent_modularity.py` in the same folder — included.) Runtime ~1-2 min.

## What this is / is not

This demonstrates emergent *generalizing computation* on a tiny, exactly-checkable substrate. It is
not "AI found" and not consciousness. The novelty is methodological (exactly-decidable verification +
controls + pre-registration); every phenomenon has a named predecessor. See
`/docs/03-results/33-emergent-generalization` for the full study and prior art.
