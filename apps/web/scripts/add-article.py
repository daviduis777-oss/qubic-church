"""Add one article (a guest issue, or a new TesserAI issue) to the archive.

Run from apps/web:

  python3 scripts/add-article.py draft.txt \
      --author "Jane Doe" --handle janedoe --date 2026-10-25 \
      --url https://x.com/janedoe/status/123 \
      [--maria https://x.com/maria_aigarth/status/456] \
      [--title "..."] [--kicker "..."] [--slug my-slug]

draft.txt is the author's text as pasted from X: the first non-empty line is the
title unless --title is given. Headings and quotes are inferred the same way as
for TesserAI issues; the words are never changed. --maria marks that Maria has
reposted it, which adds weight. The entry is prepended to articles.json and the
site rebuilds it into /articles, the map, RSS, llms.txt and /text/articles/<slug>.md.
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from articles_from_txt import blocks_of, clean_lines  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "articles" / "articles.json"


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)[:60].rstrip("-") or "article"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("draft", help="plain text of the article")
    ap.add_argument("--author", required=True)
    ap.add_argument("--handle", required=True, help="X handle without @")
    ap.add_argument("--date", required=True, help="YYYY-MM-DD")
    ap.add_argument("--url", required=True, help="the original post on X")
    ap.add_argument("--maria", help="URL of Maria's repost; adds weight")
    ap.add_argument("--title")
    ap.add_argument("--kicker")
    ap.add_argument("--slug")
    ap.add_argument("--note", help="editor's note shown above the post, e.g. Not financial advice")
    a = ap.parse_args()

    text = Path(a.draft).read_text(encoding="utf-8")
    raw = [l.strip() for l in text.splitlines() if l.strip()]
    if not raw:
        sys.exit("empty draft")
    title = a.title or raw[0]
    lines = clean_lines(text, title, a.kicker)
    blocks = blocks_of(lines)
    if not blocks:
        sys.exit("no text left after cleaning")
    words = sum(len(b["text"].split()) for b in blocks)
    first = next((b["text"] for b in blocks if b["t"] == "p" and len(b["text"]) > 80), blocks[0]["text"])
    summary = first if len(first) <= 240 else first[:237].rsplit(" ", 1)[0] + "…"

    arts = json.loads(OUT.read_text(encoding="utf-8"))
    slug = a.slug or slugify(title)
    base, n = slug, 2
    while any(x["slug"] == slug for x in arts):
        slug = f"{base}-{n}"
        n += 1
    handle = a.handle.lstrip("@")
    entry = {
        "slug": slug, "title": title, "kicker": a.kicker, "date": a.date, "url": a.url,
        "author": a.author, "handle": handle, "guest": handle.lower() != "usetesserai",
        "summary": summary, "words": words, "blocks": blocks,
    }
    if a.maria:
        entry["mariaRepost"] = a.maria
    if a.note:
        entry["note"] = a.note
    arts.insert(0, entry)
    arts.sort(key=lambda x: x["date"], reverse=True)
    OUT.write_text(json.dumps(arts, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"added /articles/{slug}: {len(blocks)} blocks, {words} words, by {a.author} (@{handle}){' · reposted by Maria' if a.maria else ''}")


if __name__ == "__main__":
    main()
