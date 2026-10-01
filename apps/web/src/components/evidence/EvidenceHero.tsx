export function EvidenceHero() {
  return (
    <section className="relative flex flex-col items-center justify-center pt-12 pb-8 md:pt-20 md:pb-10 text-center">
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <p className="eyebrow mb-4 text-gold">Research Lab</p>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold tracking-tight leading-tight mb-5 text-balance">
          <span className="text-gold">What the</span>
          <br />
          <span className="text-foreground">Anna Matrix is</span>
        </h1>

        <p className="text-base sm:text-lg text-fg-2 max-w-2xl mx-auto leading-relaxed text-pretty">
          A table of the Anna bot&apos;s answers, the Aigarth unit that fits it,
          and the open question of how it was trained. Every number below links
          to its method and data.
        </p>
      </div>
    </section>
  )
}
