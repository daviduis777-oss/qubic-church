"""Turn TesserAI X articles (plain text exports) into src/data/articles/articles.json.

Run from apps/web:  python3 scripts/articles-from-txt.py
The text is the author's own; only layout is inferred (headings, quotes) and
X page residue (timestamps, view counts, trailing tags) is dropped.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data" / "articles" / "src"
OUT = ROOT / "src" / "data" / "articles" / "articles.json"
X = "https://x.com/usetesserai"

META = [
    ("bb99d0bf", "true-randomness-is-critical", "True randomness is critical. Why?", None, "2026-10-21", f"{X}/status/2112902306639519977"),
    ("9975cacf", "17-versions-of-anna-in-one-week", "Qubic. Incredibly important: 17 versions of Anna Aigarth in one week", None, "2026-09-26", f"{X}/status/2103868458190667818"),
    ("309a4424", "aigarth-september-2026-two-fronts", "Aigarth, September 2026: two fronts, one paradigm", "Qubic right now, 17 September", "2026-09-17", f"{X}/status/2100500145846485256"),
    ("7e021e10", "agi-astra-the-table-and-qubic", "AGI, Astra, the table, and where Qubic is in it", None, "2026-09-04", X),
    ("7532d01d", "bpp-9000-first-product-of-aigarth", "BPP-9000: the first product of Aigarth", None, "2026-08-28", X),
    ("ce1a395c", "the-crazy-summer", "The crazy summer", "Just run miner", "2026-08-22", X),
    ("1e2631d6", "qubic-published-its-brains", "Qubic published its brains. 525 million rows", None, "2026-08-13", X),
    ("b187373e", "qubic-is-weaker-than-grok-for-now", "Qubic is weaker than Grok in AI. For now.", None, "2026-07-28", X),
    ("e43e3f89", "the-body-three-pillars", "The Body: how Qubic's three pillars assemble into one machine", None, "2026-07-24", X),
    ("573b6da0", "2026-for-qubic", "2026 for Qubic: peer review you cannot buy", None, "2026-07-19", X),
]

NOISE = [
    r"^\d{1,2}:\d{2}\s*(AM|PM)\s*·.*$", r"^·$", r"^[\d.,]+\s*K?$", r"^Views$", r"^[\d.,]+K?\s+Views$",
    r"^(#Qubic|\$Qubic|#Qubic \$Qubic|\$Qubic #Qubic)\s*$", r"^(@\w+\s*)+$",
]
QUOTE_OPEN = "\"“«"


def clean_lines(text, title, kicker=None):
    lines = [l.rstrip() for l in text.replace(" ", " ").splitlines()]
    out = []
    for l in lines:
        s = re.sub(r"\s+", " ", l).strip()
        if not s:
            continue
        if any(re.match(p, s) for p in NOISE):
            continue
        out.append(s)
    # drop the title line(s) the export repeats at the top
    while out and (out[0].lower().strip(" .") in title.lower() or out[0] in ("UST RUN MINER",) or out[0].lower() in title.lower()):
        out.pop(0)
    # a first line that repeats the title
    def words(x):
        return set(re.findall(r"[a-z0-9]+", x.lower()))
    for ref in (kicker or '', title):
        if out and not out[0].endswith(':') and len(words(out[0]) & words(ref)) >= max(2, 0.6 * len(words(out[0]))):
            out.pop(0)
    # tags/handles at the very end
    while out and re.match(r"^(#\w+|@\w+|\$\w+)(\s+(#\w+|@\w+|\$\w+))*$", out[-1]):
        out.pop()
    return out


def is_heading(s, nxt):
    if re.match(r"^(Part \d+\b|The one-paragraph version:?$|Conclusion$)", s):
        return True
    if s[0] in QUOTE_OPEN or len(s) > 80 or not s[0].isupper() or "->" in s:
        return False
    if re.search(r"[.!?;,:\"”»)…]$", s):
        return False
    if re.match(r"^\d+(\.\d+)*\.?\s", s) and len(s) > 40:
        return False
    return bool(nxt) and len(nxt) > len(s)


def blocks_of(lines):
    blocks = []
    i = 0
    while i < len(lines):
        s = lines[i]
        nxt = lines[i + 1] if i + 1 < len(lines) else ""
        m = re.match(r"^[\"“«](.+?)[\"”»]\.?\s*[-–—]\s*(.{2,120})$", s) or re.match(r"^[\"“«](.+?)[\"”»]\.?\s*\(((?:CfB|Come-from-Beyond|Vivancos|Sánchez|Sanchez)[^()]{0,80})\)$", s)
        if m:
            blocks.append({"t": "quote", "text": m.group(1).strip(), "cite": m.group(2).strip()})
        elif s[0] in QUOTE_OPEN and re.match(r"^(Come-from-Beyond|CfB)[^.]{0,80}\d{4}$", nxt):
            blocks.append({"t": "quote", "text": s.strip("\"“”«»"), "cite": nxt})
            i += 1
        elif is_heading(s, nxt):
            blocks.append({"t": "h", "text": s})
        else:
            blocks.append({"t": "p", "text": s})
        i += 1
    return blocks


def main():
    arts = []
    for key, slug, title, kicker, date, url in META:
        text = (SRC / f"{key}.txt").read_text(encoding="utf-8")
        lines = clean_lines(text, title, kicker)
        blocks = blocks_of(lines)
        words = sum(len(b["text"].split()) for b in blocks)
        first = next((b["text"] for b in blocks if b["t"] == "p" and len(b["text"]) > 80), "")
        summary = first if len(first) <= 240 else first[:237].rsplit(" ", 1)[0] + "…"
        arts.append({"slug": slug, "title": title, "kicker": kicker, "date": date, "url": url,
                     "author": "TesserAI", "summary": summary, "words": words, "blocks": blocks})
        print(slug, len(blocks), "blocks", words, "words")
    OUT.write_text(json.dumps(arts, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
