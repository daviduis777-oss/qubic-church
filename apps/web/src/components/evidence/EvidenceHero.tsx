// Static hero - fixed background grid that stays visible while scrolling
export function EvidenceHero() {
  return (
    <>
      {/* Fixed background glow - stays visible on entire page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#D4AF37]/5 blur-3xl" />
      </div>

      {/* Hero content */}
      <section className="relative flex flex-col items-center justify-center py-20 md:py-28 text-center">
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          {/* Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 text-sm font-mono font-medium tracking-widest text-[#D4AF37]/70 uppercase">
              <span className="inline-flex h-2 w-2 bg-[#D4AF37]/60" />
              Research Archive
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-wider mb-6">
            <span className="text-[#D4AF37]">
              Cryptographic
            </span>
            <br />
            <span className="text-white/90">
              Research Data
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-white/40 max-w-3xl mx-auto mb-10 leading-relaxed">
            Research datasets including the <span className="font-mono text-[#D4AF37]/70">128x128</span> Anna Matrix,
            derived addresses, and interactive 3D analysis tools.
          </p>
        </div>
      </section>
    </>
  )
}
