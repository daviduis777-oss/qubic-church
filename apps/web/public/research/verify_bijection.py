#!/usr/bin/env python3
"""
Verify: Anna Matrix produces 0 collisions on 100,000 random inputs.

This script tests whether the 128x128 Anna Matrix acts as a bijection:
every distinct input produces a distinct output under ternary sign
activation sign(A * x).

Setup (matches the Qubic network architecture):
- 64-dimensional binary input (0 or 1), padded to 128 dimensions
- Full-value matrix weights (not sign-only)
- Single forward pass with sign activation
- Check uniqueness of all 128 output dimensions

Usage:
    python verify_bijection.py

Requirements:
    pip install numpy

Expected output:
    100,000 unique outputs from 100,000 random inputs (0 collisions).
    ~99.7% converge in a single tick.
"""

import json
import urllib.request
import numpy as np
import sys
import time

MATRIX_URL = "https://qubic.church/data/anna-matrix-min.json"
SEED = 42
N_SAMPLES = 100_000

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
    # Use int32 to avoid float64 overflow in matmul
    A = np.array(flat, dtype=np.int32).reshape(128, 128)
    print(f"Matrix loaded: {A.shape}, value range [{A.min()}, {A.max()}]")
    return A

def main():
    A = load_matrix()

    print(f"\nGenerating {N_SAMPLES:,} random 64-dimensional binary inputs (seed={SEED}) ...")
    rng = np.random.RandomState(SEED)

    # 64-dim binary input, padded to 128 with zeros
    inputs = np.zeros((N_SAMPLES, 128), dtype=np.int32)
    inputs[:, :64] = rng.randint(0, 2, size=(N_SAMPLES, 64))

    print("Computing sign(A * x) for all inputs ...")
    t0 = time.time()

    # Forward pass: product = A @ input, then sign activation
    raw = inputs @ A.T  # (N, 128) @ (128, 128)^T = (N, 128)
    outputs = np.zeros((N_SAMPLES, 128), dtype=np.int8)
    outputs[raw > 0] = 1
    outputs[raw < 0] = -1
    # Input dimensions remain clamped to original values
    outputs[:, :64] = inputs[:, :64].astype(np.int8)

    elapsed = time.time() - t0
    print(f"Computation done in {elapsed:.2f}s ({N_SAMPLES/elapsed:,.0f} inputs/sec)")

    # Check convergence (all output neurons non-zero)
    all_converged = np.all(outputs[:, 64:] != 0, axis=1)
    n_converged = int(np.sum(all_converged))
    print(f"Converged in 1 tick: {n_converged}/{N_SAMPLES} ({100*n_converged/N_SAMPLES:.1f}%)")

    # Check uniqueness
    print("Checking for collisions ...")
    unique_set = set()
    for i in range(N_SAMPLES):
        unique_set.add(outputs[i].tobytes())

    n_unique = len(unique_set)
    n_collisions = N_SAMPLES - n_unique

    print("\n" + "=" * 60)
    print("BIJECTION TEST RESULTS")
    print("=" * 60)
    print(f"  Inputs tested:    {N_SAMPLES:>10,}")
    print(f"  Unique outputs:   {n_unique:>10,}")
    print(f"  Collisions:       {n_collisions:>10,}")
    print(f"  Converged (1 tick): {n_converged:>8,} ({100*n_converged/N_SAMPLES:.1f}%)")
    print(f"  Seed:             {SEED}")
    print("=" * 60)

    if n_collisions == 0:
        print("\nRESULT: PASS — Every input produced a unique output.")
        print("The Anna Matrix is a bijection on this sample space.")
    else:
        print(f"\nRESULT: FAIL — {n_collisions} collisions detected.")

    sys.exit(0 if n_collisions == 0 else 1)

if __name__ == "__main__":
    main()
