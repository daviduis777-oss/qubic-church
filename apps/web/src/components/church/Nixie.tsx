import { nx } from '@/components/bpp/fonts'

/**
 * Nixie tubes: Aigarth's "vacuum tubes" in one element. Each digit burns orange inside its own glass, the other
 * nine cathodes stand behind it unlit, a hex mesh sits in front, and the glass glows blue at its base.
 * Pure CSS, server-safe. `text` may hold digits, ':' (two neon dots) and anything else (shown as a plain tube).
 */
const FONT = nx.style.fontFamily
const MESH = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="17.32"><path d="M5 0l5 2.887v5.773L5 11.547 0 8.66V2.887z M0 14.434h0 M5 11.547v5.773" fill="none" stroke="rgba(190,170,150,0.22)" stroke-width="0.6"/></svg>',
)}")`

export function NixieTube({ ch, h }: { ch: string; h: number }) {
  const w = Math.round(h * 0.62)
  const fs = Math.round(h * 0.7)
  const lit = /\d/.test(ch)
  return (
    <span
      aria-hidden
      style={{
        position: 'relative',
        display: 'inline-block',
        width: w,
        height: h,
        borderRadius: `${w / 2}px ${w / 2}px ${h * 0.07}px ${h * 0.07}px`,
        background:
          'linear-gradient(90deg, rgba(255,255,255,.07), rgba(255,255,255,.015) 30%, rgba(255,255,255,.015) 70%, rgba(255,255,255,.06)), radial-gradient(70% 30% at 50% 100%, rgba(70,120,255,.55), rgba(70,120,255,0) 100%), #07060b',
        boxShadow:
          'inset 0 0 0 1px rgba(200,215,255,.20), inset 0 -10px 24px -8px rgba(80,140,255,.65), 0 14px 34px -14px rgba(70,120,255,.85), 0 0 26px -10px rgba(255,140,50,.5)',
        overflow: 'hidden',
        flex: 'none',
      }}
    >
      {/* the other cathodes, unlit, stacked behind */}
      {lit &&
        ['0', '8', '3', '6'].map(g => (
          <span
            key={g}
            style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: FONT, fontWeight: 300, fontSize: fs, lineHeight: 1, color: 'transparent', WebkitTextStroke: '1px rgba(190,160,130,.13)' }}
          >
            {g}
          </span>
        ))}
      {/* the lit cathode */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: fs,
          lineHeight: 1,
          color: '#ffd9a8',
          textShadow: '0 0 2px #ffb066, 0 0 6px #ff8a2a, 0 0 16px rgba(255,110,20,.85), 0 0 34px rgba(255,90,10,.5)',
        }}
      >
        {ch}
      </span>
      {/* the mesh in front */}
      <span style={{ position: 'absolute', inset: '10% 8% 14%', backgroundImage: MESH, backgroundSize: `${Math.max(6, h * 0.08)}px auto`, opacity: 0.9, borderRadius: 4 }} />
      {/* the glass: a cold highlight down the left side and a shine at the dome */}
      <span style={{ position: 'absolute', left: '12%', top: '9%', width: '9%', height: '70%', borderRadius: 99, background: 'linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,0))' }} />
      <span style={{ position: 'absolute', left: '20%', right: '20%', top: '3%', height: '6%', borderRadius: 99, background: 'radial-gradient(closest-side, rgba(255,255,255,.35), transparent)' }} />
    </span>
  )
}

/** Two neon dots between tube groups. */
function NixieColon({ h }: { h: number }) {
  const d = Math.max(4, Math.round(h * 0.07))
  const dot = { width: d, height: d, borderRadius: '50%', background: '#ffb066', boxShadow: '0 0 6px #ff8a2a, 0 0 14px rgba(255,110,20,.7), 0 0 22px rgba(70,120,255,.6)' }
  return (
    <span aria-hidden style={{ display: 'inline-flex', flexDirection: 'column', justifyContent: 'center', gap: h * 0.22, height: h, padding: `0 ${Math.round(h * 0.08)}px` }}>
      <span style={dot} />
      <span style={dot} />
    </span>
  )
}

export function NixieRow({ text, h, gap = 4, label }: { text: string; h: number; gap?: number; label?: string }) {
  return (
    <span aria-label={label ?? text} role="img" style={{ display: 'inline-flex', alignItems: 'flex-end', gap }}>
      {[...text].map((c, i) => (c === ':' ? <NixieColon h={h} key={i} /> : <NixieTube ch={c} h={h} key={i} />))}
    </span>
  )
}
