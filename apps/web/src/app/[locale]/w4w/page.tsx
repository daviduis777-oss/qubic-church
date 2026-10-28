import type { Metadata } from 'next'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { bppFonts } from '@/components/bpp/fonts'
import { W4WFrost, W4WSnow } from '@/components/w4w/W4WCold'
import { W4WCountdown } from '@/components/w4w/W4WCountdown'
import { W4WGate } from '@/components/w4w/W4WGate'
import { getSession } from '@/lib/forum/auth'
import { SITE_URL } from '@/lib/books'
import { accessOf } from '@/lib/w4w/access'

export const dynamic = 'force-dynamic'

/** Stage 1 opens with the Qubic epoch change on Wednesday 11 November 2026. */
const LAUNCH = '2026-11-11T12:00:00Z'
const DESC = 'The cold came and never left. An expedition found a machine frozen in the ice, and someone asleep inside it. W4W is a Web4 world survival: alone you freeze, together you might wake her. Live 11.11.2026.'

export const metadata: Metadata = {
  title: { absolute: 'W4W: The Long Cold · live 11.11.2026' },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/w4w` },
  openGraph: { type: 'website', title: 'W4W: The Long Cold', description: DESC, url: `${SITE_URL}/w4w`, images: [{ url: `${SITE_URL}/w4w-assets/og-w4w.jpg`, width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: 'W4W: The Long Cold', description: DESC, images: [`${SITE_URL}/w4w-assets/og-w4w.jpg`] },
}

const css = `
/* cold is the enemy (blue, snow, frost); the only warm light is the tube glow of energy */
.w4w{--bg:#06080c;clip-path:inset(0);--ink:#e8edf4;--mute:#8d97a7;--frost:#a6e6ff;--warm:#ffb35a;--line:#1c222c;background:var(--bg);color:var(--ink);font-family:var(--bpp-sans),system-ui,sans-serif;overflow:hidden;position:relative}
.w4w *{box-sizing:border-box}
.w4w::after{content:"";position:fixed;inset:0;pointer-events:none;opacity:.07;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.w4w-hero{isolation:isolate;position:relative;min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);align-items:center;max-width:1360px;margin:0 auto;padding:96px clamp(16px,4vw,48px) 48px;gap:clamp(16px,3vw,48px)}
.w4w-art{position:relative;aspect-ratio:1;width:100%;max-width:680px;justify-self:end}
.w4w-art img{width:100%;height:100%;object-fit:cover;display:block;-webkit-mask-image:radial-gradient(closest-side,#000 72%,transparent 100%);mask-image:radial-gradient(closest-side,#000 72%,transparent 100%)}
.w4w-art::before{content:"";position:absolute;inset:12%;background:radial-gradient(circle at 60% 50%,#7fd8ff2e,transparent 65%);filter:blur(30px);z-index:-1}
.w4w-copy{position:relative;z-index:3}
.w4w-mark{font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:clamp(88px,13vw,184px);line-height:.8;letter-spacing:.02em;margin:0;color:var(--ink);text-shadow:0 0 40px #a6e6ff33}
.w4w-sub{font-family:var(--bpp-eng),sans-serif;font-size:clamp(14px,1.6vw,18px);letter-spacing:.32em;margin:18px 0 0;color:var(--frost)}
.w4w-pitch{font-size:clamp(17px,1.7vw,20px);line-height:1.55;color:#c9d2de;margin:28px 0 0;max-width:30ch}
.w4w-when{margin:40px 0 0;display:grid;gap:14px}
.w4w-date{font-size:15px;color:var(--mute);margin:0}
.w4w-date b{color:var(--warm);font-weight:600;letter-spacing:.02em}
.w4w-count{display:flex;gap:10px;min-height:76px}
.w4w-cell{position:relative;border:1px solid #3a2616;border-radius:22px 22px 10px 10px;padding:14px 16px 10px;min-width:88px;text-align:center;background:radial-gradient(120% 90% at 50% 40%,#2a1607 0%,#120b07 60%,#0a0807 100%);box-shadow:inset 0 0 18px #ff7a1a22,0 0 30px #ff7a1a14}
.w4w-cell::before{content:"";position:absolute;inset:6px 8px 26px;border-radius:16px 16px 4px 4px;background:repeating-linear-gradient(90deg,#ffffff07 0 1px,transparent 1px 5px),repeating-linear-gradient(0deg,#ffffff06 0 1px,transparent 1px 5px);pointer-events:none}
.w4w-cell::after{content:"";position:absolute;left:12%;right:55%;top:5px;height:22%;border-radius:20px;background:linear-gradient(#ffffff1c,#ffffff00);pointer-events:none}
.w4w-cell b{display:block;font-family:var(--bpp-nx),sans-serif;font-weight:400;font-size:44px;line-height:1;color:#ffc27a;font-variant-numeric:tabular-nums;text-shadow:0 0 4px #ff9a3c,0 0 14px #ff7a1acc,0 0 34px #ff6a0077}
.w4w-cell span{display:block;margin-top:6px;font-size:12px;color:#a8835e}
.w4w-snow{position:fixed;inset:0;width:100vw;height:100vh;z-index:2;pointer-events:none}
.w4w-wisps{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.w4w-wisps i{position:absolute;border-radius:50%;opacity:.55;will-change:transform}
.w4w-wisps i:nth-child(1){width:46vw;height:22vw;left:38%;top:18%;background:radial-gradient(closest-side,#5fc4ff30,transparent 70%);animation:w4w-drift 26s ease-in-out infinite alternate}
.w4w-wisps i:nth-child(2){width:38vw;height:16vw;left:52%;top:58%;background:radial-gradient(closest-side,#9fe2ff26,transparent 70%);animation:w4w-drift 34s ease-in-out -9s infinite alternate-reverse}
.w4w-wisps i:nth-child(3){width:52vw;height:20vw;left:-8%;top:62%;background:radial-gradient(closest-side,#3f8fd82a,transparent 70%);animation:w4w-drift 40s ease-in-out -16s infinite alternate}
@keyframes w4w-drift{0%{transform:translate3d(-6%,2%,0) scale(1) rotate(-4deg)}100%{transform:translate3d(8%,-4%,0) scale(1.18) rotate(5deg)}}
.w4w-frost{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:.75;background:radial-gradient(ellipse at 50% 45%,transparent 52%,#9fd8ff14 70%,#bfe8ff3d 100%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000' preserveAspectRatio='none'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.012 .04' numOctaves='5' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .8 0 0 0 0 .92 0 0 0 0 1 0 0 0 2.4 -1.25'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E");background-size:100% 100%;-webkit-mask-image:radial-gradient(ellipse at 50% 45%,transparent 48%,#000 96%);mask-image:radial-gradient(ellipse at 50% 45%,transparent 48%,#000 96%)}
.w4w-art img{filter:saturate(.9) contrast(1.04)}
.w4w-signal{position:relative;width:14px;height:14px;margin:0 auto 40px;border-radius:50%;background:#bfeaff;box-shadow:0 0 14px #7fd8ff,0 0 40px #4fb8ff88;opacity:.85}
.w4w-signal::before,.w4w-signal::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1px solid #9fdcff88;animation:w4w-ping 4.2s ease-out infinite}
.w4w-signal::after{animation-delay:2.1s}
@keyframes w4w-ping{0%{transform:scale(.6);opacity:.9}100%{transform:scale(6);opacity:0}}
.w4w-listen{font-size:15px;color:#9fdcff;margin:0 0 40px;letter-spacing:.02em}
@media (prefers-reduced-motion:reduce){.w4w-wisps i,.w4w-signal::before,.w4w-signal::after{animation:none}}
.w4w-live{font-family:var(--bpp-nx),sans-serif;font-size:36px;color:var(--warm)}
.w4w-lore{position:relative;max-width:680px;margin:0 auto;padding:40px clamp(16px,4vw,32px) 24px}
.w4w-lore h2{font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:clamp(44px,6vw,64px);line-height:1;margin:0 0 32px;color:var(--ink)}
.w4w-lore p{font-size:18px;line-height:1.7;color:#c3ccd8;margin:0 0 22px}
.w4w-lore .open{font-size:clamp(22px,2.6vw,28px);line-height:1.4;color:var(--ink)}
.w4w-lore .name{font-family:var(--bpp-nx),sans-serif;font-size:clamp(34px,4.4vw,48px);color:var(--frost);margin:36px 0;line-height:1;text-shadow:0 0 30px #a6e6ff55}
.w4w-lore .choice{border-left:2px solid var(--warm);padding-left:18px;color:var(--ink)}
.w4w-laws{max-width:1100px;margin:40px auto 0;padding:0 clamp(16px,4vw,32px);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(16px,2.5vw,32px)}
.w4w-law{border-top:1px solid var(--line);padding-top:20px}
.w4w-law h3{font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:28px;margin:0 0 10px;color:var(--ink)}
.w4w-law p{font-size:15.5px;line-height:1.6;color:var(--mute);margin:0}
.w4w-stage{max-width:1100px;margin:88px auto 0;padding:0 clamp(16px,4vw,32px)}
.w4w-track{display:flex;gap:6px;align-items:flex-end}
.w4w-track i{flex:1;height:10px;border-radius:2px;background:#151a22}
.w4w-track i:first-child{background:var(--frost);box-shadow:0 0 18px #a6e6ff88;height:14px}
.w4w-stage-row{display:flex;justify-content:space-between;gap:16px;margin-top:14px;font-size:14px;color:var(--mute)}
.w4w-stage-row b{color:var(--frost);font-weight:600}
.w4w-stage p{font-size:17px;line-height:1.65;color:#c3ccd8;max-width:640px;margin:28px 0 0}
.w4w-end{position:relative;z-index:5;max-width:680px;margin:96px auto 0;padding:0 clamp(16px,4vw,32px) 160px;text-align:center}
.w4w::before{content:"";position:absolute;left:0;right:0;bottom:0;height:220px;z-index:4;pointer-events:none;background:linear-gradient(to bottom,transparent,#101010 96%)}
.w4w-end .tag{font-family:var(--bpp-nx),sans-serif;font-size:clamp(30px,4vw,44px);line-height:1.15;margin:0;color:var(--ink)}
.w4w-word{display:block;font-family:var(--bpp-nx),sans-serif;font-weight:500;font-size:clamp(56px,9vw,112px);line-height:.9;letter-spacing:.01em;margin:0 0 18px;color:#c9d3df}
.w4w-word b{font-weight:500;color:var(--ink);text-shadow:0 0 18px #ffb35a88,0 0 50px #ff7a1a44}
.w4w-word b.f{color:#ffc27a}
.w4w-end .tag span{color:var(--warm)}
.w4w-acct{display:inline-block;margin-top:28px;font-size:14.5px;color:var(--mute);text-decoration:underline;text-underline-offset:4px}
.w4w-acct:hover,.w4w-acct:focus-visible{color:var(--ink)}
.w4w-gatebox{margin-top:36px}
.w4w-link{background:none;border:0;color:#b9c3d0;font:inherit;font-size:14px;text-decoration:underline;text-underline-offset:4px;cursor:pointer;padding:8px 0}
.w4w-panel{width:min(520px,100%);display:grid;gap:12px;text-align:left}
.w4w-note{font-size:14px;color:#c3ccd8;margin:0;line-height:1.55}
.w4w-row{display:flex;gap:8px}
.w4w-row input{flex:1;min-width:0;background:#0b0d12;border:1px solid #2a3240;border-radius:8px;color:var(--ink);padding:11px 12px;font:600 16px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase}
.w4w-row input:focus-visible,.w4w-row button:focus-visible{outline:2px solid var(--frost);outline-offset:1px}
.w4w-row button{background:var(--frost);color:#06121a;border:0;border-radius:8px;padding:0 16px;font:600 14px inherit;cursor:pointer}
.w4w-row button:disabled{opacity:.5;cursor:default}
.w4w-err{color:#ff9a7a;font-size:14px;margin:0}
.w4w-play{position:fixed;inset:0;z-index:100;background:#0B0A0E}
.w4w-play iframe{border:0;width:100%;height:100%;display:block}
@media (max-width:900px){
  .w4w-hero{grid-template-columns:1fr;padding-top:76px;min-height:0}
  .w4w-art{order:-1;justify-self:center;max-width:520px;margin-bottom:-24px}
  .w4w-pitch{max-width:none}
  .w4w-laws{grid-template-columns:1fr}
}
@media (max-width:420px){.w4w-cell{min-width:0;flex:1;padding:10px}.w4w-cell b{font-size:32px}}
`

export default async function W4WPage(props: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await props.params
  const sp = await props.searchParams
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

  // Testers reach the gate through a link they are given (/w4w?invite); everyone else sees the announcement.
  const gate = sp.invite !== undefined

  return (
    <main className={`w4w ${bppFonts}`}>
      <style>{css}</style>

      <W4WFrost />
      <section className="w4w-hero">
        <div aria-hidden className="w4w-wisps">
          <i />
          <i />
          <i />
        </div>
        <W4WSnow />
        <div className="w4w-copy">
          <h1 className="w4w-mark">W4W</h1>
          <p className="w4w-sub">THE LONG COLD</p>
          <p className="w4w-pitch">A frozen world. A machine in the ice. A town that lives only if it lives together.</p>
          <div className="w4w-when">
            <p className="w4w-date">
              Goes live <b>11.11.2026 · 12:00 UTC</b>, with the Qubic epoch change.
            </p>
            <W4WCountdown at={LAUNCH} />
          </div>
          {gate && (
            <div className="w4w-gatebox">
              <W4WGate name={user?.name ?? null} />
            </div>
          )}
        </div>
        <figure className="w4w-art" style={{ margin: 0 }}>
          <img alt="Anna, blue-skinned with glowing circuit lines on her face, holding a heavy glowing machine" height={1400} src="/w4w-assets/anna-cold.webp" srcSet="/w4w-assets/anna-cold-900.webp 900w, /w4w-assets/anna-cold.webp 1400w" sizes="(max-width: 900px) 92vw, 50vw" width={1400} />
        </figure>
      </section>

      <article className="w4w-lore">
        <h2>The cold came and never left.</h2>
        <p className="open">Seas froze where they stood. Cities went silent under the snow. The old world disappeared one winter at a time.</p>
        <p>Now everything comes down to two things: energy and heat. Every spark matters, and every night the cold takes a little more.</p>
        <p>Then a desperate expedition crawled back out of the ice. Few of them returned, with stories nobody believed. Deep in a glacier they had found something older than any map, and not made by any human hand.</p>
        <p>A machine.</p>
        <p>And inside it, someone was sleeping.</p>
        <p className="name">They named her Anna.</p>
        <p>The machine was never meant to keep one person alive. The ice around her does not answer to one fire. It answers to many. Signals travel through the frozen ground, and something beneath the surface is listening.</p>
        <p>So every survivor in Aigarth faces the same choice, every single night:</p>
        <p className="choice">Burn your heat to stay alive. Or give it to the ice.</p>
        <p>Alone, you last a few nights. Together, you might wake what sleeps.</p>
      </article>

      <section aria-label="How the town survives" className="w4w-laws">
        <div className="w4w-law">
          <h3>Heat is life</h3>
          <p>Your stove keeps you alive. What you can spare, you can give: to the fire on the plaza, to a neighbour, to the ice. Nothing is free when the world is frozen.</p>
        </div>
        <div className="w4w-law">
          <h3>No fire survives alone</h3>
          <p>A single flame cannot hold back an endless winter. The more of us keep the fire alive, the wider the ring of light. Too few, and the storm comes in.</p>
        </div>
        <div className="w4w-law">
          <h3>The cold remembers</h3>
          <p>Every gift and every silence goes into the Chronicle, chained so it cannot be rewritten. The world may forget your face. The record will not forget your name.</p>
        </div>
      </section>

      <section aria-label="Stages of the world" className="w4w-stage">
        <div aria-hidden className="w4w-track">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className="w4w-stage-row">
          <span>
            <b>Stage 1</b> · the thaw begins
          </span>
          <span>Stages after this: unknown</span>
        </div>
        <p>The old records speak of phases. The world passes through them the way a body passes through a fever. Each one ends. Each one is followed by something the records never name. Nobody wrote down what comes after the last.</p>
        <p>Perhaps the machine knows.</p>
      </section>

      <section className="w4w-end">
        <div aria-hidden className="w4w-signal" />
        <p className="w4w-listen">The first signal comes on 11.11.2026, when the epoch turns.</p>
        <p aria-label="W4W: Web4World, a survival" className="w4w-word">
          <b>W</b>eb<b className="f">4</b><b>W</b>orld
        </p>
        <p className="tag">
          <span>Survive together,</span> or not at all.
        </p>
        <Link className="w4w-acct" href="/account">
          One Qubic Church account, no personal data. How it works
        </Link>
      </section>
    </main>
  )
}
