#!/usr/bin/env python3
"""
Verify: Anna Matrix spectral and energy level properties.

This script verifies:
1. Spectral radius of A: ~2342
2. Exactly 8 energy levels: when random inputs are iterated through
   x = sign(A*x), the system settles into exactly 8 energy values:
   +/-56, +/-50, +/-42, +/-38 — perfectly symmetric around zero.

Usage:
    python verify_spectral.py

Requirements:
    pip install numpy

Expected output:
    Spectral radius ~2342.
    Exactly 8 attractor energy levels, symmetric around zero.
"""

import json
import urllib.request
import numpy as np
import time
import warnings
from collections import Counter

MATRIX_URL = "https://qubic.church/data/anna-matrix-min.json"
N_SAMPLES = 10_000
MAX_TICKS = 50
SEED = 42

def load_matrix():
    """Load the Anna Matrix from the public URL or local file."""
    print(f"Loading Anna Matrix from {MATRIX_URL} ...")
    try:
        with urllib.request.urlopen(MATRIX_URL) as resp:
            data = json.loads(resp.read())
    except Exception:
        print("Could not fetch from URL. Trying local file anna-matrix-min.json ...")
        with open("anna-matrix-min.json") as f:
            data = json.load(f)

    flat = data["matrix"]
    return np.array(flat, dtype=np.float64).reshape(128, 128)

def sign_int(x):
    """Ternary sign for integer arrays."""
    result = np.zeros_like(x, dtype=np.int8)
    result[x > 0] = 1
    result[x < 0] = -1
    return result

def main():
    A_float = load_matrix()

    # --- Part 1: Spectral Radius ---
    print("\nComputing eigenvalues ...")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        eigenvalues = np.linalg.eigvals(A_float)
    spectral_radius = np.max(np.abs(eigenvalues))

    real_mask = np.abs(eigenvalues.imag) < 1e-6
    n_real = np.sum(real_mask)
    n_complex_pairs = (128 - n_real) // 2

    print(f"\n{'=' * 60}")
    print("SPECTRAL ANALYSIS")
    print(f"{'=' * 60}")
    print(f"  Spectral radius:    {spectral_radius:.3f}")
    print(f"  2342 mod 676 =      {2342 % 676}")
    print(f"  Real eigenvalues:   {n_real}")
    print(f"  Complex pairs:      {n_complex_pairs}")

    # --- Part 2: Energy Levels (integer arithmetic) ---
    # Use int32 to avoid float overflow
    A = A_float.astype(np.int32)

    print(f"\n{'=' * 60}")
    print("ENERGY LEVEL ANALYSIS")
    print(f"{'=' * 60}")
    print(f"\nIterating {N_SAMPLES:,} random +/-1 inputs through x=sign(A*x)")
    print(f"until convergence or period-2 cycle (max {MAX_TICKS} ticks) ...")

    rng = np.random.RandomState(SEED)
    energy_counter = Counter()
    behavior_counter = Counter()

    t0 = time.time()
    for i in range(N_SAMPLES):
        x = rng.choice([-1, 1], size=128).astype(np.int32)
        state = x.copy()
        prev = None
        behavior = "timeout"
        found_energies = set()

        for t in range(MAX_TICKS):
            product = A @ state
            new_state = sign_int(product)

            # Fixed point?
            if np.array_equal(new_state, state):
                found_energies.add(int(np.sum(state)))
                behavior = "fixed"
                break

            # Period-2?
            if prev is not None and np.array_equal(new_state, prev):
                found_energies.add(int(np.sum(state)))
                found_energies.add(int(np.sum(new_state)))
                behavior = "period-2"
                break

            prev = state.copy()
            state = new_state

        if behavior == "timeout":
            # Collect last two states
            found_energies.add(int(np.sum(state)))
            product = A @ state
            final = sign_int(product)
            found_energies.add(int(np.sum(final)))

        for e in found_energies:
            energy_counter[e] += 1
        behavior_counter[behavior] += 1

    elapsed = time.time() - t0

    unique_energies = sorted(energy_counter.keys())
    n_levels = len(unique_energies)

    print(f"\n  Computation: {elapsed:.1f}s ({N_SAMPLES/elapsed:,.0f} inputs/sec)")
    print(f"  Behaviors: {dict(behavior_counter)}")
    print(f"  Distinct energy levels: {n_levels}")
    print(f"\n  {'Energy':>8} {'Count':>8}")
    print(f"  {'-'*18}")
    for e in unique_energies:
        print(f"  {e:>+8d} {energy_counter[e]:>8,}")

    # Check symmetry
    pos_levels = sorted([e for e in unique_energies if e > 0])
    neg_levels = sorted([-e for e in unique_energies if e < 0])
    symmetric = pos_levels == neg_levels

    # Expected levels
    expected = {-56, -50, -42, -38, 38, 42, 50, 56}
    matches_expected = set(unique_energies) == expected

    print(f"\n  Symmetric around zero: {symmetric}")
    print(f"  Matches expected {{+/-56, +/-50, +/-42, +/-38}}: {matches_expected}")

    # --- Summary ---
    print(f"\n{'=' * 60}")
    sr_pass = abs(spectral_radius - 2342) < 1
    el_pass = n_levels == 8 and symmetric and matches_expected

    if sr_pass and el_pass:
        print("RESULT: PASS")
        print(f"  - Spectral radius = {spectral_radius:.3f} (~2342)")
        print(f"  - Exactly 8 symmetric energy levels: {unique_energies}")
    elif sr_pass:
        print(f"RESULT: PARTIAL — spectral radius OK, {n_levels} energy levels")
        print(f"  Levels found: {unique_energies}")
    else:
        print(f"RESULT: CHECK — spectral radius {spectral_radius:.3f}, {n_levels} levels")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
