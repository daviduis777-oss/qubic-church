/**
 * True when a table cell reads as a single number: 1,218 · −11.95σ · ~5,000 ·
 * +3.0% · 90.46° · 0.028 · ~3 MB · 0/1000. Used to right-align numeric columns.
 */
const NUMERIC =
  /^[~≈<>≤≥±+\-−\s]*[$€]?\d[\d,.\s]*(?:e[+-]?\d+)?(?:\s*[/×x–-]\s*\d[\d,.]*)?\s*(?:%|σ|°|×|[A-Za-z]{1,3})?$/

export function isNumericCell(text: string): boolean {
  const t = text.trim()
  return t.length > 0 && t.length <= 24 && NUMERIC.test(t)
}
