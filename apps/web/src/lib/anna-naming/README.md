# anna-naming

Single source of truth for two naming concerns shared across the Evidence section UI:

1. **Concept pair labels** — maps numerical concept IDs (`#0..#18`) to their Pair-A+/A-...H+/H- + S1/S2/S3 labels. Used by every component that displays a concept.
2. **Phase code → public title** — maps internal `D1+D1b+D1c`, `D2`, `E2` etc. to semantic section titles ("Multi-task generality, bias-corrected"). Used by AigarthLabTab.

## Why it exists

The Evidence section's tabs were originally built as research dashboards exposing internal Phase + Tier nomenclature. The 2026-05-09 redesign replaces this with comprehension-first naming for non-research visitors. Centralising the mapping prevents drift between MDX, JSON, and rendered UI.

## API

See `concepts.ts` and `phases.ts` for the public types. `index.ts` re-exports.

## How to verify

Run the Node assertion tests (no test runner needed):

```bash
node --experimental-strip-types apps/web/src/lib/anna-naming/__tests__/concepts.test.mjs
node --experimental-strip-types apps/web/src/lib/anna-naming/__tests__/phases.test.mjs
```

Both must print `PASS: ...`.

## What lives elsewhere (out of scope for this lib)

- The 19 published quantities consistency check lives at __.
- The visual primitives (`TypedText`, `TechDetail` etc.) live at `apps/web/src/components/evidence/lab-primitives/`.
