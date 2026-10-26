/** biome-ignore-all lint/performance/noImgElement: OG images are rendered by Satori, which needs <img> */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { BOARDS, MEMBERS, TOPICS, memberByHandle, memberOf, type Member } from '@/lib/forum'
import { identicon } from '@/lib/forum/identicon'

/**
 * Link previews for The Crypt: one 1200x630 card per topic, per member and for the forum itself,
 * drawn like the forum page they lead to. /og/crypt/<id>.png where id is
 * t-<topic id>, p-<member handle>, b-<board id> or home.
 */
export const dynamic = 'force-static'
export const runtime = 'nodejs'

const SITE = 'https://qubic.church'

export function generateStaticParams() {
  return [
    { id: 'home.png' },
    ...BOARDS.map(b => ({ id: `b-${b.id}.png` })),
    ...TOPICS.map(t => ({ id: `t-${t.id}.png` })),
    ...MEMBERS.filter(m => m.handle).map(m => ({ id: `p-${m.handle.toLowerCase()}.png` })),
  ]
}

async function fonts() {
  const dir = path.join(process.cwd(), 'public', 'fonts')
  const [regular, bold] = await Promise.all([readFile(path.join(dir, 'Geist-Regular.ttf')), readFile(path.join(dir, 'Geist-Bold.ttf'))])
  return [
    { name: 'Geist', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: bold, weight: 700 as const, style: 'normal' as const },
  ]
}

/** The avatar as a data URI, fetched once; null when it cannot be had, so the card falls back to the identicon. */
async function picture(m?: Member): Promise<string | null> {
  if (!m?.avatar) return null
  const url = m.avatar.startsWith('http') ? m.avatar : `${SITE}${m.avatar}`
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) return null
    const type = r.headers.get('content-type') ?? 'image/jpeg'
    return `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`
  } catch {
    return null
  }
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s)

function Avatar({ m, pic, size }: { m?: Member; pic: string | null; size: number }) {
  if (pic) return <img alt="" height={size} src={pic} style={{ border: '2px solid #8a8a8a', objectFit: 'cover' }} width={size} />
  const { cells, color } = identicon(m?.identity ?? m?.handle ?? 'crypt')
  const cell = Math.floor(size / 7)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', width: size, height: size, padding: cell, background: '#f4f4f6', border: '2px solid #8a8a8a' }}>
      {cells.map((on, i) => (
        <div key={i} style={{ width: cell, height: cell, background: on ? color : 'transparent' }} />
      ))}
    </div>
  )
}

function Stars({ n }: { n: number }) {
  // Drawn, not typed: the star glyph is not in Geist and would need a font fetch at build time.
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: i < n ? '#d4a017' : '#c8c8c8' }} />
      ))}
    </div>
  )
}

function Frame({ crumb, cat, children }: { crumb: string; cat: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#e5e5e8', padding: 36, fontFamily: 'Geist' }}>
      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'baseline', gap: 20, background: '#476c8e', color: '#fff', padding: '18px 26px' }}>
        <span style={{ fontSize: 46, fontWeight: 700 }}>The Crypt</span>
        <span style={{ fontSize: 20, opacity: 0.85 }}>the forum of Qubic Church · est. 2026</span>
      </div>
      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', height: 46, background: '#c6d4e4', color: '#476c8e', padding: '0 26px', fontSize: 20, fontWeight: 700 }}>{crumb}</div>
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, marginTop: 18, background: '#ecedf3', border: '2px solid #c0c3cf' }}>
        <div style={{ display: 'flex', background: '#8fa8c2', color: '#fff', padding: '10px 22px', fontSize: 22, fontWeight: 700 }}>{clip(cat, 80)}</div>
        <div style={{ display: 'flex', flexGrow: 1, padding: '24px 28px', gap: 34 }}>{children}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 20, color: '#555' }}>
        <span>Write anything. No topic, no censorship.</span>
        <span style={{ color: '#476c8e', fontWeight: 700 }}>qubic.church/articles</span>
      </div>
    </div>
  )
}

function Postbit({ m, pic }: { m?: Member; pic: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: 220, gap: 8 }}>
      <span style={{ fontSize: 24, fontWeight: 700, color: '#476c8e' }}>{clip(m?.name ?? 'Member', 18)}</span>
      <Avatar m={m} pic={pic} size={160} />
      {m && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 20, color: m.role ? '#8b1a8b' : '#000', fontWeight: m.role ? 700 : 400 }}>{m.role ?? `${m.rank.name} · rank ${m.rank.level}`}</span>
          <Stars n={m.rank.level} />
          <span style={{ fontSize: 18, color: '#555' }}>{`Weight ${m.rank.level === 10 ? '∞' : m.weight} · Merit ${m.rank.level === 10 ? '∞' : m.merit}`}</span>
        </div>
      )}
    </div>
  )
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: raw } = await ctx.params
  const id = raw.replace(/\.png$/, '')
  const opts = { width: 1200, height: 630, fonts: await fonts() }

  if (id.startsWith('t-')) {
    const t = TOPICS.find(x => x.id === id.slice(2))
    if (t) {
      const m = memberOf(t.author)
      const board = BOARDS.find(b => b.id === t.board)?.name ?? 'The Crypt'
      return new ImageResponse(
        <Frame cat={`Topic: ${t.title}`} crumb={`The Crypt » ${board}`}>
          <Postbit m={m} pic={await picture(m)} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
            <span style={{ fontSize: t.title.length > 60 ? 40 : 50, fontWeight: 700, lineHeight: 1.1, color: '#111' }}>{clip(t.title, 110)}</span>
            <span style={{ fontSize: 20, color: '#555' }}>
              {`« on: ${t.dateLabel} » · by ${t.author}`}
            </span>
            <span style={{ fontSize: 24, lineHeight: 1.4, color: '#222' }}>{clip(t.summary, 230)}</span>
          </div>
        </Frame>,
        opts,
      )
    }
  }

  if (id.startsWith('p-')) {
    const m = memberByHandle(id.slice(2))
    if (m) {
      const posts = TOPICS.filter(t => t.author === m.name).slice(0, 3)
      return new ImageResponse(
        <Frame cat={`View the profile of ${m.name}`} crumb="The Crypt » Members">
          <Postbit m={m} pic={await picture(m)} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
            <span style={{ fontSize: 22, color: '#555' }}>Latest topics</span>
            {posts.map(t => (
              <span key={t.id} style={{ fontSize: 28, fontWeight: 700, color: '#476c8e' }}>
                {clip(t.title, 60)}
              </span>
            ))}
            {posts.length === 0 && <span style={{ fontSize: 26 }}>{m.activityLabel}: {m.activity}</span>}
          </div>
        </Frame>,
        opts,
      )
    }
  }

  const board = id.startsWith('b-') ? BOARDS.find(b => b.id === id.slice(2)) : undefined
  const list = (board ? TOPICS.filter(t => t.board === board.id) : TOPICS.filter(t => t.board !== 'founder')).slice(0, 5)
  return new ImageResponse(
    <Frame cat={board ? board.name : 'Recent posts'} crumb={board ? `The Crypt » ${board.name}` : 'The Crypt'}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
        {list.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, borderBottom: '1px solid #c0c3cf', paddingBottom: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#476c8e' }}>{clip(t.title, 55)}</span>
            <span style={{ fontSize: 22, color: '#555' }}>{clip(t.author, 18)}</span>
          </div>
        ))}
      </div>
    </Frame>,
    opts,
  )
}
