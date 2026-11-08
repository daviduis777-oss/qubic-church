/**
 * SiteGlass: the site's background in Aigarth's "vacuum tubes" scheme (CfB, 26.08.2026), as approved on BPP-9000.
 * The page is the dark room behind a tube: cold blue glass light falls from the upper right, a soft violet
 * patch sits low on the left, a faint blue floor along the bottom. The warm filament is the gold UI itself,
 * so black stays black and gold stays gold. Pure CSS, fixed, no motion: cheap on phones.
 */
export function SiteGlass() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: [
          'radial-gradient(70vw 60vh at 82% 18%, rgba(46,86,255,.13), transparent 62%)',
          'radial-gradient(40vw 38vh at 88% 30%, rgba(70,110,255,.10), transparent 60%)',
          'radial-gradient(42vw 46vh at 6% 78%, rgba(124,72,255,.10), transparent 64%)',
          'radial-gradient(60vw 40vh at 50% 108%, rgba(46,86,255,.08), transparent 65%)',
          'radial-gradient(45vw 45vh at 8% 22%, rgba(232,145,46,.05), transparent 65%)',
          '#0B0A0E',
        ].join(', '),
      }}
    />
  )
}
