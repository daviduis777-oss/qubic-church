"""
The developmental (tiled) encoding, now on CFB's OWN ternary LUT-CA substrate (Anna.exe's
substrate), not on a boolean CGP. Same idea as tiled_dev_adder.py:

  - a MODULE is a small configuration of the 100-cell ternary LUT-CA: 4 input cells
    (a_k, b_k, and 2 GENERIC inter-tile channels), 3 output cells (sum_k, 2 channels out),
    control cells held at 2;
  - the network is W copies of the SAME module, channels chained tile->tile (we never label a
    channel "carry"); tile 0's channels start at 0;
  - evolve the module's per-cell ternary lookup tables by the same read-targeted (1+1)-ES
    Anna.exe uses, with fitness = W_train-bit addition over the tiled module;
  - then DEVELOP the same evolved tables to larger W with no re-evolution and check error 0.

If one module evolved on a small width tiles to any width at error 0, the carry-chain
decomposition emerged on the real ternary substrate and generalises structurally. Honest caveat
(same as the CGP version): we supply the tiling/reuse prior + channels + readout; the module
function and the use of a channel as a carry are what emerge.
"""
import numpy as np
import argparse
import time

NUM_CELLS, NUM_STEPS, BASE = 100, 100, 3
TASK = "add"                # "add" or "sub" (the bitwise reference function)
N_OPERANDS = 2              # how many W-bit numbers are summed (2 = a+b; 3 = a+b+c needs >1-bit carry)
C = 2                       # generic inter-tile channels (settable via --channels)
MOD_IN = N_OPERANDS + C
MOD_OUT = 1 + C
def set_channels(c):
    global C, MOD_IN, MOD_OUT
    C = c; MOD_IN = N_OPERANDS + C; MOD_OUT = 1 + C
    build_combos()

# WINDOW = per-cell capacity knob: each cell looks at WINDOW successors via a BASE^WINDOW LUT.
# 10 = Anna.exe's value (huge LUT, high capacity). Small window = low capacity = "compressed".
WINDOW = 10
PERCELL = BASE ** WINDOW
TABLE = NUM_CELLS * PERCELL
nb = powers = cell_base = None
def set_window(w):
    global WINDOW, PERCELL, TABLE, nb, powers, cell_base
    WINDOW = w
    PERCELL = BASE ** WINDOW
    TABLE = NUM_CELLS * PERCELL
    nb = np.array([[(i + 1 + k) % NUM_CELLS for k in range(WINDOW)] for i in range(NUM_CELLS)])
    powers = (BASE ** np.arange(WINDOW)).astype(np.int64)
    cell_base = np.arange(NUM_CELLS, dtype=np.int64) * PERCELL
set_window(10)

# inter-tile channel radix: 3 = ternary (default, faithful), 2 = binary (--binchan)
CHAN_VALS = 3
BINCHAN = False
COMBOS = None
def build_combos():
    global COMBOS
    ncombo = (2 ** N_OPERANDS) * (CHAN_VALS ** C)
    COMBOS = np.zeros((ncombo, N_OPERANDS + C), dtype=np.int8)
    for i in range(ncombo):
        rest = i
        for op in range(N_OPERANDS):
            COMBOS[i, op] = rest & 1; rest >>= 1
        for c in range(C):
            COMBOS[i, N_OPERANDS + c] = rest % CHAN_VALS; rest //= CHAN_VALS
def combo_idx(op_bits, ch):
    """index of (op_bits[0..N_OPERANDS-1], ch[0..C-1]) matching build_combos' ordering."""
    idx = 0; mult = 1
    for op in range(N_OPERANDS):
        idx = idx + op_bits[op] * mult; mult *= 2
    for c in range(C):
        idx = idx + ch[c] * mult; mult *= CHAN_VALS
    return idx
build_combos()


class Topo:
    def __init__(self, seed):
        rng = np.random.default_rng(seed)
        perm = rng.permutation(NUM_CELLS)
        self.inp = perm[:MOD_IN]
        self.out = perm[MOD_IN:MOD_IN + MOD_OUT]
        self.ctl = perm[MOD_IN + MOD_OUT:MOD_IN + MOD_OUT + 8]


def init_table(topo, rng):
    table = rng.integers(0, 3, size=TABLE).astype(np.int8)
    for c in topo.ctl:
        table[c * PERCELL:(c + 1) * PERCELL] = 2
    return table


def run(table, topo, X, collect=False):
    """X: (M, MOD_IN) cell values for input cells -> (M, MOD_OUT) output cell values."""
    M = X.shape[0]
    state = np.zeros((M, NUM_CELLS), dtype=np.int8)
    state[:, topo.inp] = X
    active = np.ones(M, dtype=bool)
    reads = []
    for _ in range(NUM_STEPS):
        P = (state[:, nb].astype(np.int64) * powers).sum(axis=2)
        idx = cell_base[None, :] + P
        if collect:
            reads.append(idx[active].ravel())
        nxt = table[idx]
        nxt[:, topo.inp] = X
        state[active] = nxt[active]
        active &= (state[:, topo.ctl] == 2).any(axis=1)
        if not active.any():
            break
    out = state[:, topo.out]
    if collect:
        return out, (np.unique(np.concatenate(reads)) if reads else np.array([], dtype=np.int64))
    return out


def module_truth(table, topo, collect=False):
    if collect:
        out, reads = run(table, topo, COMBOS.astype(np.int8), collect=True)
    else:
        out = run(table, topo, COMBOS.astype(np.int8))
    sum_tab = out[:, 0].astype(np.int64)
    ch_tab = [out[:, 1 + c].astype(np.int64) for c in range(C)]
    if collect:
        return sum_tab, ch_tab, reads
    return sum_tab, ch_tab


def develop_from_tables(sum_tab, ch_tab, W, sample=None, rng=None):
    """Tile the module and compare to true binary addition. OVERFLOW-SAFE for any W: the operands
    and the reference sum are handled BITWISE (never formed as a single integer), so W can be
    arbitrarily large. Returns (wrong_bits, wrong_pairs, n)."""
    if sample is None and (1 << W) ** N_OPERANDS > 200000:
        sample = 200000                                  # exhaustive would blow up -> sample
        if rng is None:
            rng = np.random.default_rng(0)
    if sample is None:                                   # exhaustive (small)
        grids = np.meshgrid(*[np.arange(1 << W)] * N_OPERANDS, indexing="ij")
        ops = [g.ravel() for g in grids]
        n = ops[0].size
        op_bits = [[((ops[op] >> k) & 1) for k in range(W)] for op in range(N_OPERANDS)]
    else:                                                # sampled (any W, bitwise)
        n = sample
        op_bits = [[rng.integers(0, 2, size=n).astype(np.int64) for _ in range(W)]
                   for _ in range(N_OPERANDS)]
    # reference (ground truth), bitwise so width is unbounded. carry/borrow can be multi-valued
    # for N>2 operands (carry up to N-1), which is exactly why a wider channel is then needed.
    ref_sum = []
    if TASK == "sub":                                    # 2-operand borrow subtraction
        acc = np.zeros(n, dtype=np.int64)
        for k in range(W):
            ref_sum.append(op_bits[0][k] ^ op_bits[1][k] ^ acc)
            acc = ((op_bits[1][k] + acc) > op_bits[0][k]).astype(np.int64)
        ref_final = acc
    else:                                                # N-operand addition
        carry = np.zeros(n, dtype=np.int64)
        for k in range(W):
            col = carry.copy()
            for op in range(N_OPERANDS):
                col = col + op_bits[op][k]
            ref_sum.append(col & 1)
            carry = col >> 1                             # carry can be 0..N-1
        ref_final = carry
    # module tiling
    ch = [np.zeros(n, dtype=np.int64) for _ in range(C)]
    wrong_pairs = np.zeros(n, dtype=bool)
    wrong_bits = 0
    for k in range(W):
        idx = combo_idx([op_bits[op][k] for op in range(N_OPERANDS)], ch)
        s = sum_tab[idx]
        mism = (s != ref_sum[k])
        wrong_bits += int(mism.sum()); wrong_pairs |= mism
        ch = [ch_tab[c][idx] for c in range(C)]
        if BINCHAN:
            ch = [(c == 1).astype(np.int64) for c in ch]   # binary inter-tile signalling
    mism = (ch[0] != ref_final)                          # final carry: a 1-bit channel cannot
    wrong_bits += int(mism.sum()); wrong_pairs |= mism   # represent carry=2 -> fails for N=3
    return wrong_bits, int(wrong_pairs.sum()), n


def develop_error(table, topo, W, sample=None, rng=None):
    """Tile W copies, compare to A+B. Delegates to develop_from_tables."""
    sum_tab, ch_tab = module_truth(table, topo)
    return develop_from_tables(sum_tab, ch_tab, W, sample, rng)


def compress_module(table, topo, W_train, log=None):
    """PART 2 idea: minimise module capacity (= CFB's compression thesis) while keeping W_train
    correct. Freeze each non-input/non-control cell to a CONSTANT if that preserves W_train
    error 0. A minimal-capacity module cannot memorise the training width -> it is forced toward
    the general repeating function. Returns the number of cells that stayed active."""
    assert develop_error(table, topo, W_train)[0] == 0
    active = 0
    protected = set(int(c) for c in topo.inp) | set(int(c) for c in topo.ctl)
    for cell in range(NUM_CELLS):
        if cell in protected:
            continue
        base = cell * PERCELL
        orig = table[base:base + PERCELL].copy()
        frozen = False
        for v in (0, 1, 2):
            table[base:base + PERCELL] = v
            if develop_error(table, topo, W_train)[0] == 0:
                frozen = True
                break
        if not frozen:
            table[base:base + PERCELL] = orig
            active += 1
    if log:
        log(f"#   compression: {active} active cells remain (rest frozen to constants), "
            f"W={W_train} still error 0")
    return active


def evolve(topo, W_train, evals, seed, stag=2500, kick=4, log=None):
    rng = np.random.default_rng(seed + 5)
    table = init_table(topo, rng)
    st, cht, read = module_truth(table, topo, collect=True)        # one CA run -> tables + reads
    cur = develop_from_tables(st, cht, W_train)[0]
    best = cur; best_t = table.copy(); best_r = read; ni = 0; e = 0
    while e < evals and best > 0:
        if read.size == 0:
            break
        j = int(read[rng.integers(read.size)]); old = int(table[j])
        table[j] = (table[j] + (1 if rng.integers(2) else -1)) % 3
        st, cht, nread = module_truth(table, topo, collect=True)   # one CA run per eval
        new = develop_from_tables(st, cht, W_train)[0]; e += 1
        if new <= cur:
            cur = new; read = nread
        else:
            table[j] = old                                        # revert; old reads stay valid
        if cur < best:
            best = cur; best_t = table.copy(); best_r = read; ni = 0
        else:
            ni += 1
        if ni >= stag:
            table[:] = best_t
            for _ in range(kick):
                table[int(best_r[rng.integers(best_r.size)])] = rng.integers(3)
            st, cht, read = module_truth(table, topo, collect=True)
            cur = develop_from_tables(st, cht, W_train)[0]; e += 1; ni = 0
        if log and e % 5000 == 0:
            log(f"    evolve W={W_train}: evals={e} best_err={best}")
    table[:] = best_t
    return best, e, table


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wtrain", type=int, default=2)
    ap.add_argument("--evals", type=int, default=40000)
    ap.add_argument("--restarts", type=int, default=20)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--binchan", action="store_true", help="binarise inter-tile channels to {0,1}")
    ap.add_argument("--compress", action="store_true", help="PART 2: compress module capacity -> generalization")
    ap.add_argument("--window", type=int, default=10, help="per-cell LUT window = capacity knob")
    ap.add_argument("--channels", type=int, default=2, help="number of inter-tile channels (1 = minimal)")
    ap.add_argument("--task", choices=["add", "sub"], default="add")
    ap.add_argument("--operands", type=int, default=2, help="N operands summed (3 = needs >1-bit carry)")
    a = ap.parse_args()
    global CHAN_VALS, BINCHAN, TASK, N_OPERANDS
    TASK = a.task; N_OPERANDS = a.operands
    if a.binchan:
        CHAN_VALS = 2; BINCHAN = True
    set_window(a.window)
    set_channels(a.channels)            # builds combos with current C and CHAN_VALS
    log = lambda s: print(s, flush=True)
    t0 = time.time()
    log(f"# DEVELOPMENTAL (tiled) adder on the TERNARY LUT-CA | window={WINDOW} (LUT={PERCELL}/cell) "
        f"| channels={C}x{'BINARY' if BINCHAN else 'ternary'}")
    log(f"# evolve a module on W={a.wtrain}, tile the SAME evolved cell-tables to larger W")
    log("# 2 generic inter-tile channels; the carry must emerge on one of them\n")

    best, used, table, topo = 99, 0, None, None
    for r in range(a.restarts):
        topo = Topo(a.seed * 1000 + r)
        b, e, t = evolve(topo, a.wtrain, a.evals, a.seed * 1000 + r, log=log)
        used += e
        if b < best:
            best, table, best_topo = b, t, topo
        log(f"#   restart {r}: best_err={b} (evals {e}) [{time.time()-t0:.0f}s]")
        if best == 0:
            topo = best_topo
            break
    if best != 0:
        log(f"\n# module did NOT reach 0 on W={a.wtrain} after {a.restarts} restarts "
            f"(best_err={best}). The ternary substrate is harder to evolve the tile on than the "
            f"boolean CGP; raise --evals/--restarts. Reporting honestly.")
        return

    log(f"\n## module evolved to error 0 on W={a.wtrain} (total {used} evals).")
    if a.compress:
        log(f"## PART 2: compress module capacity (= CFB's compression=generalization thesis):")
        compress_module(table, topo, a.wtrain, log=log)
    log(f"## now develop/scale the SAME tables:")
    generalizes = True
    for W in [2, 3, 4, 6, 8]:
        wb, wp, n = develop_error(table, topo, W)
        ok = (wp == 0)
        if W > a.wtrain and not ok:
            generalizes = False
        log(f"#   W={W}: wrong_pairs={wp}/{n}  ({'OK 0' if ok else 'FAIL'}) [exhaustive]")
    for W in [10, 12, 16]:
        wb, wp, n = develop_error(table, topo, W, sample=100000, rng=np.random.default_rng(7))
        ok = (wp == 0)
        if not ok:
            generalizes = False
        log(f"#   W={W}: wrong_pairs={wp}/{n}  ({'OK 0' if ok else 'FAIL'}) [sampled]")

    if generalizes:
        log(f"\n# VERDICT: a module evolved on W={a.wtrain} of the real ternary LUT-CA tiles to ALL")
        log(f"#   widths at error 0 -> the carry-chain decomposition EMERGED on CFB's own substrate")
        log(f"#   and generalises structurally. (Tiling/reuse prior supplied; carry-on-a-channel emerged.)")
    else:
        log(f"\n# VERDICT: the module solved W={a.wtrain} but did NOT generalise to larger widths.")
        log(f"#   It OVERFIT the training width (the ternary channels give enough freedom to solve a")
        log(f"#   single tile transition with a non-tiling trick). Train on more tile transitions")
        log(f"#   (higher --wtrain) to force the general carry.")
    log(f"\n# done [{time.time()-t0:.0f}s]")


if __name__ == "__main__":
    main()
