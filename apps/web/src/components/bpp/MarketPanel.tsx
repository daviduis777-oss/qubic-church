/** Market mood next to the predictor. Server-rendered from cached public APIs; missing sources show a dash. */
type Market = {
  fng: { value: number; label: string; history: number[] } | null
  dominance: { btc: number; eth: number } | null
  altseason: { index: number; beat: number; of: number; window: string } | null
  btc: { price: number; change24h: number; candles: { t: number; o: number; c: number; h: number; l: number }[] } | null
}

const fngColor = (v: number) => (v < 25 ? '#ff4d6d' : v < 45 ? '#ff9f43' : v < 56 ? '#ffd24a' : v < 76 ? '#9be15d' : '#3dff9a')

function Gauge({ value, color }: { value: number; color: string }) {
  // half circle 0..100
  const a = Math.PI * (1 - value / 100)
  const x = 60 + 46 * Math.cos(a)
  const y = 58 - 46 * Math.sin(a)
  return (
    <svg aria-hidden viewBox="0 0 120 66" width="100%" style={{ maxWidth: 180 }}>
      <defs>
        <linearGradient id="fg" x1="0" x2="1">
          <stop offset="0" stopColor="#ff4d6d" />
          <stop offset=".5" stopColor="#ffd24a" />
          <stop offset="1" stopColor="#3dff9a" />
        </linearGradient>
      </defs>
      <path d="M14 58 A46 46 0 0 1 106 58" fill="none" stroke="url(#fg)" strokeLinecap="round" strokeWidth="9" opacity=".85" />
      <line stroke={color} strokeLinecap="round" strokeWidth="3" x1="60" x2={x} y1="58" y2={y} />
      <circle cx="60" cy="58" fill={color} r="4" />
    </svg>
  )
}

function Candles({ candles }: { candles: NonNullable<Market['btc']>['candles'] }) {
  const hi = Math.max(...candles.map(c => c.h))
  const lo = Math.min(...candles.map(c => c.l))
  const H = 90
  const y = (v: number) => H - ((v - lo) / (hi - lo || 1)) * (H - 6) - 3
  const w = 100 / candles.length
  return (
    <svg aria-hidden preserveAspectRatio="none" viewBox={`0 0 100 ${H}`} width="100%" height={H}>
      {candles.map((c, i) => {
        const up = c.c >= c.o
        const col = up ? '#3dff9a' : '#ff4d6d'
        const x = i * w + w / 2
        return (
          <g key={c.t}>
            <line stroke={col} strokeWidth=".4" x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} opacity=".8" />
            <rect fill={col} height={Math.max(0.8, Math.abs(y(c.o) - y(c.c)))} width={w * 0.62} x={x - w * 0.31} y={Math.min(y(c.o), y(c.c))} opacity=".9" />
          </g>
        )
      })}
    </svg>
  )
}

export function MarketPanel({ m }: { m: Market }) {
  const alt = m.altseason
  return (
    <section className="panel" style={{ padding: 20 }}>
      <div className="label">market mood</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 18, marginTop: 14 }}>
        <div>
          <div className="label" style={{ fontSize: 10 }}>BTC · last 24 hours</div>
          {m.btc ? (
            <>
              <div className="big" style={{ fontSize: 26, fontWeight: 600, marginTop: 6 }}>
                ${Math.round(m.btc.price).toLocaleString('en-US')}{' '}
                <span style={{ fontSize: 14, color: m.btc.change24h >= 0 ? 'var(--g)' : 'var(--r)' }}>
                  {m.btc.change24h >= 0 ? '+' : ''}
                  {m.btc.change24h.toFixed(2)}%
                </span>
              </div>
              <Candles candles={m.btc.candles} />
            </>
          ) : (
            <div style={{ color: 'var(--dim)', marginTop: 6 }}>—</div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="label" style={{ fontSize: 10 }}>fear &amp; greed</div>
          {m.fng ? (
            <>
              <Gauge color={fngColor(m.fng.value)} value={m.fng.value} />
              <div className="big" style={{ fontSize: 26, fontWeight: 700, color: fngColor(m.fng.value), marginTop: -6 }}>
                {m.fng.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--dim)' }}>{m.fng.label}</div>
            </>
          ) : (
            <div style={{ color: 'var(--dim)' }}>—</div>
          )}
        </div>

        <div>
          <div className="label" style={{ fontSize: 10 }}>BTC dominance</div>
          {m.dominance ? (
            <>
              <div className="big" style={{ fontSize: 26, fontWeight: 600, marginTop: 6, color: '#f7931a', textShadow: '0 0 14px rgba(247,147,26,.4)' }}>{m.dominance.btc.toFixed(1)}%</div>
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 10, background: 'rgba(138,151,173,.15)' }}>
                <div style={{ width: `${m.dominance.btc}%`, background: '#f7931a' }} />
                <div style={{ width: `${m.dominance.eth}%`, background: '#8c8cff' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 6 }}>
                BTC {m.dominance.btc.toFixed(1)}% · ETH {m.dominance.eth.toFixed(1)}% · rest {(100 - m.dominance.btc - m.dominance.eth).toFixed(1)}%
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--dim)' }}>—</div>
          )}
        </div>

        <div>
          <div className="label" style={{ fontSize: 10 }}>altseason index</div>
          {alt ? (
            <>
              <div className="big" style={{ fontSize: 26, fontWeight: 600, marginTop: 6, color: alt.index >= 75 ? 'var(--g)' : alt.index <= 25 ? '#f7931a' : 'var(--ink)' }}>
                {alt.index}
                <span style={{ fontSize: 13, color: 'var(--dim)' }}> / 100</span>
              </div>
              <div style={{ position: 'relative', height: 8, borderRadius: 4, marginTop: 10, background: 'linear-gradient(90deg, #f7931a, #ffd24a 50%, #3dff9a)' }}>
                <div style={{ position: 'absolute', left: `calc(${alt.index}% - 5px)`, top: -4, width: 10, height: 16, borderRadius: 3, background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,.7)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--dim)', marginTop: 6 }}>
                <span>bitcoin season</span>
                <span>altseason</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 4 }}>
                {alt.beat} of top {alt.of} coins beat BTC over {alt.window}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--dim)' }}>—</div>
          )}
        </div>
      </div>
    </section>
  )
}
