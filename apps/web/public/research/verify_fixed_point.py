#!/usr/bin/env python3
"""
Verify: Iterated sign matrix converges, all column sums = 42.

This script iterates the sign function on the Anna Matrix:
    F = sign(A)
    F = sign(F @ F)   (repeat until stable)

After 6 iterations, F converges to a fixed point where every single
column sums to exactly 42. Not on average. EXACTLY.

Usage:
    python verify_fixed_point.py

Requirements:
    pip install numpy

Expected output:
    Convergence at iteration 6.
    All 128 column sums = 42.
"""

import json
import urllib.request
import numpy as np
import warnings

MATRIX_URL = "https://qubic.church/data/anna-matrix-min.json"

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
    A = np.array(flat, dtype=np.float64).reshape(128, 128)
    return A

def main():
    A = load_matrix()

    print("Iterating sign function ...")
    # Use int16 to avoid float overflow in matmul
    F = np.sign(A).astype(np.int16)

    converged_at = None
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        for i in range(1, 20):
            product = F.astype(np.int32) @ F.astype(np.int32)
            F_next = np.sign(product).astype(np.int16)
            diff = np.sum(F_next != F)
            print(f"  Iteration {i}: {diff} elements changed")
            if diff == 0:
                converged_at = i
                print(f"  Converged at iteration {i}!")
                break
            F = F_next

    # Analyze the fixed point
    col_sums = F.astype(np.int32).sum(axis=0)
    row_sums = F.astype(np.int32).sum(axis=1)
    unique_col_sums, col_counts = np.unique(col_sums, return_counts=True)
    unique_row_sums, row_counts = np.unique(row_sums, return_counts=True)

    # Count value types
    n_pos = np.sum(F == 1)
    n_neg = np.sum(F == -1)
    n_zero = np.sum(F == 0)

    print("\n" + "=" * 60)
    print("FIXED POINT ANALYSIS")
    print("=" * 60)

    print(f"\nMatrix values: +1={n_pos}, -1={n_neg}, 0={n_zero}")
    print(f"Matrix rank (approx): {np.linalg.matrix_rank(F.astype(np.float64))}")

    print(f"\nColumn sums:")
    for s, c in zip(unique_col_sums, col_counts):
        print(f"  sum={s}: {c} columns")

    print(f"\nRow sums:")
    for s, c in zip(unique_row_sums, row_counts):
        print(f"  sum={s}: {c} rows")

    all_cols_42 = np.all(col_sums == 42)
    mean_col = np.mean(col_sums)

    print(f"\nAll 128 column sums = 42? {all_cols_42}")
    print(f"Mean column sum: {mean_col:.1f}")
    print(f"Min: {col_sums.min()}, Max: {col_sums.max()}")

    # Check if idempotent: sign(F@F) == F
    F32 = F.astype(np.int32)
    FF = F32 @ F32
    is_idempotent = np.all(np.sign(FF) == F)
    print(f"\nIdempotent under sign (sign(F@F) = F)? {is_idempotent}")

    print("\n" + "=" * 60)
    if all_cols_42 and converged_at == 6 and is_idempotent:
        print("RESULT: PASS")
        print("  - Converged at iteration 6")
        print("  - All 128 column sums = 42 (exactly)")
        print("  - Fixed point is idempotent under sign activation")
    elif all_cols_42:
        print("RESULT: PASS (column sums)")
        print(f"  - Converged at iteration {converged_at}")
        print("  - All 128 column sums = 42 (exactly)")
    else:
        print(f"RESULT: FAIL — Column sums vary: {dict(zip(unique_col_sums, col_counts))}")
    print("=" * 60)

if __name__ == "__main__":
    main()
