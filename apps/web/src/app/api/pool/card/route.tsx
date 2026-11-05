import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { haloSvg, svgUri } from '@/components/pool/maria/halo-svg'
import { cardSecret, signCard, verifyCard } from '@/lib/pool/card-sign'
import { POOL, RIG } from '@/lib/pool/config'
import { epochAt, formatLeft } from '@/lib/pool/epoch'
import { poolAllowed, poolPublic } from '@/lib/pool/gate'
import { fmtRate } from '@/lib/pool/measure'
import { shareLink } from '@/lib/pool/share'
import { CARD_SIZE, type CardData, type CardFormat, checkCard, fmtCost, fmtInt, fmtUpShort, percentileLine, type RigStatus, SOURCE_LABEL, STATUS_TITLE, shortWorker } from '@/lib/pool/rig'

/**
 * The My rig share card. POST: check the numbers and sign them (nothing is stored). GET ?t=<token>&f=story|x:
 * verify the signature and the expiry, then draw the PNG (1080x1350 or 1200x675). Behind the pool gate.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404, headers })

export async function POST(req: Request) {
  if (!(await poolAllowed(req))) return notFound()
  const secret = cardSecret()
  if (!secret) return NextResponse.json({ ok: false, error: 'Cards are not set up on this server.' }, { status: 503, headers })
  const body = (await req.json().catch(() => null)) as { card?: unknown } | null
  const c = checkCard(body?.card)
  if (!c.ok) return NextResponse.json({ ok: false, error: c.error }, { status: 422, headers })
  const { token, exp } = signCard(c.value, secret)
  const url = (f: CardFormat) => `/api/pool/card?f=${f}&t=${encodeURIComponent(token)}`
  // the link the card prints and the X post carries: the field guide until the pool page is public
  return NextResponse.json({ ok: true, story: url('story'), x: url('x'), exp, ttl: RIG.cardTtlS, link: shareLink(poolPublic()) }, { headers })
}

/* ---------------- drawing ---------------- */

const GOLD = '#FECE34'
const GOLD_HI = '#FFE77C'
const BONE = '#FAFAFA'
const FOG = '#B7B7B7'
const MUTED = '#8C8C8C'
const CORAL = '#F66D67'
const TONE: Record<RigStatus, string> = { waiting: MUTED, mining: GOLD, warming: GOLD_HI, early: GOLD, idle: FOG, 'no-signal': MUTED, look: CORAL }

let fontCache: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 600; style: 'normal' | 'italic' }[]> | null = null
function fonts() {
  fontCache ??= (async () => {
    const dir = path.join(process.cwd(), 'public', 'fonts')
    const f = (n: string) => readFile(path.join(dir, n))
    const [sans, sansMed, sansSemi, mono, monoSemi, serif] = await Promise.all([
      f('Geist-Regular.ttf'),
      f('Geist-Medium.ttf'),
      f('Geist-SemiBold.ttf'),
      f('GeistMono-Medium.ttf'),
      f('GeistMono-SemiBold.ttf'),
      f('InstrumentSerif-Italic.woff'),
    ])
    return [
      { name: 'Geist', data: sans, weight: 400 as const, style: 'normal' as const },
      { name: 'Geist', data: sansMed, weight: 500 as const, style: 'normal' as const },
      { name: 'Geist', data: sansSemi, weight: 600 as const, style: 'normal' as const },
      { name: 'Geist Mono', data: mono, weight: 500 as const, style: 'normal' as const },
      { name: 'Geist Mono', data: monoSemi, weight: 600 as const, style: 'normal' as const },
      { name: 'Instrument Serif', data: serif, weight: 400 as const, style: 'italic' as const },
    ]
  })()
  return fontCache
}

let faceCache: Promise<string> | null = null
const faceUri = () => {
  faceCache ??= readFile(path.join(process.cwd(), 'public', 'pool', 'maria-256.jpg')).then(b => `data:image/jpeg;base64,${b.toString('base64')}`)
  return faceCache
}

/** Mono digits are about 0.6 em wide: shrink a long number so it fits its column. */
const fit = (text: string, width: number, max: number) => Math.floor(Math.min(max, width / (Math.max(3, text.length) * 0.61)))

function Halo({ size, face, src }: { size: number; face: number; src: string }) {
  const h = haloSvg(size, face)
  return (
    <div style={{ position: 'relative', display: 'flex', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* biome-ignore lint/performance/noImgElement: next/og draws plain img */}
      <img alt="" height={size} src={svgUri(h.back)} style={{ position: 'absolute', left: 0, top: 0 }} width={size} />
      {/* biome-ignore lint/performance/noImgElement: next/og draws plain img */}
      <img
        alt=""
        height={face}
        src={src}
        style={{ borderRadius: face, boxShadow: `0 0 0 ${Math.round(face / 90)}px rgba(254,206,52,0.6), 0 0 ${Math.round(face / 4)}px rgba(254,206,52,0.22)` }}
        width={face}
      />
      {/* biome-ignore lint/performance/noImgElement: next/og draws plain img */}
      <img alt="" height={size} src={svgUri(h.front)} style={{ position: 'absolute', left: 0, top: 0 }} width={size} />
    </div>
  )
}

function Stat({ value, label, sub, width, max, size }: { value: string; label: string; sub?: string; width: number; max: number; size: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: max, fontFamily: 'Geist Mono', fontWeight: 600, fontSize: size, lineHeight: 1, color: GOLD, letterSpacing: -2 }}>{value}</div>
      <div style={{ display: 'flex', marginTop: Math.round(max * 0.2), fontFamily: 'Geist', fontWeight: 600, fontSize: Math.round(max * 0.25), letterSpacing: 3, color: BONE }}>{label}</div>
      <div style={{ display: 'flex', marginTop: 6, fontFamily: 'Geist', fontSize: Math.round(max * 0.24), color: FOG, height: Math.round(max * 0.3) }}>{sub ?? ''}</div>
    </div>
  )
}

function Badge({ c, size }: { c: CardData; size: number }) {
  const demo = c.src === 'demo'
  return (
    <div
      style={{
        display: 'flex',
        padding: `${Math.round(size * 0.3)}px ${Math.round(size * 0.7)}px`,
        borderRadius: 999,
        fontFamily: 'Geist Mono',
        fontWeight: 600,
        fontSize: size,
        letterSpacing: 2,
        color: demo ? '#000' : GOLD,
        background: demo ? GOLD : 'rgba(254,206,52,0.08)',
        boxShadow: demo ? 'none' : 'inset 0 0 0 1.5px rgba(254,206,52,0.4)',
      }}
    >
      {demo ? 'DEMO · SAMPLE DATA' : SOURCE_LABEL[c.src].toUpperCase()}
    </div>
  )
}

function StatusChip({ c, size }: { c: CardData; size: number }) {
  const tone = TONE[c.st]
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'Geist', fontWeight: 600, fontSize: size, color: tone, letterSpacing: 0.5 }}>
      <div style={{ display: 'flex', width: size * 0.55, height: size * 0.55, borderRadius: size, background: tone, boxShadow: `0 0 ${size}px ${tone}`, marginRight: size * 0.5 }} />
      {STATUS_TITLE[c.st]}
    </div>
  )
}

function EpochStrip({ c, width, size }: { c: CardData; width: number; size: number }) {
  const e = epochAt()
  const same = e.epoch === c.ep
  const elapsed = Date.now() - e.start.getTime()
  const frac = same ? Math.min(1, Math.max(0, elapsed / (e.end.getTime() - e.start.getTime()))) : 1
  const right = same ? `day ${Math.min(7, Math.floor(elapsed / 86_400_000) + 1)} of 7 · ${formatLeft(e.msLeft)} left` : 'epoch closed'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: 'Geist', fontSize: size, color: FOG }}>
        <span style={{ fontWeight: 600, letterSpacing: 2, color: BONE }}>{`EPOCH ${c.ep}`}</span>
        <span>{right}</span>
      </div>
      <div style={{ display: 'flex', marginTop: size * 0.5, width, height: Math.max(4, size * 0.28), borderRadius: 99, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', width: Math.max(6, width * frac), height: '100%', borderRadius: 99, background: `linear-gradient(90deg, #B18406, ${GOLD} 70%, ${GOLD_HI})` }} />
      </div>
    </div>
  )
}

const Mark = ({ size }: { size: number }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: 'Geist', fontSize: size, color: FOG }}>
    <span style={{ fontWeight: 600, color: BONE }}>{POOL.name}</span>
    <span style={{ margin: `0 ${Math.round(size * 0.5)}px`, color: MUTED }}>·</span>
    <span style={{ fontFamily: 'Geist Mono', fontWeight: 500, color: GOLD }}>{shareLink(poolPublic()).text}</span>
  </div>
)

/** The three numbers share one size: the largest that fits the longest of them. */
const statSize = (c: CardData, width: number, max: number) => Math.min(...[fmtInt(c.sol), fmtRate(c.rate), fmtUpShort(c.up)].map(v => fit(v, width - 16, max)))
const solSub = (c: CardData) => (c.src === 'log' ? 'in this log' : 'this epoch')

function Watermark({ w, h }: { w: number; h: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', fontFamily: 'Geist', fontWeight: 600, fontSize: Math.round(w * 0.3), letterSpacing: 20, color: 'rgba(254,206,52,0.07)', transform: 'rotate(-24deg)' }}>DEMO</div>
    </div>
  )
}

function Extras({ c, size, center }: { c: CardData; size: number; center?: boolean }) {
  if (c.pct === undefined && c.cost === undefined) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: center ? 'center' : 'flex-start' }}>
      {c.pct !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', padding: `${size * 0.4}px ${size * 0.9}px`, borderRadius: 999, background: 'rgba(254,206,52,0.08)', boxShadow: 'inset 0 0 0 1.5px rgba(254,206,52,0.32)', fontFamily: 'Geist', fontWeight: 500, fontSize: size, color: BONE }}>
          {percentileLine(c.pct)}
          <span style={{ marginLeft: size * 0.5, fontFamily: 'Geist Mono', fontSize: size * 0.8, color: FOG }}>{`n ${c.pn}`}</span>
        </div>
      )}
      {c.cost !== undefined && (
        <div style={{ display: 'flex', marginTop: c.pct !== undefined ? size * 0.6 : 0, fontFamily: 'Geist', fontSize: size * 0.86, color: FOG }}>
          {'My own cost per solution: '}
          <span style={{ marginLeft: 8, fontFamily: 'Geist Mono', fontWeight: 600, color: BONE }}>{`${fmtCost(c.cost)} USD`}</span>
        </div>
      )}
    </div>
  )
}

const BG = 'radial-gradient(70% 46% at 50% 26%, rgba(254,206,52,0.13) 0%, rgba(254,206,52,0.04) 45%, rgba(0,0,0,0) 72%), #000'

function Story({ c, face }: { c: CardData; face: string }) {
  const { width: W, height: H } = CARD_SIZE.story
  const colW = 300
  const size = statSize(c, colW, 96)
  return (
    <div style={{ position: 'relative', width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', background: BG, padding: '64px 72px 56px', color: BONE }}>
      {c.src === 'demo' && <Watermark h={H} w={W} />}
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <StatusChip c={c} size={30} />
        <Badge c={c} size={22} />
      </div>
      <div style={{ display: 'flex', marginTop: 6 }}>
        <Halo face={196} size={560} src={face} />
      </div>
      <div style={{ display: 'flex', marginTop: -18, fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 104, lineHeight: 1, color: BONE, letterSpacing: -1 }}>{shortWorker(c.w)}</div>
      <div style={{ display: 'flex', marginTop: 16, fontFamily: 'Geist', fontSize: 32, color: FOG }}>{c.hw}</div>
      <div style={{ display: 'flex', flex: 1, minHeight: 36 }} />
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Stat label="SOLUTIONS" max={96} size={size} sub={solSub(c)} value={fmtInt(c.sol)} width={colW} />
        <div style={{ display: 'flex', width: 1.5, height: 150, background: 'rgba(255,255,255,0.12)', marginTop: 4 }} />
        <Stat label="SOL/H" max={96} size={size} sub={c.pc !== undefined ? `${fmtRate(c.pc)} per card` : undefined} value={fmtRate(c.rate)} width={colW} />
        <div style={{ display: 'flex', width: 1.5, height: 150, background: 'rgba(255,255,255,0.12)', marginTop: 4 }} />
        <Stat label="UPTIME" max={96} size={size} sub="this epoch" value={fmtUpShort(c.up)} width={colW} />
      </div>
      {(c.pct !== undefined || c.cost !== undefined) && (
        <div style={{ display: 'flex', marginTop: 30 }}>
          <Extras c={c} center size={30} />
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, minHeight: 36 }} />
      <EpochStrip c={c} size={25} width={W - 144} />
      <div style={{ display: 'flex', marginTop: 30 }}>
        <Mark size={25} />
      </div>
    </div>
  )
}

function Wide({ c, face }: { c: CardData; face: string }) {
  const { width: W, height: H } = CARD_SIZE.x
  const right = 620
  const size = statSize(c, 196, 70)
  return (
    <div style={{ position: 'relative', width: W, height: H, display: 'flex', alignItems: 'center', background: 'radial-gradient(48% 70% at 24% 50%, rgba(254,206,52,0.13) 0%, rgba(254,206,52,0.035) 50%, rgba(0,0,0,0) 76%), #000', padding: '0 64px 0 36px', color: BONE }}>
      {c.src === 'demo' && <Watermark h={H} w={W} />}
      <Halo face={160} size={480} src={face} />
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 24, width: right, height: H, padding: '50px 0 42px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StatusChip c={c} size={24} />
          <Badge c={c} size={17} />
        </div>
        <div style={{ display: 'flex', marginTop: 26, fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 84, lineHeight: 1, letterSpacing: -1 }}>{shortWorker(c.w)}</div>
        <div style={{ display: 'flex', marginTop: 12, fontFamily: 'Geist', fontSize: 25, color: FOG }}>{c.hw}</div>
        <div style={{ display: 'flex', marginTop: 34, justifyContent: 'space-between' }}>
          <Stat label="SOLUTIONS" max={70} size={size} sub={solSub(c)} value={fmtInt(c.sol)} width={196} />
          <Stat label="SOL/H" max={70} size={size} sub={c.pc !== undefined ? `${fmtRate(c.pc)} per card` : undefined} value={fmtRate(c.rate)} width={196} />
          <Stat label="UPTIME" max={70} size={size} sub="this epoch" value={fmtUpShort(c.up)} width={196} />
        </div>
        <div style={{ display: 'flex', marginTop: 14 }}>
          <Extras c={c} size={21} />
        </div>
        <div style={{ display: 'flex', flex: 1 }} />
        <EpochStrip c={c} size={19} width={right} />
        <div style={{ display: 'flex', marginTop: 20 }}>
          <Mark size={19} />
        </div>
      </div>
    </div>
  )
}

export async function GET(req: Request) {
  if (!(await poolAllowed(req))) return notFound()
  const secret = cardSecret()
  const u = new URL(req.url)
  const c = secret ? verifyCard(u.searchParams.get('t'), secret) : null
  if (!c) return NextResponse.json({ error: 'This card link is not valid or has expired. Make a new one in My rig.' }, { status: 410, headers })
  const f: CardFormat = u.searchParams.get('f') === 'x' ? 'x' : 'story'
  const [face, fontList] = await Promise.all([faceUri(), fonts()])
  const name = `qubic-church-pool-${shortWorker(c.w, 40).replace(/[^A-Za-z0-9._-]/g, '')}-${f}.png`
  return new ImageResponse(f === 'x' ? <Wide c={c} face={face} /> : <Story c={c} face={face} />, {
    ...CARD_SIZE[f],
    fonts: fontList,
    headers: { 'Cache-Control': `private, max-age=${RIG.cardTtlS}`, 'X-Robots-Tag': 'noindex, nofollow', 'Content-Disposition': `inline; filename="${name}"` },
  })
}
