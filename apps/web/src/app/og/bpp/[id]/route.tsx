import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { getParticipant } from '@/lib/bpp/store'
import { statsOf } from '@/lib/bpp/stats'

/** The card a participant posts: "<name> × BPP-9000 · Day N" with the KDA line, like an end-of-match screen. */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function fonts() {
  const dir = path.join(process.cwd(), 'public', 'fonts')
  const [regular, bold] = await Promise.all([readFile(path.join(dir, 'Geist-Regular.ttf')), readFile(path.join(dir, 'Geist-Bold.ttf'))])
  return [
    { name: 'Geist', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: bold, weight: 700 as const, style: 'normal' as const },
  ]
}

const G = '#3dff9a'
const R = '#ff4d6d'
const DIM = '#8a97ad'
const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: n < 1000 ? 2 : 0 })}`

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const handle = id.replace(/\.png$/, '')
  const p = await getParticipant(handle).catch(() => null)
  const opts = { width: 1200, height: 630, fonts: await fonts(), headers: { 'Cache-Control': 'public, max-age=300' } }
  if (!p) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#04070f', color: G, fontSize: 90, fontWeight: 700, fontFamily: 'Geist' }}>BPP-9000</div>,
      opts,
    )
  }
  const s = statsOf(p.trades, p.start, p.joined)
  const eq = s.equity
  const hi = Math.max(...eq)
  const lo = Math.min(...eq)
  const up = s.capital >= s.start
  const tiles: [string, string, string?][] = [
    [`${s.wins}`, 'WINS', G],
    [`${s.losses}`, 'LOSSES', R],
    [s.winRate == null ? '—' : `${s.winRate.toFixed(1)}%`, 'WIN RATE', s.winRate != null && s.winRate >= 50 ? G : R],
    [s.streak.kind ? `${s.streak.kind}${s.streak.n}` : '—', 'STREAK', s.streak.kind === 'W' ? G : s.streak.kind === 'L' ? R : undefined],
    [s.profitFactor == null ? '—' : s.profitFactor.toFixed(2), 'PROFIT FACTOR', s.profitFactor != null && s.profitFactor >= 1 ? G : undefined],
  ]
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'linear-gradient(160deg, #071322 0%, #04070f 60%)', color: '#e8f1ff', fontFamily: 'Geist', padding: '48px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
        <span style={{ fontSize: 56, fontWeight: 700 }}>{p.name.slice(0, 22)}</span>
        <span style={{ fontSize: 56, fontWeight: 700, color: G }}>×</span>
        <span style={{ fontSize: 56, fontWeight: 700 }}>BPP-9000</span>
        <span style={{ fontSize: 40, color: DIM }}>{`· Day ${s.day}`}</span>
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 40 }}>
        {tiles.map(([big, label, col]) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 22px', borderRadius: 16, border: '2px solid rgba(94,231,255,.18)', background: 'rgba(8,14,28,.8)' }}>
            <span style={{ fontSize: 54, fontWeight: 700, color: col ?? '#e8f1ff' }}>{big}</span>
            <span style={{ fontSize: 18, color: DIM, letterSpacing: 3 }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 34, flexGrow: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 22, color: DIM, letterSpacing: 3 }}>CAPITAL</span>
          <span style={{ fontSize: 50, fontWeight: 700 }}>
            {`${money(s.start)} → `}
            <span style={{ color: up ? G : R, marginLeft: 12 }}>{money(s.capital)}</span>
          </span>
          <span style={{ fontSize: 24, color: up ? G : R }}>{`${s.returnPct >= 0 ? '+' : ''}${s.returnPct.toFixed(1)}% · ${s.trades} trades`}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140, width: 470 }}>
          {eq.slice(-60).map((v, i) => (
            <div key={i} style={{ flex: 1, height: Math.max(4, ((v - lo) / (hi - lo || 1)) * 130 + 6), background: up ? G : R, opacity: 0.35 + (0.65 * (i + 1)) / Math.min(60, eq.length), borderRadius: 2 }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, fontSize: 20, color: DIM }}>
        <span>Experiment. If you trade with real money, the responsibility is yours.</span>
        <span style={{ color: G }}>qubic.church/bpp9000</span>
      </div>
    </div>,
    opts,
  )
}
