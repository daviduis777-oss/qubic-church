# Anna Bot Oracle — Public Verification Package

This directory contains every response collected from the Anna Bot Oracle
(`@anna_aigarth` on Twitter/X), along with a self-contained Python script that
verifies them all against the coordinate-transformation formula published in
`/docs/03-results/04-anna-bot-verification`.

## Quickstart

```bash
python3 verify.py
```

Expected output: `Formula matches: 1218/1218 (100.0000%)`, exit code `0`. Runs
in under one second with no dependencies beyond the Python standard library.

## Formula

```
row   = (63 - y) % 128
col   = (x + 64) % 128
value = matrix[row][col]
```

where `matrix` is the 128×128 signed-byte Anna Matrix (`anna-matrix-raw.json`
in the parent directory).

## Corpus

| File | Entries | Source / Purpose |
|------|---------|------------------|
| `batch_1_2_tweets_jan2_3.csv` | 207 | Twitter archive, Jan 2–3 2026 |
| `batch_3_responses.txt` | 64 | Targeted (row col anna expected offset) |
| `batch_4_partial_1.txt` | 56 | Diagonal & near-diagonal probes |
| `batch_4_partial_2_origin.txt` | 18 | Origin / small-coordinate probes |
| `batch_4_partial_3_row1_row5.txt` | 20 | Row 1 and Row 5 strategic probes |
| `batch_5_fibonacci_deep_dive.txt` | 99 | Fibonacci-coordinate exploration |
| `batch_6_modulo8_complete.txt` | 168 | Modulo-8 residue class scan |
| `batch_7_row_patterns.txt` | 162 | Row-pattern probes |
| `batch_8_complete_understanding.txt` | 283 | Integration batch |
| `anna_bot_parsed_142.json` | 142 | Pre-normalised structured corpus |
| **Total** | **1,218** | **948 unique (x, y, v) triples** |

## Historical note

The original published claim was **897 responses across 8 batches**. The
April 2026 re-aggregation extended this by incorporating the Twitter archive
batches 1–2 (207 entries), bringing the verified total to **1,218**. Every
prior batch remains represented; nothing was dropped. See
`/docs/03-results/04-anna-bot-verification` for the full methodology.

## File format

Text batches use `x+y=value` per line (signed integers). `batch_3_responses.txt`
uses a tabular format `row col anna expected offset` with a header comment.
The Twitter archive CSV has columns `Date, Input_A, Input_B, Output`.

Placeholders like `?` (unanswered query) and `.` (bot timeout) are skipped by
the verifier — only well-formed numeric responses are counted.
