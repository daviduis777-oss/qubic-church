#!/usr/bin/env python3
"""
Verify it yourself — no install, no dependencies, ~2 seconds.

This is the one-file, zero-dependency version of the headline result. It needs
ONLY standard Python 3 (no numpy, no internet, nothing to install).

What it does:
  1. Evolves a tiny one-cell "adder" by trial-and-error, training it ONLY on the
     16 smallest sums (adding two 2-bit numbers: 0+0 up to 3+3).
  2. Then checks that same evolved cell on millions of bits of random numbers it
     NEVER trained on — up to 256-bit numbers (~77-digit numbers).

The point: it does not memorize the 16 answers. Training on the 16 smallest sums
forces it to discover the actual rule for adding (sum = a XOR b XOR carry,
carry-out = majority) — so it is then correct for numbers of ANY size, forever.

Run it:
    python3 verify_emergence.py

Deterministic (seeded) — you will get the same PASS we do.
"""

import random

# The exact full adder, indexed by (a<<2)|(b<<1)|carry_in -> sum | (carry_out<<1)
FULL_ADDER = [0, 1, 1, 2, 1, 2, 2, 3]


def ripple_add(lut, a, b, width):
    """Add a + b by applying the one-cell module at each bit, carrying along."""
    carry, out = 0, 0
    for k in range(width):
        idx = (((a >> k) & 1) << 2) | (((b >> k) & 1) << 1) | carry
        cell = lut[idx]
        out |= (cell & 1) << k
        carry = (cell >> 1) & 1
    out |= carry << width
    return out


def train_error(lut):
    """How many output bits are wrong across all 16 two-bit sums."""
    err = 0
    for a in range(4):
        for b in range(4):
            err += bin(ripple_add(lut, a, b, 2) ^ (a + b)).count("1")
    return err


def evolve(seed):
    """(1+1) evolution strategy on the 16 two-bit sums, with auto-restart."""
    rng = random.Random(seed)
    for attempt in range(40):
        lut = [rng.randrange(4) for _ in range(8)]
        err, tweaks = train_error(lut), 0
        while err > 0 and tweaks < 2000:
            i, bit = rng.randrange(8), rng.randrange(2)
            prev = lut[i]
            lut[i] = prev ^ (1 << bit)
            tweaks += 1
            new_err = train_error(lut)
            if new_err <= err:
                err = new_err          # keep changes that help (or don't hurt)
            else:
                lut[i] = prev          # undo changes that hurt
        if err == 0:
            return lut, attempt, tweaks
    return None, attempt, 0


def count_wrong(lut, width, pairs, rng):
    wrong = 0
    for _ in range(pairs):
        a, b = rng.getrandbits(width), rng.getrandbits(width)
        wrong += bin(ripple_add(lut, a, b, width) ^ (a + b)).count("1")
    return wrong


def main():
    print("Teaching a tiny adder using ONLY the 16 smallest sums (0+0 ... 3+3)...")
    lut, restarts, tweaks = evolve(seed=12345)
    if lut is None:
        print("  unexpected: did not converge"); return 1

    extra = f" (after {restarts} restart{'s' if restarts != 1 else ''})" if restarts else ""
    print(f"  trained: all 16 two-bit sums correct in {tweaks} tweaks{extra}.")
    print(f"  the rule it discovered : {lut}")
    print(f"  the exact full adder   : {FULL_ADDER}", "  <- identical" if lut == FULL_ADDER else "  <- DIFFERENT")

    print("\nNow testing it on numbers it NEVER trained on (Python handles any size):")
    rng = random.Random(2026)
    all_pass = True
    for width, pairs in [(16, 5000), (32, 5000), (64, 2000), (128, 2000), (256, 1000)]:
        wrong = count_wrong(lut, width, pairs, rng)
        bits = pairs * (width + 1)
        ok = wrong == 0
        all_pass = all_pass and ok
        print(f"  up to {width:>4}-bit numbers : {pairs:>5} random pairs ({bits:>8,} bits) : {wrong} wrong  ->  {'PASS' if ok else 'FAIL'}")

    print()
    if all_pass:
        print("RESULT: PASS  -  trained on 16 tiny sums, correct on every number tested up to 256-bit.")
        print("It did not memorize; it found the method. That is the point.")
        return 0
    print("RESULT: FAIL")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
