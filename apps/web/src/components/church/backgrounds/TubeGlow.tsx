/**
 * TubeGlow: the homepage background in Aigarth's "vacuum tubes" scheme (CfB, 26.08.2026).
 * Two lights, as in a tube amplifier at night: tall cold glass glowing blue-violet, and a small hot filament
 * glowing orange inside it. Pure CSS, no canvas: cheap on phones, still under reduced motion.
 */
const TUBES = [
  // x, y, w, h in vw/vh (the glass box); fx, fy = filament centre inside it, in %; a = strength
  { x: 61, y: 4, w: 32, h: 96, fx: 52, fy: 84, a: 0.8, d: 0 },
  { x: -9, y: 46, w: 20, h: 70, fx: 50, fy: 84, a: 0.45, d: -6 },
] as const

export function TubeGlow() {
  return (
    <div aria-hidden className="tube-glow pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: '#06040c' }}>
      {TUBES.map((t, i) => (
        <div key={i} style={{ position: 'absolute', left: `${t.x}vw`, top: `${t.y}vh`, width: `${t.w}vw`, height: `${t.h}vh` }}>
          {/* the glass: a tall cold glow */}
          <div
            className="tube-glass"
            style={{
              position: 'absolute',
              inset: 0,
              animationDelay: `${t.d}s`,
              background: `radial-gradient(50% 50% at 50% 50%, transparent 58%, rgba(150,120,255,${t.a * 0.32}) 66%, transparent 72%), radial-gradient(50% 50% at 50% 50%, rgba(92,62,255,${t.a}) 0%, rgba(70,44,210,${t.a * 0.5}) 34%, rgba(110,46,190,${t.a * 0.14}) 56%, transparent 66%)`,
              filter: 'blur(14px)',
            }}
          />
          {/* the filament: a small hot core low in the glass */}
          <div
            className="tube-filament"
            style={{
              position: 'absolute',
              left: `${t.fx}%`,
              top: `${t.fy}%`,
              width: '46%',
              height: '16%',
              transform: 'translate(-50%, -50%)',
              animationDelay: `${t.d * 0.7}s`,
              background: `radial-gradient(50% 50% at 50% 50%, rgba(255,222,160,${Math.min(1, t.a * 1.8)}) 0%, rgba(255,138,30,${t.a * 1.3}) 28%, rgba(255,110,20,${t.a * 0.45}) 56%, transparent 74%)`,
              filter: 'blur(10px)',
            }}
          />
        </div>
      ))}
      {/* the glass light falling on the table: a faint violet floor, warmer at the edge */}
      <div
        style={{
          position: 'absolute',
          inset: 'auto 0 0 0',
          height: '38vh',
          background: 'radial-gradient(60% 100% at 75% 100%, rgba(80,50,220,0.12), transparent 70%), radial-gradient(40% 70% at 22% 100%, rgba(255,140,40,0.07), transparent 70%)',
        }}
      />
      {/* a fine vignette so text sits on black */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent 22%, transparent 70%, rgba(0,0,0,0.5)), linear-gradient(to right, rgba(0,0,0,0.35), transparent 45%)' }} />
      <style>{`
@keyframes tube-breathe { 0%, 100% { opacity: .82 } 50% { opacity: 1 } }
@keyframes tube-flicker { 0%, 100% { opacity: .9 } 37% { opacity: 1 } 41% { opacity: .78 } 44% { opacity: .96 } 70% { opacity: .86 } }
.tube-glow .tube-glass { animation: tube-breathe 11s ease-in-out infinite }
.tube-glow .tube-filament { animation: tube-flicker 7s ease-in-out infinite }
@media (prefers-reduced-motion: reduce) { .tube-glow * { animation: none !important } }
`}</style>
    </div>
  )
}
