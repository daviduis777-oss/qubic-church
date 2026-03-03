#!/usr/bin/env python3
"""
Run all Anna Matrix verification scripts and summarize results.

Usage:
    python verify_all.py

Requirements:
    pip install numpy
"""

import subprocess
import sys

SCRIPTS = [
    ("Bijection (0 collisions in 100K)", "verify_bijection.py"),
    ("Point Symmetry (99.58%)", "verify_symmetry.py"),
    ("Fixed Point (all columns sum to 42)", "verify_fixed_point.py"),
    ("Spectral & Energy Levels (8 symmetric)", "verify_spectral.py"),
]

def main():
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    results = []

    for label, script in SCRIPTS:
        print(f"\n{'#' * 70}")
        print(f"# {label}")
        print(f"# Running: {script}")
        print(f"{'#' * 70}\n")

        path = os.path.join(script_dir, script)
        result = subprocess.run(
            [sys.executable, path],
            capture_output=False,
        )
        results.append((label, script, result.returncode))

    print(f"\n\n{'=' * 70}")
    print("VERIFICATION SUMMARY")
    print(f"{'=' * 70}")

    all_pass = True
    for label, script, code in results:
        status = "PASS" if code == 0 else "FAIL"
        if code != 0:
            all_pass = False
        print(f"  [{status}] {label}")

    print(f"{'=' * 70}")
    if all_pass:
        print("\nAll verifications passed. Every claim is independently confirmed.")
    else:
        print("\nSome verifications failed. Check individual outputs above.")

    sys.exit(0 if all_pass else 1)

if __name__ == "__main__":
    main()
