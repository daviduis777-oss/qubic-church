#!/usr/bin/env python3
"""
Run a BPP-9000 brain downloaded from qubic.church/bpp9000/brains, on your own computer.

    python3 run_brain.py brain.json

No installs needed (Python 3.8+). It does two things:
  1. runs the 32 neurons tick by tick, exactly as the Qubic core scores them,
     and collects the network's UP / DOWN calls, one per hour;
  2. EXAM: checks the calls for every hour after the year it was grown on, hours the
     network never saw, against what bitcoin really did (hourly BTC/USDT closes from Binance).
The HOMEWORK number (how well it fits the year it was grown on) is the Qubic network's own
score, printed from the file.

Rule for every hour: UP if the rounded close is at or above the previous hour's rounded close, else DOWN.
"""
import json
import sys
import time
import urllib.request

UP, DOWN, UNSURE = 1, 0, 2


def calls(brain, count, max_ticks=200_000):
    """The brain's calls: tick the network; whenever the control neuron is not 'unsure', the output neuron is a call."""
    nodes = brain["nodes"]
    state = [n["initialState"] for n in nodes]
    ctrl, out = brain["control"], brain["output"]
    got = []
    for _ in range(max_ticks):
        nxt = []
        for n in nodes:
            src = n["sources"]
            if any(s is None for s in src):  # an unwired input: the core's table lookup lands on 0
                nxt.append(0)
                continue
            idx = state[src[0]] + 3 * state[src[1]] + 9 * state[src[2]]
            nxt.append(n["lut"][idx])
        state = nxt
        if state[ctrl] != UNSURE:
            got.append(state[out])
            if len(got) == count:
                break
    return got


def binance_closes(start, end):
    """Rounded hourly closes for the hours opening at start .. end (unix seconds), keyed by hour."""
    closes, t = {}, start
    while t <= end:
        url = f"https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1h&startTime={t * 1000}&limit=1000"
        rows = json.load(urllib.request.urlopen(url, timeout=20))
        if not rows:
            break
        now_ms = time.time() * 1000
        for k in rows:
            if k[6] >= now_ms:  # still open
                break
            closes[k[0] // 1000] = round(float(k[4]))
        t = rows[-1][0] // 1000 + 3600
        if len(rows) < 1000:
            break
    return closes


def went(closes, hour):
    a, b = closes.get(hour - 3600), closes.get(hour)
    if a is None or b is None:
        return None
    return UP if b - a >= 0 else DOWN


def check(brain, closes, end_hour):
    task = brain["task"]
    start, hours = task["start"], task["hours"]
    n_hours = (end_hour - start) // 3600 + 1
    c = calls(brain, n_hours)

    # exam: every hour after the training data; an "unsure" is skipped (the network said nothing)
    ex_hit = ex_n = ex_unsure = 0
    for i in range(hours, min(len(c), n_hours)):
        w = went(closes, start + i * 3600)
        if w is None:
            continue
        if c[i] == UNSURE:
            ex_unsure += 1
            continue
        ex_n += 1
        ex_hit += c[i] == w
    return {"calls": len(c), "ex_n": ex_n, "ex_hit": ex_hit, "ex_unsure": ex_unsure,
            "exam_from": start + hours * 3600}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    brain = json.load(open(sys.argv[1], encoding="utf-8"))
    task = brain["task"]
    end_hour = int(time.time()) // 3600 * 3600 - 3600
    print(f"Brain {brain['hash'][:12]}...  epoch {brain['epoch']}, grown by computor {brain['computor'][:8]}...")
    print("Fetching hourly bitcoin closes from Binance...")
    exam_from = task["start"] + task["hours"] * 3600
    closes = binance_closes(exam_from - 3600, end_hour)
    r = check(brain, closes, end_hour)
    print()
    print(f"HOMEWORK  {brain['score']['accuracy']}%   (the year it was grown on, as the Qubic network scored it)")
    if r["ex_n"]:
        print(f"EXAM      {r['ex_hit']:,} of {r['ex_n']:,} hours right = {100 * r['ex_hit'] / r['ex_n']:.2f}%"
              f"   (hours since {time.strftime('%d %b %Y', time.gmtime(r['exam_from']))} it never saw)")
    print()
    print("50% is a coin. The exam is the number that matters.")


if __name__ == "__main__":
    main()
