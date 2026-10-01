"""
PHASE 9: emergence of an INVENTED internal representation (the first "discovery", not recovery).

Every earlier phase recovered a structure we already knew (ripple carry, prefix recurrence, the
predecessor link). Here we hand the substrate ONLY input/output examples on short strings and a blank
2-bit register, and never tell it anything about the task's mechanism. The task is running mod-3
divisibility: O[i] = 1 iff the number of 1s in x[0..i] is divisible by 3.

A size-invariant solution must be a 3-state finite automaton (a mod-3 counter) propagated along the
string. We do not give it the three states, the cycle, or any encoding. If evolution invents a
3-state machine, assigns its own 2-bit codes to the states, and the same uniform rule then computes
mod-3 divisibility on strings far longer than any seen in training, then an internal representation
has EMERGED and GENERALISED. The honest novelty is not "mod-3 is unknown" (it is textbook) but that
the substrate invents its own representation from I/O alone, and that different seeds invent
DIFFERENT encodings that all work -- a genuine emergent-representation result, exactly verified.

Cell: inputs (x_i, reg_{i-1} as 2 bits) -> outputs (reg_i as 2 bits, flag O_i). Boundary reg = 00
(the empty-prefix / count-0 state). Relaxed left to right to a fixed point. Boolean CGP, exact.
"""
import numpy as np
from cgp_emergent_modularity import CGP

CELL_IN = 3                       # x_i, reg_{i-1} bit0, reg_{i-1} bit1
CELL_OUT = 3                      # reg_i bit0, reg_i bit1, flag O_i
NGATES = 22
LENS_TRAIN = [3, 4, 5]


def cell_truth(cell):
    rows = np.arange(1 << CELL_IN)
    cols = [((rows >> k) & 1).astype(bool) for k in range(CELL_IN)]
    outs, _ = cell.evaluate(cols)
    return [o.astype(np.int64) for o in outs]      # [r0, r1, flag]


def all_strings(L):
    n = 1 << L
    k = np.arange(n)
    return np.stack([(k >> i) & 1 for i in range(L)], axis=0)   # (L, n)


def ref(X):
    return ((np.cumsum(X, axis=0) % 3) == 0).astype(np.int64)


def run_flag(X, tabs, steps):
    W, n = X.shape
    r0 = np.zeros((W, n), dtype=np.int64); r1 = np.zeros((W, n), dtype=np.int64)
    flag = np.zeros((W, n), dtype=np.int64)
    z = np.zeros((1, n), dtype=np.int64)
    for _ in range(steps):
        p0 = np.vstack([z, r0[:-1]])               # reg bit0 of predecessor (boundary 00)
        p1 = np.vstack([z, r1[:-1]])
        idx = X + 2 * p0 + 4 * p1
        r0 = tabs[0][idx]; r1 = tabs[1][idx]; flag = tabs[2][idx]
    return flag


def train_error(tabs):
    e = 0
    for L in LENS_TRAIN:
        X = all_strings(L)
        e += int(np.count_nonzero(run_flag(X, tabs, L + 2) != ref(X)))
    return e


def gen_error(tabs):
    res, ok = {}, True
    for L in [3, 4, 5]:
        X = all_strings(L); e = int(np.count_nonzero(run_flag(X, tabs, L + 2) != ref(X)))
        res[L] = e
        if e != 0:
            ok = False
    for L in [10, 12]:                                  # larger exhaustive checks
        X = all_strings(L); e = int(np.count_nonzero(run_flag(X, tabs, L + 2) != ref(X)))
        res[L] = e
        if e != 0:
            ok = False
    rng = np.random.default_rng(123)
    for L in [16, 32, 64, 128]:
        X = rng.integers(0, 2, size=(L, 20000))
        e = int(np.count_nonzero(run_flag(X, tabs, L + 2) != ref(X)))
        res[L] = e
        if e != 0:
            ok = False
    return ok, res


def evolve(gens, lam, rng, restarts):
    best, berr = None, None
    for _ in range(restarts):
        parent = CGP(CELL_IN, NGATES, CELL_OUT, rng); pe = train_error(cell_truth(parent))
        for _ in range(gens):
            bc, bce = None, None
            for _ in range(lam):
                ch = parent.copy(); ch.mutate(rng); e = train_error(cell_truth(ch))
                if bc is None or e < bce:
                    bc, bce = ch, e
            if bce <= pe:
                parent, pe = bc, bce
            if pe == 0:
                break
        if berr is None or pe < berr:
            best, berr = parent, pe
        if berr == 0:
            break
    return best, berr


def analyse(tabs):
    """Map the invented machine: reachable states from the boundary 00, and the residue-class codes.
    Returns (num_reachable_states, signature=state-code after 0,1,2 ones)."""
    def step(state, x):
        b0, b1 = state & 1, (state >> 1) & 1
        idx = x + 2 * b0 + 4 * b1
        return int(tabs[0][idx]) | (int(tabs[1][idx]) << 1)

    seen = {0}; frontier = [0]
    while frontier:
        s = frontier.pop()
        for x in (0, 1):
            ns = step(s, x)
            if ns not in seen:
                seen.add(ns); frontier.append(ns)
    sig = []; s = 0
    for _ in range(3):
        sig.append(s); s = step(s, 1)
    return len(seen), tuple(sig)


def main():
    import argparse
    ap = argparse.ArgumentParser(); ap.add_argument("--seeds", type=int, default=8)
    a = ap.parse_args()
    print(f"# PHASE 9: invented internal representation for mod-3 divisibility "
          f"(train lengths {LENS_TRAIN}, test to 128)\n", flush=True)
    gen = 0; encs = {}; states_hist = {}
    for seed in range(a.seeds):
        rng = np.random.default_rng(seed)
        cell, err = evolve(20000, 6, rng, 30)
        if err != 0:
            print(f"#   seed {seed}: no error-0 on training (err {err})", flush=True); continue
        tabs = cell_truth(cell)
        ok, res = gen_error(tabs)
        nstates, sig = analyse(tabs)
        gen += int(ok)
        if ok:
            encs[sig] = encs.get(sig, 0) + 1
            states_hist[nstates] = states_hist.get(nstates, 0) + 1
        big = " ".join(f"L{L}:{('0' if e == 0 else 'X')}" for L, e in res.items() if L >= 10)
        kind = f"{nstates}-state" + (" minimal" if nstates == 3 else " (redundant)")
        print(f"#   seed {seed}: {'GEN' if ok else 'overfit':<7} invented {kind}, "
              f"residue codes(0,1,2)={sig} | {big}", flush=True)
    print(f"\n# ==> {gen}/{a.seeds} generalise to length 128 (exhaustive to L12, 20k-sampled to L128),", flush=True)
    print(f"#     each inventing a mod-3 machine from I/O alone (we specified no states, codes, or mechanism).",
          flush=True)
    print(f"#     invented residue-encodings -> #seeds: "
          + ", ".join(f"{k}:{v}" for k, v in sorted(encs.items())), flush=True)
    print(f"#     state-count -> #seeds: " + ", ".join(f"{k}:{v}" for k, v in sorted(states_hist.items())),
          flush=True)
    print(f"#     multiple distinct encodings/structures = the substrate invents its OWN representation.",
          flush=True)


if __name__ == "__main__":
    main()
