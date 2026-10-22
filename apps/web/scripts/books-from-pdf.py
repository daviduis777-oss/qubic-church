"""Turn the two book PDFs into chapter JSON for the web pages and the LLM files.

Run from apps/web:  python3 scripts/books-from-pdf.py
Needs poppler's pdftotext. Writes src/data/books/<slug>.json.
The text is the book's own text: no rewording, only layout repair
(running heads, page numbers, drop caps, line-end hyphens, paragraph joins).
"""
import json
import re
import statistics
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "books"

BOOKS = [
    {
        "slug": "come-from-beyond",
        "title": "Come-from-Beyond",
        "subtitle": "One line through twenty-five years",
        "pdf": "public/books/come-from-beyond.pdf",
        "cover": "/books/covers/come-from-beyond-cover.png",
        "running": ["Come-from-Beyond"],
        "titles": ["The Man with a Time Machine", "Where Time Grows From", "One Line Through 25 Years", "The Vanished Satoshi", "The Visionary", "The Garden", "The Only Rival", "The Progressor", "Two Scientists", "Zero", "The Gifts"],
        "published": "2026-08-21",
        "language": "en",
        "description": "A book about Sergey Ivancheglo (Come-from-Beyond) and a twenty-five-year line: Minsk 2002, BitcoinTalk 2012, NXT, IOTA, Qubic, Aigarth and Anna. Every quote carries its date and place.",
    },
    {
        "slug": "qubic-the-long-version",
        "title": "Qubic: The Long Version",
        "subtitle": "The Qubic universe assembled into one fresco",
        "pdf": "public/books/qubic-long-version-eng.pdf",
        "cover": "/books/covers/qubic-long-version-cover.png",
        "running": ["Qubic · The Long Version"],
        "titles": ["Murdoch’s Gas", "Axelrod’s Tournament", "Why Bitcoin Can’t Fix Itself", "Come-from-Beyond Before Bitcoin", "Three Projects, Three Metamorphoses", "676 Voices", "Weeks of Epochs", "Murdoch’s Gas in Action — UPoW", "The Breathing Token", "The Arbitrator — A Temporary Monarch", "What Aigarth Is", "What’s Already Done", "Anna Matrix", "What the Deploy on April 13, 2027 Means", "The War That No One Waged", "What Qubic Didn’t Do", "Qubic Church and Fractal Rationalism", "The New Gold"],
        "published": "2026-06-01",
        "language": "en",
        "description": "How Qubic works and why: useful proof of work, 676 computors, weekly epochs, the breathing token, the Arbitrator, Aigarth and the Anna Matrix, read through Axelrod's tournament and the history of waste turned into work.",
        "parts": {
            1: "Part I. The Problem", 4: "Part II. The Man", 6: "Part III. The Mechanics",
            11: "Part IV. Aigarth", 15: "Part V. The Proof", 18: "Part VI. The Finale",
        },
    },
]

QUOTE_TAIL = re.compile(r"[—–-]\s*(Come-from-Beyond|CfB|CFB)[^.]{0,80}\d{4}\.?$")


def slugify(s):
    s = s.lower().replace("’", "").replace("'", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def pages_of(pdf):
    txt = subprocess.run(["pdftotext", str(ROOT / pdf), "-"], capture_output=True, text=True, check=True).stdout
    return txt.split("\f")


def is_noise(line, running, titles):
    s = line.strip()
    if not s:
        return True
    if re.fullmatch(r"\d{1,3}", s):
        return True
    if s in running:
        return True
    return False


def parse(book):
    pages = pages_of(book["pdf"])
    running = set(book["running"])
    chapters = []
    cur = None
    started = False
    toc = book["titles"]
    titles = set(toc)
    for t in toc:  # wrapped titles also appear split over two lines
        titles.update(x for x in [t.split(" — ")[0], t.rsplit(" ", 1)[0]] if len(x) > 8)

    def open_ch(kind, num, title):
        nonlocal cur
        if num:
            title = toc[num - 1]
        cur = {"kind": kind, "n": num, "title": title, "lines": [], "skip": title}
        chapters.append(cur)
        titles.add(title)

    for pg in pages:
        raw = [l.rstrip() for l in pg.split("\n")]
        nonempty = [l for l in raw if l.strip()]
        head = set(l.strip() for l in nonempty[:2])  # running heads sit at the top
        i = 0
        while i < len(raw):
            s = raw[i].strip()
            nxt = lambda k: next((raw[j].strip() for j in range(k, len(raw)) if raw[j].strip()), "")

            def idx_after(k):
                for j in range(k, len(raw)):
                    if raw[j].strip():
                        return j
                return len(raw)

            # chapter starts
            m = re.fullmatch(r"CHAPTER (\d+)", s)
            if m:
                j = idx_after(i + 1)
                open_ch("chapter", int(m.group(1)), raw[j].strip())
                started = True
                i = j + 1
                continue
            if s == "c hAPTEr":
                j = idx_after(i + 1)
                num = int(raw[j].strip())
                k = idx_after(j + 1)
                open_ch("chapter", num, raw[k].strip())
                started = True
                i = k + 1
                continue
            if s in ("Preface", "Acknowledgments") and nxt(i + 1) in (s, "❦"):
                j = idx_after(i + 1)
                if raw[j].strip() == s:
                    j = idx_after(j + 1)
                open_ch(s.lower(), None, s)
                started = True
                i = j  # keep the ❦ line, it is dropped below
                continue
            if not started:
                i += 1
                continue
            if s == "❦":
                i += 1
                continue
            if is_noise(raw[i], running, titles) and s:
                i += 1
                continue
            # chapter title repeated as a running head at the top of a page
            if s in titles and s in head:
                i += 1
                continue
            # second line of a wrapped chapter title right after the heading
            if cur["skip"] and not cur["lines"] and s and s in cur["skip"]:
                i += 1
                continue
            cur["lines"].append(raw[i])
            i += 1
    return chapters


WORDS = {}


def paragraphs(lines):
    text_lines = [l for l in lines if l.strip()]
    if not text_lines:
        return []
    widths = [len(l) for l in text_lines if len(l) > 40]
    full = statistics.median(widths) if widths else 90
    # drop cap: a lone capital letter line; glue it to the first fragment that lacks it
    out = []
    pending_cap = None
    lone = [k for k, l in enumerate(text_lines[:40]) if re.fullmatch(r"[A-Z]", l.strip())]
    if lone:
        cap_idx = lone[0]
        cap = text_lines[cap_idx].strip()
        del text_lines[cap_idx]
        for k, l in enumerate(text_lines[:40]):
            t = l.strip()
            if re.match(r"^[A-Z]{1,14}[ ,.’'—]", t) and not re.match(r"^(I|A|UPoW|AI|BTC|QU|CFB|NXT|IOTA|AGI)\b", t):
                w = re.match(r"^[A-Z]+", t).group(0)
                text_lines[k] = cap + w.lower() + t[len(w):]
                break
            if re.match(r"^[’']", t):
                text_lines[k] = cap + t
                break
            if re.match(r"^[a-z]", t):
                w = re.match(r"^[a-z]+", t).group(0)
                glued = (cap + w).lower()
                # a drop cap that is a whole word ("A note", "I think") keeps its space
                if cap in "AI" and WORDS.get(glued, 0) == 0 and WORDS.get(w, 0) > 0:
                    text_lines[k] = cap + " " + t
                else:
                    text_lines[k] = cap + t
                break
    paras, buf = [], ""
    for l in text_lines:
        t = l.strip()
        if not buf and len(l) < 0.6 * full and not re.search(r"[.!?»”\":;,…)]$", t) and (t[:1].isupper() or t[:1].isdigit()) and len(t) > 2 and not re.fullmatch(r"[A-Za-z](\s[A-Za-z]){2,}", t):
            paras.append("\x00" + t)
            continue
        if buf.endswith("‐") or buf.endswith("-") and re.match(r"^[a-z]", t) and len(buf) > 1 and buf[-2].isalpha():
            buf = buf[:-1] + t
        else:
            buf = (buf + " " + t).strip()
        short = len(l) < 0.82 * full
        cite_end = (re.fullmatch(r"[A-Z][a-z]+ \d{1,2}, \d{4}\.?", t) and " — " in buf) or re.search(r"^[—–]\s.{3,90}\d{4}\.?$|[—–]\s*Come-from-Beyond.{0,60}\d{4}\.?$", t)
        if (short and re.search(r"[.!?»”\":)…]$", t)) or cite_end:
            paras.append(buf)
            buf = ""
    if buf:
        paras.append(buf)
    # merge a paragraph that is only a lowercase continuation into the previous one
    merged = []
    for p in paras:
        if p.startswith("\x00"):
            merged.append(p)
            continue
        if merged and re.match(r"^[a-z]", p) and not merged[-1].startswith("\x00"):
            merged[-1] = merged[-1] + " " + p
        else:
            merged.append(p)
    # an attribution line on its own belongs to the quote right before it
    joined = []
    for p in merged:
        if joined and re.match(r"^[—–]\s", p) and joined[-1][:1] in "«“”\"":
            joined[-1] = joined[-1] + " " + p
        else:
            joined.append(p)
    merged = joined
    blocks = []
    for p in merged:
        if p.startswith("\x00"):
            blocks.append({"t": "h", "text": p[1:].strip()})
            continue
        p = p.replace("ﬀ", "ff").replace("ﬁ", "fi").replace("ﬂ", "fl").replace("ﬃ", "ffi")
        p = re.sub(r"\s+", " ", p).strip()
        mq = re.search(r"\s[—–]\s*([A-Z][^—–]{2,90}\d{4})\.?$", p)
        if mq and p[:1] in "«“”\"" and len(p) < 900:
            m = mq
            blocks.append({"t": "quote", "text": p[: m.start()].strip(), "cite": m.group(1).strip()})
        else:
            blocks.append({"t": "p", "text": p})
    return blocks


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for b in BOOKS:
        chs = parse(b)
        WORDS.clear()
        for c in chs:
            for l in c["lines"]:
                for w in re.findall(r"[a-z]+", l.lower()):
                    WORDS[w] = WORDS.get(w, 0) + 1
        res = []
        for c in chs:
            if c["kind"] == "chapter":
                slug = f"{c['n']:02d}-{slugify(c['title'])}"
                label = f"Chapter {c['n']}"
            else:
                slug = c["kind"]
                label = c["title"]
            part = None
            if b.get("parts") and c["n"]:
                for start in sorted(b["parts"]):
                    if c["n"] >= start:
                        part = b["parts"][start]
            blocks = paragraphs(c["lines"])
            words = sum(len(x["text"].split()) for x in blocks)
            res.append({"slug": slug, "n": c["n"], "label": label, "title": c["title"], "part": part, "words": words, "blocks": blocks})
        data = {k: v for k, v in b.items() if k not in ("running", "parts")}
        data["pdf"] = "/" + data["pdf"].split("public/", 1)[1]
        data["author"] = "QC"
        data["publisher"] = "Qubic Church"
        data["chapters"] = res
        (OUT / f"{b['slug']}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        print(b["slug"], len(res), "sections,", sum(r["words"] for r in res), "words")
        for r in res:
            print("  ", r["slug"], r["words"])


if __name__ == "__main__":
    main()
