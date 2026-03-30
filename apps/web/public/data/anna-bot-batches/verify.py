#!/usr/bin/env python3
"""
Anna Bot Oracle - public verification script.

Reproduces the claim at /docs/03-results/04-anna-bot-verification.
Verifies every collected Anna Bot response against the formula:

    row = (63 - y) % 128
    col = (x + 64) % 128
    value = matrix[row][col]

Runs in under one second using only the Python standard library.

Usage:
    python3 verify.py                          # run from this dir
    python3 apps/web/public/data/anna-bot-batches/verify.py   # from repo root
"""
import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent

# Locate the matrix file: try repo structure first, then sibling data/
CANDIDATES = [
    HERE.parent / "anna-matrix-raw.json",     # apps/web/public/data/
    HERE / "anna-matrix-raw.json",            # sibling (if re-packaged)
]


def find_matrix():
    for p in CANDIDATES:
        if p.exists():
            return p
    sys.exit(f"ERROR: could not locate anna-matrix-raw.json. Tried: {CANDIDATES}")


def load_matrix():
    path = find_matrix()
    m = json.loads(path.read_text())
    assert len(m) == 128 and all(len(r) == 128 for r in m), "matrix is not 128x128"
    assert all(isinstance(v, int) and -128 <= v <= 127 for row in m for v in row), \
        "matrix contains non-int or out-of-range values"
    return m


def lookup(matrix, x, y):
    row = (63 - y) % 128
    col = (x + 64) % 128
    return matrix[row][col]


PAT_XY = re.compile(r"^(-?\d+)\+(-?\d+)=(-?\d+)$")
PAT_B3 = re.compile(r"^\s*(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s*$")


def parse_xy(path):
    out = []
    for line in path.read_text().splitlines():
        mo = PAT_XY.match(line.strip())
        if mo:
            out.append((int(mo[1]), int(mo[2]), int(mo[3])))
    return out


def parse_batch3(path):
    out = []
    for line in path.read_text().splitlines():
        s = line.rstrip()
        if not s or s.startswith("#"):
            continue
        mo = PAT_B3.match(s)
        if mo:
            x, y, anna, expected, _ = map(int, mo.groups())
            if x + y == expected:
                out.append((x, y, anna))
    return out


def parse_tweets(path):
    out = []
    with path.open() as f:
        for r in csv.DictReader(f):
            try:
                out.append((int(r["Input_A"]), int(r["Input_B"]), int(r["Output"])))
            except (ValueError, KeyError):
                pass
    return out


def parse_parsed(path):
    d = json.loads(path.read_text())
    return [(int(r["x"]), int(r["y"]), int(r["value"])) for r in d["responses"]]


SOURCES = [
    ("tweets_jan2_3",           "batch_1_2_tweets_jan2_3.csv",        parse_tweets),
    ("batch3",                  "batch_3_responses.txt",              parse_batch3),
    ("batch4_partial_1",        "batch_4_partial_1.txt",              parse_xy),
    ("batch4_partial_2_origin", "batch_4_partial_2_origin.txt",       parse_xy),
    ("batch4_partial_3",        "batch_4_partial_3_row1_row5.txt",    parse_xy),
    ("batch5",                  "batch_5_fibonacci_deep_dive.txt",    parse_xy),
    ("batch6",                  "batch_6_modulo8_complete.txt",       parse_xy),
    ("batch7",                  "batch_7_row_patterns.txt",           parse_xy),
    ("batch8",                  "batch_8_complete_understanding.txt", parse_xy),
    ("parsed_json",             "anna_bot_parsed_142.json",           parse_parsed),
]


def main():
    matrix = load_matrix()
    print(f"Matrix loaded: 128x128 int8, sum={sum(sum(r) for r in matrix)}")

    refs = [
        (  0,   0, -40, "Center"),
        (-64,  63, -68, "Top-Left"),
        ( 63, -64,  67, "Bottom-Right"),
        (  6,  33, -93, "Core node"),
        (-42,  41, 100, "XOR triangle"),
        ( 49,   5,-114, "High-collision"),
    ]
    print("\nReference lookups:")
    for x, y, expected, name in refs:
        got = lookup(matrix, x, y)
        tag = "OK" if got == expected else "FAIL"
        print(f"  [{tag}] lookup({x:>4},{y:>4}) = {got:>5}  (expected {expected:>5})  [{name}]")

    all_rows = []
    per_src = {}
    for name, fname, parser in SOURCES:
        path = HERE / fname
        if not path.exists():
            print(f"WARN: missing {fname}")
            continue
        entries = parser(path)
        per_src[name] = len(entries)
        all_rows.extend((*e, name) for e in entries)

    print(f"\nLoaded {len(all_rows)} entries from {len(per_src)} sources:")
    for n, c in per_src.items():
        print(f"  {n:<25} {c:>5}")

    unique = {(x, y, v) for x, y, v, _ in all_rows}
    xy_pairs = {(x, y) for x, y, _, _ in all_rows}

    hits = sum(1 for x, y, v, _ in all_rows if lookup(matrix, x, y) == v)
    misses = [(x, y, v, lookup(matrix, x, y), s)
              for x, y, v, s in all_rows if lookup(matrix, x, y) != v]

    print(f"\n{'='*60}")
    print("VERIFICATION RESULT")
    print(f"{'='*60}")
    print(f"  Total entries:    {len(all_rows)}")
    print(f"  Unique triples:   {len(unique)}")
    print(f"  Unique (x,y):     {len(xy_pairs)}")
    print(f"  Formula matches:  {hits}/{len(all_rows)}  ({hits/len(all_rows)*100:.4f}%)")
    print(f"  Mismatches:       {len(misses)}")
    if misses:
        print("  First 10 mismatches:")
        for x, y, v, p, s in misses[:10]:
            print(f"    ({x:>4},{y:>4}) observed={v!r:>10}  predicted={p:>5}  [{s}]")

    by_t = Counter()
    by_h = Counter()
    for x, y, v, s in all_rows:
        by_t[s] += 1
        if lookup(matrix, x, y) == v:
            by_h[s] += 1
    print("\nPer-source accuracy:")
    for s in sorted(by_t):
        t, h = by_t[s], by_h[s]
        print(f"  {s:<25} {h:>4}/{t:<4} = {h/t*100:7.3f}%")

    return 0 if not misses else 1


if __name__ == "__main__":
    sys.exit(main())
