"""
CAN THE DECOMPOSITION EMERGE? Testing whether modular composition (ripple-carry) arises from
evolution ALONE, without us wiring it, when selection rewards correctness AND compactness.

Context (this session): monolithic evolution stalls; hand-composition works but is not emergent
(we supply the ripple wiring); CFB's own growth operator (insertNeuron) does not bridge mining
to threshold. The open question the user posed: is hand-composition "cheating" against CFB's
emergence rule, and can we instead make the decomposition EMERGE?

Established result we build on (Clune, Mouret, Lipson 2013, "The evolutionary origins of
modularity"): modularity does not appear under pure performance selection; it EMERGES when a
connection-cost / parsimony pressure is added. CFB's substrate has growth but no such pressure.
So the hypothesis, pre-registered:

  Evolving a boolean circuit for W-bit addition under (correctness, THEN minimal size+wiring)
  selection will (1) be more evolvable (reach error 0 on wider W where pure-correctness stalls)
  and (2) produce MODULAR circuits (lower connection cost, gates serving fewer outputs = a
  repeated per-bit adder block with a thin carry chain), WITHOUT us specifying any ripple
  structure. Pure-correctness selection (the control) will produce tangled, non-modular circuits
  that scale worse.

If both hold: composition can EMERGE under compression pressure -> actionable for CFB (add an
MDL/connection-cost term to Aigarth). If not: honest negative about the limit. We report
whatever happens, including a null result.

Substrate: Cartesian Genetic Programming (feed-forward boolean circuit), evaluated EXACTLY over
all 2^(2W) inputs, so "error 0" is exact. We use CGP rather than the tiny ternary ring because
the ring already stalls at W=2 and modularity is unreadable there; the PRINCIPLE (compression
pressure -> emergent modularity) transfers to CFB's substrate as a design recommendation.
"""
import numpy as np
import argparse
import time

# 2-input boolean gate functions over numpy bool arrays
def g_and(a, b):  return a & b
def g_or(a, b):   return a | b
def g_xor(a, b):  return a ^ b
def g_nand(a, b): return ~(a & b)
def g_nor(a, b):  return ~(a | b)
def g_xnor(a, b): return ~(a ^ b)
def g_nota(a, b): return ~a
def g_notb(a, b): return ~b

FUNCS = [g_and, g_or, g_xor, g_nand, g_nor, g_xnor, g_nota, g_notb]
NFUNC = len(FUNCS)
# which input(s) each func actually uses (for honest connection-cost accounting)
USES_B = [True, True, True, True, True, True, False, True]
USES_A = [True, True, True, True, True, True, True, False]


class CGP:
    def __init__(self, n_in, n_gates, n_out, rng):
        self.n_in = n_in
        self.n_gates = n_gates
        self.n_out = n_out
        self.total = n_in + n_gates
        self.func = rng.integers(0, NFUNC, size=n_gates)
        # each gate g (global index n_in+g) draws inputs from [0, n_in+g)
        self.inA = np.zeros(n_gates, dtype=np.int64)
        self.inB = np.zeros(n_gates, dtype=np.int64)
        for g in range(n_gates):
            hi = n_in + g
            self.inA[g] = rng.integers(0, hi)
            self.inB[g] = rng.integers(0, hi)
        self.out = rng.integers(0, self.total, size=n_out)

    def copy(self):
        c = CGP.__new__(CGP)
        c.n_in, c.n_gates, c.n_out, c.total = self.n_in, self.n_gates, self.n_out, self.total
        c.func = self.func.copy(); c.inA = self.inA.copy(); c.inB = self.inB.copy()
        c.out = self.out.copy()
        return c

    def mutate(self, rng, rate=0.03):
        """Point mutations on funcs, connections, outputs (standard CGP)."""
        for g in range(self.n_gates):
            hi = self.n_in + g
            if rng.random() < rate:
                self.func[g] = rng.integers(0, NFUNC)
            if rng.random() < rate:
                self.inA[g] = rng.integers(0, hi)
            if rng.random() < rate:
                self.inB[g] = rng.integers(0, hi)
        for o in range(self.n_out):
            if rng.random() < rate:
                self.out[o] = rng.integers(0, self.total)

    def evaluate(self, input_cols):
        """Return output bit arrays. input_cols: list of n_in bool arrays (all rows)."""
        vals = list(input_cols)
        for g in range(self.n_gates):
            a = vals[self.inA[g]]
            b = vals[self.inB[g]]
            vals.append(FUNCS[self.func[g]](a, b))
        return [vals[o] for o in self.out], vals

    def active_gates(self):
        """Indices (global) of gates in the cone of any output."""
        active = set()
        stack = [o for o in self.out if o >= self.n_in]
        # also outputs may point directly to inputs (no gate)
        while stack:
            idx = stack.pop()
            if idx in active or idx < self.n_in:
                continue
            active.add(idx)
            g = idx - self.n_in
            for inp in (self.inA[g], self.inB[g]):
                if inp >= self.n_in:
                    stack.append(inp)
        return active

    def cone_of(self, out_idx):
        """Active gate indices feeding a single output."""
        cone = set()
        stack = [out_idx] if out_idx >= self.n_in else []
        while stack:
            idx = stack.pop()
            if idx in cone or idx < self.n_in:
                continue
            cone.add(idx)
            g = idx - self.n_in
            for inp in (self.inA[g], self.inB[g]):
                if inp >= self.n_in:
                    stack.append(inp)
        return cone

    def connection_cost(self):
        """Sum of wire length (index distance) over active gates' used inputs."""
        active = self.active_gates()
        cost = 0
        for idx in active:
            g = idx - self.n_in
            if USES_A[self.func[g]]:
                cost += idx - self.inA[g]
            if USES_B[self.func[g]]:
                cost += idx - self.inB[g]
        return cost

    def modularity_metrics(self):
        """active gate count, connection cost, mean cone-membership (lower = more modular)."""
        active = self.active_gates()
        if not active:
            return 0, 0, 0.0
        cones = [self.cone_of(o) for o in self.out]
        membership = {idx: 0 for idx in active}
        for cone in cones:
            for idx in cone:
                if idx in membership:
                    membership[idx] += 1
        mean_member = float(np.mean(list(membership.values())))
        return len(active), self.connection_cost(), mean_member


def make_task(W):
    """All 2^(2W) inputs; inputs: a = bits[0..W-1], b = bits[W..2W-1]; outputs = W+1 sum bits."""
    n_in = 2 * W
    n_rows = 1 << n_in
    idx = np.arange(n_rows, dtype=np.int64)
    input_cols = []
    for k in range(n_in):
        input_cols.append(((idx >> k) & 1).astype(bool))
    a = np.zeros(n_rows, dtype=np.int64)
    b = np.zeros(n_rows, dtype=np.int64)
    for k in range(W):
        a |= (input_cols[k].astype(np.int64) << k)
        b |= (input_cols[W + k].astype(np.int64) << k)
    s = a + b
    targets = [((s >> k) & 1).astype(bool) for k in range(W + 1)]
    return n_in, input_cols, targets


def error_of(outs, targets):
    return int(sum(int(np.count_nonzero(o ^ t)) for o, t in zip(outs, targets)))


def evolve_correct(W, n_gates, generations, lam, rng, restarts):
    """Phase 1: pure correctness, (1+lambda) with neutral drift. Returns (circuit, err)."""
    n_in, input_cols, targets = make_task(W)
    n_out = W + 1
    best, best_err = None, None
    for r in range(restarts):
        parent = CGP(n_in, n_gates, n_out, rng)
        outs, _ = parent.evaluate(input_cols)
        p_err = error_of(outs, targets)
        for gen in range(generations):
            bc, bc_err = None, None
            for _ in range(lam):
                child = parent.copy(); child.mutate(rng)
                outs, _ = child.evaluate(input_cols)
                e = error_of(outs, targets)
                if bc is None or e < bc_err:
                    bc, bc_err = child, e
            if bc_err <= p_err:                 # neutral drift: favour child on ties
                parent, p_err = bc, bc_err
            if p_err == 0:
                break
        if best_err is None or p_err < best_err:
            best, best_err = parent, p_err
        if best_err == 0:
            break
    return best, best_err, input_cols, targets


def compress_circuit(net, input_cols, targets, generations, lam, rng):
    """Phase 2: keep error EXACTLY 0, minimise (connection cost, then active gates).

    This is the compression pressure applied AFTER correctness, so it never starves the search.
    If a repeated per-bit structure (ripple) emerges here, modularity arose from compression
    alone, not from us wiring it.
    """
    cur = net.copy()
    cur_g, cur_cost, _ = cur.modularity_metrics()
    for gen in range(generations):
        bc, bc_key = None, None
        for _ in range(lam):
            child = cur.copy(); child.mutate(rng)
            outs, _ = child.evaluate(input_cols)
            if error_of(outs, targets) != 0:
                continue                        # only error-preserving moves allowed
            g, cost, _ = child.modularity_metrics()
            key = (cost, g)                     # minimise wiring first, then gate count
            if bc is None or key < bc_key:
                bc, bc_key = child, key
        if bc is not None and bc_key <= (cur_cost, cur_g):   # neutral drift among equals
            cur, (cur_cost, cur_g) = bc, bc_key
    return cur


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--maxW", type=int, default=3)
    ap.add_argument("--gens", type=int, default=20000)
    ap.add_argument("--gates", type=int, default=60)
    ap.add_argument("--lam", type=int, default=4)
    ap.add_argument("--restarts", type=int, default=4)
    ap.add_argument("--seed", type=int, default=42)
    a = ap.parse_args()
    log = lambda s: print(s, flush=True)
    t0 = time.time()
    log("# EMERGENT MODULARITY: does ripple-carry decomposition EMERGE under compression pressure?")
    log(f"# CGP boolean circuit, exact over all inputs; gates={a.gates} gens={a.gens} "
        f"lambda={a.lam} restarts={a.restarts}")
    log("# protocol: phase 1 evolve to error 0 (RAW solution); phase 2 compress while keeping")
    log("#   error 0 (COMPRESSED solution). pre-registered: compression yields a SMALLER, more")
    log("#   LOCAL (lower connection cost) circuit, i.e. modular structure emerges without us")
    log("#   wiring it. Report whatever happens, including null.\n")

    for W in range(2, a.maxW + 1):
        log(f"## W = {W}  ({2*W} inputs, {W+1} outputs, {1<<(2*W)} rows)")
        rng = np.random.default_rng(a.seed + W)
        net, err, input_cols, targets = evolve_correct(W, a.gates, a.gens, a.lam, rng, a.restarts)
        total_bits = (W + 1) * (1 << (2 * W))
        if err != 0:
            log(f"#   phase 1 did NOT solve (err={err}/{total_bits}, {100*err/total_bits:.1f}%); "
                f"increase --gens/--gates. skipping compression.\n")
            continue
        g0, cost0, mem0 = net.modularity_metrics()
        comp = compress_circuit(net, input_cols, targets, a.gens, a.lam, rng)
        # verify still exactly correct
        outs, _ = comp.evaluate(input_cols)
        assert error_of(outs, targets) == 0, "compression broke correctness!"
        g1, cost1, mem1 = comp.modularity_metrics()
        log(f"#   RAW solution        : active_gates={g0:3d} conn_cost={cost0:4d} "
            f"mean_cone_membership={mem0:.2f}")
        log(f"#   COMPRESSED solution : active_gates={g1:3d} conn_cost={cost1:4d} "
            f"mean_cone_membership={mem1:.2f}")
        log(f"#   -> gates x{g0/max(1,g1):.2f}, wiring x{cost0/max(1,cost1):.2f}, "
            f"locality {'IMPROVED' if cost1 < cost0 else 'unchanged'}\n")
    log(f"# done [{time.time()-t0:.0f}s]")


if __name__ == "__main__":
    main()
