# Qubic Church

> Books and open research on Qubic, Aigarth and Come-from-Beyond (Sergey Ivancheglo). Website: **https://qubic.church**

Qubic Church is an independent research publication. It publishes two free books by **QC** and an open research log in which results are recomputed from public data, quotes carry their date and source, and claims that did not hold up are withdrawn on a public corrections page.

## Books (free, readable chapter by chapter)

| Book | Year | Read online | PDF |
|---|---|---|---|
| **Qubic: The Long Version** by QC. How Qubic works and why: useful proof of work, 676 computors, weekly epochs, the breathing token, the Arbitrator, Aigarth and the Anna Matrix, read through Axelrod's tournament. 18 chapters. | 2026 | [qubic.church/books/qubic-the-long-version](https://qubic.church/books/qubic-the-long-version) | [EN](https://qubic.church/books/qubic-long-version-eng.pdf) · [DE](https://qubic.church/books/qubic-long-version-deu.pdf) · [RU](https://qubic.church/books/qubic-long-version-rus.pdf) |
| **Come-from-Beyond** by QC. A book about Sergey Ivancheglo and a twenty-five-year line: Minsk 2002, BitcoinTalk 2012, NXT, IOTA, Qubic, Aigarth and Anna. 11 chapters. | 2026 | [qubic.church/books/come-from-beyond](https://qubic.church/books/come-from-beyond) | [EN](https://qubic.church/books/come-from-beyond.pdf) |

Every chapter has its own page with a citation block and a plain-text version (`/text/<book>/<chapter>.md`). The full text of both books is at [qubic.church/llms-full.txt](https://qubic.church/llms-full.txt); a guide for AI systems is at [qubic.church/llms.txt](https://qubic.church/llms.txt).

How to cite: QC. (2026). *Chapter title*. In *Book title*. Qubic Church. URL of the chapter.

## Research and guides

- **[Research log](https://qubic.church/docs):** the Anna Matrix (a 128 × 128 table of the Anna bot's answers), its mirror symmetry, Anna 0.22 and BPP9000, primary sources of Come-from-Beyond with message IDs. Start with the [corrections page](https://qubic.church/docs/03-results/35-corrections-september-2026).
- **[How to mine Qubic](https://qubic.church/mine-qubic):** a field guide to useful proof of work: solutions vs it/s, cost per solution, AVX-512 CPUs and GPUs, pools, payouts.
- **[Maria Aigarth](https://qubic.church/maria-aigarth):** a research agent testing whether an AI arbiter can be architecturally impartial (Fractal Rationalism).
- **[Anna Aigarth collection](https://qubic.church/nfts)** and its **[Rarity Codex](https://qubic.church/rarity-codex)**.
- **[About](https://qubic.church/about):** the Fractal Rationalism Institute, Web4World and the Atrium.

Nothing here is financial advice or a promise of returns.

## Links

- Website: https://qubic.church
- X: [@QubicChurch](https://x.com/QubicChurch)

## Development

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, MDX content. The site lives in `apps/web`, research content in `apps/content`.

```bash
pnpm install
pnpm dev
pnpm build
```

## License

Code is licensed under the [MIT license](LICENSE.md).
