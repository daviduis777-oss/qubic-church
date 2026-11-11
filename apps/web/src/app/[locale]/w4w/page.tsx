import type { Metadata } from 'next'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { bppFonts } from '@/components/bpp/fonts'
import { SITE_URL } from '@/lib/books'

/*
 * W4W holding page. Act I is frozen on archive/w4w-act1; what opens first is Stage 0, announced separately.
 * Until then this page says only that: no dates, no details of what Stage 0 is.
 */

const DESC = 'W4W, the Web4 world of Qubic Church, is at Stage 0. It opens soon.'

export const metadata: Metadata = {
  title: { absolute: 'W4W · Stage 0 · Qubic Church' },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/w4w` },
  openGraph: { type: 'website', title: 'W4W · Stage 0', description: DESC, url: `${SITE_URL}/w4w` },
  robots: { index: false, follow: true },
}

const css = `
.w0{min-height:calc(100svh - 64px);display:grid;place-items:center;padding:96px 16px 64px;background:radial-gradient(60% 50% at 50% 42%,rgba(255,196,107,.10),transparent 70%),#07080b;color:#ece6da;font-family:var(--bpp-sans),system-ui,sans-serif;text-align:center}
.w0-in{max-width:560px}
.w0-mark{font-family:var(--bpp-eng),var(--bpp-sans),sans-serif;font-size:clamp(64px,16vw,132px);line-height:.9;letter-spacing:.02em;color:var(--color-bpp9000,#ffc46b);text-shadow:0 0 28px rgba(255,196,107,.35)}
.w0-stage{display:inline-flex;align-items:center;gap:10px;margin:22px 0 18px;padding:7px 14px;border:1px solid rgba(255,196,107,.35);border-radius:999px;font-size:14px;color:#ffe3b0}
.w0-dot{width:8px;height:8px;border-radius:50%;background:#ffc46b;box-shadow:0 0 10px #ffc46b;animation:w0p 2.4s ease-in-out infinite}
@keyframes w0p{50%{opacity:.35}}
.w0-h{font-size:clamp(22px,4.4vw,30px);font-weight:600;margin:0 0 10px}
.w0-p{color:#a9a294;font-size:16px;line-height:1.6;margin:0 auto 28px;max-width:44ch}
.w0-links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.w0-links a{padding:10px 18px;border-radius:999px;border:1px solid #2a2722;color:#ece6da;text-decoration:none;font-size:15px}
.w0-links a:first-child{background:#ffc46b;border-color:#ffc46b;color:#1a1408;font-weight:600}
.w0-links a:focus-visible{outline:2px solid #ffe3b0;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.w0-dot{animation:none}}
`

export default async function W4WStage0({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <main className={`w0 ${bppFonts}`}>
      <style>{css}</style>
      <div className="w0-in">
        <div className="w0-mark">W4W</div>
        <div className="w0-stage">
          <span aria-hidden className="w0-dot" />
          Stage 0
        </div>
        <h1 className="w0-h">We are at stage zero.</h1>
        <p className="w0-p">The world is being built. It opens soon, and we will announce it here and on X first.</p>
        <div className="w0-links">
          <Link href="/bpp9000">Watch BPP-9000</Link>
          <Link href="/about#w4w">What W4W is</Link>
        </div>
      </div>
    </main>
  )
}
