import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { bppFonts } from '@/components/bpp/fonts'
import { W4WGate } from '@/components/w4w/W4WGate'
import { getSession } from '@/lib/forum/auth'
import { SITE_URL } from '@/lib/books'
import { accessOf } from '@/lib/w4w/access'

export const dynamic = 'force-dynamic'

const DESC = 'W4W: a town in the snow, kept warm by the people who live in it. Coming soon to Qubic Church.'

export const metadata: Metadata = {
  title: 'W4W · Soon',
  description: DESC,
  alternates: { canonical: `${SITE_URL}/w4w` },
  openGraph: { type: 'website', title: 'W4W', description: DESC, url: `${SITE_URL}/w4w` },
}

const css = `
.w4w{box-sizing:border-box;min-height:100vh;background:radial-gradient(120% 80% at 50% 110%,#3a1d0c 0%,#140d10 38%,#0B0A0E 70%);color:#FFE3B0;display:grid;place-items:center;padding:96px 16px 64px;font-family:var(--bpp-sans),system-ui,sans-serif;overflow:hidden;position:relative}
.w4w::before{content:"";position:absolute;inset:0;background-image:radial-gradient(1.4px 1.4px at 20% 30%,#cfe0ff88 50%,transparent 51%),radial-gradient(1.2px 1.2px at 70% 20%,#cfe0ff66 50%,transparent 51%),radial-gradient(1.6px 1.6px at 40% 70%,#cfe0ff55 50%,transparent 51%),radial-gradient(1.1px 1.1px at 85% 60%,#cfe0ff77 50%,transparent 51%),radial-gradient(1.3px 1.3px at 10% 80%,#cfe0ff55 50%,transparent 51%);background-size:340px 340px;animation:w4w-snow 26s linear infinite;pointer-events:none;opacity:.8}
@keyframes w4w-snow{to{background-position:60px 340px}}
@media (prefers-reduced-motion:reduce){.w4w::before{animation:none}}
.w4w-in{position:relative;text-align:center;max-width:560px;display:grid;justify-items:center;gap:18px}
.w4w-mark{font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:clamp(96px,22vw,200px);line-height:.82;letter-spacing:.04em;margin:0;color:#FFC46B;text-shadow:0 0 24px #E8912E88,0 0 80px #E8912E44}
.w4w-soon{font-family:var(--bpp-eng),sans-serif;font-size:clamp(13px,1.8vw,16px);letter-spacing:.5em;margin:0 0 0 .5em;color:#9fc3ff}
.w4w-line{font-size:16px;line-height:1.6;color:#d8c6a8;margin:8px 0 0;max-width:42ch}
.w4w-link{background:none;border:0;color:#b9a888;font:inherit;font-size:14px;text-decoration:underline;text-underline-offset:4px;cursor:pointer;margin-top:18px;padding:8px}
.w4w-link:hover,.w4w-link:focus-visible{color:#FFE3B0}
.w4w-panel{width:min(520px,calc(100vw - 32px));margin-top:18px;display:grid;gap:12px;text-align:left}
.w4w-note{font-size:14px;color:#cdbb9c;margin:0;line-height:1.55}
.w4w-row{display:flex;gap:8px}
.w4w-row input{flex:1;min-width:0;background:#0b0a0e;border:1px solid #4a3a2e;border-radius:8px;color:#FFE3B0;padding:11px 12px;font:600 16px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase}
.w4w-row input:focus-visible{outline:2px solid #E8912E;outline-offset:1px}
.w4w-row button{background:#E8912E;color:#1a1008;border:0;border-radius:8px;padding:0 16px;font:600 14px inherit;cursor:pointer}
.w4w-row button:disabled{opacity:.5;cursor:default}
.w4w-err{color:#ff9a7a;font-size:14px;margin:0}
.w4w-play{position:fixed;inset:0;z-index:100;background:#0B0A0E}
.w4w-play iframe{border:0;width:100%;height:100%;display:block}
`

export default async function W4WPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const user = await getSession()
  const acc = await accessOf(user)

  if (acc.player)
    return (
      <div className="w4w-play">
        <style>{css}</style>
        <iframe allow="fullscreen; clipboard-write" src="/api/w4w/play" title="W4W · Aigarth" />
      </div>
    )

  return (
    <main className={`w4w ${bppFonts}`}>
      <style>{css}</style>
      <div className="w4w-in">
        <h1 className="w4w-mark">W4W</h1>
        <p className="w4w-soon">SOON</p>
        <p className="w4w-line">A town in the snow, kept warm by the people who live in it.</p>
        <W4WGate name={user?.name ?? null} />
      </div>
    </main>
  )
}
