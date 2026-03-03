#!/usr/bin/env python3
"""
Verify: Anna Matrix is 99.58% point-symmetric.

This script checks the point-symmetry identity:
    matrix[r][c] + matrix[127-r][127-c] = -1

for all 16,384 cells (128x128). The matrix satisfies this identity
for 99.58% of cells (16,316 of 16,384). The 68 deviating cells
(34 pairs) concentrate in 8 specific columns.

Usage:
    python verify_symmetry.py

Requirements:
    pip install numpy

Expected output:
    99.58% point symmetry (16,316 / 16,384 cells).
    68 deviating cells in 8 columns.
"""

import json
import urllib.request
import numpy as np
from collections import Counter

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

    N = 128
    total_cells = N * N
    symmetric_count = 0
    breaks = []

    print("Checking point-symmetry: A[r][c] + A[127-r][127-c] = -1 ...")

    for r in range(N):
        for c in range(N):
            val = A[r, c] + A[N - 1 - r, N - 1 - c]
            if val == -1:
                symmetric_count += 1
            else:
                breaks.append((r, c, A[r, c], A[N-1-r, N-1-c], val))

    n_breaks = total_cells - symmetric_count
    pct = symmetric_count / total_cells * 100

    print(f"\n{'=' * 60}")
    print("POINT SYMMETRY ANALYSIS")
    print(f"{'=' * 60}")
    print(f"  Total cells:     {total_cells:>8,}")
    print(f"  Symmetric cells: {symmetric_count:>8,}")
    print(f"  Deviating cells: {n_breaks:>8,}")
    print(f"  Symmetry:        {pct:>8.2f}%")

    if breaks:
        # Analyze which columns contain breaks
        break_cols = Counter()
        for r, c, v1, v2, s in breaks:
            break_cols[c] += 1

        print(f"\nDeviating cells by column:")
        print(f"  {'Column':>8} {'Breaks':>8}")
        print(f"  {'-'*18}")
        for col in sorted(break_cols.keys()):
            print(f"  {col:>8} {break_cols[col]:>8}")

        # Check column pairs
        cols = sorted(break_cols.keys())
        print(f"\n  Break columns: {cols}")

        # Check if they form mirror pairs (c, 127-c)
        pairs = []
        seen = set()
        for c in cols:
            mirror = 127 - c
            if c not in seen and mirror not in seen:
                if mirror in break_cols:
                    pairs.append((c, mirror))
                    seen.add(c)
                    seen.add(mirror)
        if pairs:
            print(f"  Mirror pairs: {pairs}")

    print(f"\n{'=' * 60}")
    if abs(pct - 99.58) < 0.1 and n_breaks == 68:
        print("RESULT: PASS — 99.58% point symmetry with 68 structural breaks.")
    elif abs(pct - 99.58) < 0.5:
        print(f"RESULT: PARTIAL — {pct:.2f}% symmetry, {n_breaks} breaks.")
    else:
        print(f"RESULT: CHECK — {pct:.2f}% symmetry (expected 99.58%).")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
