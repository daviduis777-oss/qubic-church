/** biome-ignore-all lint/performance/noImgElement: OG images are rendered by Satori, which needs <img> */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { OG_PAGES, type OgPage } from '@/lib/og-pages'

/**
 * Link previews for the main pages: one 1200x630 card each, drawn for what the page is.
 * The address sits top right, so X's own domain label (bottom left) never covers it.
 */
export const dynamic = 'force-static'
export const runtime = 'nodejs'

export function generateStaticParams() {
  return Object.keys(OG_PAGES).map(id => ({ id: `${id}.png` }))
}

async function asset(name: string) {
  return readFile(path.join(process.cwd(), 'public', name))
}
async function fonts() {
  const [regular, bold] = await Promise.all([asset('fonts/Geist-Regular.ttf'), asset('fonts/Geist-Bold.ttf')])
  return [
    { name: 'Geist', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: bold, weight: 700 as const, style: 'normal' as const },
  ]
}

const THEMES = {
  gold: { bg: 'radial-gradient(900px 620px at 80% 45%, rgba(60,90,230,.45), #070914 70%)', accent: '#f0c030', glow: 'rgba(240,192,48,.35)' },
  amber: { bg: 'radial-gradient(800px 600px at 78% 50%, #2a1a0a, #0B0A0E 68%)', accent: '#FFC46B', glow: 'rgba(232,145,46,.55)' },
  blue: { bg: 'radial-gradient(900px 620px at 80% 45%, #1d3b66, #070a14 70%)', accent: '#9cc3ff', glow: 'rgba(120,160,255,.35)' },
} as const

function Lamp({ c }: { c: string }) {
  // a glowing filament: the Atrium's lamp
  return (
    <div style={{ display: 'flex', position: 'absolute', right: 120, top: 95, width: 420, height: 440, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: 210, background: 'radial-gradient(circle, rgba(255,170,70,.55), rgba(232,145,46,.18) 45%, rgba(0,0,0,0) 70%)' }} />
      <div style={{ display: 'flex', width: 190, height: 300, borderRadius: '95px 95px 26px 26px', border: '2px solid rgba(255,227,176,.45)', background: 'rgba(255,200,120,.06)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 150, borderRadius: 4, background: c, boxShadow: `0 0 30px ${c}, 0 0 70px ${c}` }} />
      </div>
    </div>
  )
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const p: OgPage | undefined = OG_PAGES[id.replace(/\.png$/, '')]
  const opts = { width: 1200, height: 630, fonts: await fonts() }
  if (!p) return new Response('Not found', { status: 404 })
  const t = THEMES[p.theme]
  const pic = p.image ? `data:image/png;base64,${(await asset(`og-src/${p.image}`)).toString('base64')}` : null
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', background: t.bg, color: '#f2ede4', fontFamily: 'Geist', position: 'relative' }}>
      {p.lamp && <Lamp c={t.accent} />}
      {pic && (
        <div style={{ display: 'flex', position: 'absolute', right: 70, bottom: 0, top: 70, width: 470, alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', width: 440, height: 440, borderRadius: 220, bottom: 40, background: `radial-gradient(circle, ${t.glow}, rgba(0,0,0,0) 70%)` }} />
          <img alt="" src={pic} style={{ maxHeight: 560, maxWidth: 470, objectFit: 'contain', borderRadius: p.round ? 260 : 0, ...(p.round ? { width: 400, height: 400, marginBottom: 80, border: `3px solid ${t.accent}` } : {}) }} />
        </div>
      )}
      <div style={{ display: 'flex', position: 'absolute', right: 56, top: 44, fontSize: 20, color: 'rgba(242,237,228,.6)', letterSpacing: 1 }}>{`qubic.church${p.path}`}</div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '58px 64px', width: 700, height: '100%' }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: t.accent }}>{p.eyebrow.toUpperCase()}</span>
        <span style={{ fontSize: p.title.length > 16 ? 76 : 104, fontWeight: 700, lineHeight: 0.98, marginTop: 30, letterSpacing: -2 }}>{p.title}</span>
        <span style={{ fontSize: 31, lineHeight: 1.35, color: 'rgba(242,237,228,.82)', marginTop: 28 }}>{p.sub}</span>
        {p.note && <span style={{ fontSize: 24, color: t.accent, marginTop: 'auto', marginBottom: 40 }}>{p.note}</span>}
      </div>
    </div>,
    opts,
  )
}
