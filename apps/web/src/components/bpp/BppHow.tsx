/**
 * "How BPP-9000 works": the explainer under the live machine. Facts from qubic/core (score_bpp9000.h,
 * oracle_interfaces/Price.h), the Jetski ANN Explorer reconstructions and Qubic's own posts.
 */
const STEPS: { n: string; title: string; body: string; tag?: string }[] = [
  {
    n: '1',
    title: 'The task: a year of bitcoin',
    body: 'Every hour of a real year of BTC/USDT on Binance, about 8,760 of them, turned into one trit each: up or down. That sequence is the exam every network has to pass.',
  },
  {
    n: '2',
    title: 'Miners grow the networks',
    body: 'Instead of burning hashes, Qubic miners mutate tiny ternary networks: 32 neurons, each with 3 wires and a table of 27 rules. Millions are tried every week. A network scores by how few hours it gets wrong.',
  },
  {
    n: '3',
    title: 'The colony keeps the best',
    body: 'Ant colony mining: a miner may publish only a network that strictly beats the one it grew from, so good work is inherited, not thrown away. Each miner is ranked by its single best network.',
  },
  {
    n: '4',
    title: 'Every node checks it',
    body: 'Scores are recomputed independently by the network, and the top 676 become the computors that run Qubic. Anyone can re-run them: the Jetski ANN Explorer archives every solution, and this page runs one with the same rule.',
  },
  {
    n: '5',
    title: 'Live data: the Oracle Machine',
    body: 'From epoch 240 the core asks for the BTC price of the past hour. Computors fetch the real data, agree on it as a quorum, and feed it in: the Oracle Machine. Then the network calls the next hour.',
    tag: 'next',
  },
  {
    n: '6',
    title: 'The call, and the score',
    body: 'One answer per hour: ▲ UP or ▼ DOWN for the close. BPP-9000 is scored only on its calls against the market. Participants keep their own journals, counted separately.',
    tag: 'next',
  },
]

function Diagram() {
  // A left-to-right flow. On narrow screens it scrolls inside its own box, the page never does.
  const box = (x: number, label: string, sub: string, hot = false, dashed = false) => (
    <g key={label}>
      <rect fill={hot ? 'rgba(255,196,107,.14)' : 'rgba(255,205,110,.04)'} height="86" rx="14" stroke={hot ? '#FFC46B' : 'rgba(255,205,110,.35)'} strokeDasharray={dashed ? '5 5' : undefined} width="150" x={x} y="52" />
      <text fill="#ecdfcb" fontSize="14" fontWeight="600" textAnchor="middle" x={x + 75} y="88">
        {label}
      </text>
      <text fill="#93857a" fontSize="11.5" textAnchor="middle" x={x + 75} y="108">
        {sub}
      </text>
    </g>
  )
  const arrow = (x: number) => <path d={`M${x} 95 h22`} fill="none" key={x} markerEnd="url(#bpp-ar)" stroke="rgba(255,205,110,.6)" strokeWidth="1.6" />
  return (
    <div className="bpp-diag-wide" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -4px', padding: '0 4px' }}>
      <svg aria-label="How BPP-9000 works: a year of bitcoin hours, miners grow networks, nodes verify them, the oracle feeds live prices, the network calls the next hour, the call is scored" role="img" style={{ display: 'block', minWidth: 1160, width: '100%', height: 'auto' }} viewBox="0 0 1160 230">
        <defs>
          <marker id="bpp-ar" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0 0 L8 4 L0 8 z" fill="#FFC46B" />
          </marker>
        </defs>
        {/* band: what runs today vs from 18 Nov */}
        <text fill="#93857a" fontSize="11" letterSpacing="2" x="4" y="30">
          RUNNING NOW
        </text>
        <path d="M4 38 H700" stroke="rgba(255,205,110,.35)" strokeWidth="1" />
        <text fill="#FFC46B" fontSize="11" letterSpacing="2" x="740" y="30">
          FROM 18 NOVEMBER
        </text>
        <path d="M740 38 H1156" stroke="#FFC46B" strokeDasharray="4 4" strokeWidth="1" />
        {box(4, 'A year of BTC', '8,760 hours: up or down')}
        {arrow(156)}
        {box(182, 'Miners', 'grow tiny networks')}
        {arrow(334)}
        {box(360, 'Colony', 'keeps only better ones')}
        {arrow(512)}
        {box(538, 'Every node', 'recomputes the score')}
        {arrow(690)}
        {box(716, 'Oracle Machine', 'live BTC price, agreed', false, true)}
        {arrow(868)}
        {box(894, 'The call', '▲ UP or ▼ DOWN', true, true)}
        {/* score loop */}
        <path d="M1044 95 h20 v70 H969 v-27" fill="none" markerEnd="url(#bpp-ar)" stroke="rgba(255,205,110,.45)" strokeWidth="1.4" />
        <text fill="#93857a" fontSize="11.5" x="1068" y="99">
          scored
        </text>
        <text fill="#93857a" fontSize="11.5" x="1068" y="115">
          vs market
        </text>
        {/* neuron close-up */}
        <g transform="translate(182 168)">
          <circle cx="10" cy="14" fill="#FFD68A" r="6" />
          <circle cx="10" cy="34" fill="#2a1d10" r="6" stroke="rgba(255,205,110,.75)" />
          <circle cx="10" cy="54" fill="#121014" r="6" stroke="rgba(255,255,255,.2)" />
          <path d="M16 14 L70 34 M16 34 L70 34 M16 54 L70 34" stroke="rgba(255,205,110,.5)" />
          <rect fill="#0d0b10" height="28" rx="6" stroke="rgba(255,205,110,.35)" width="88" x="70" y="20" />
          <text fill="#ecdfcb" fontSize="11" textAnchor="middle" x="114" y="38">
            27 rules
          </text>
          <path d="M158 34 h22" markerEnd="url(#bpp-ar)" stroke="rgba(255,205,110,.6)" />
          <text fill="#ecdfcb" fontSize="12" x="186" y="38">
            + / − / ?
          </text>
          <text fill="#93857a" fontSize="11" x="250" y="38">
            one neuron, each tick: reads 3 wires, looks up its rule, turns up, down or not sure
          </text>
        </g>
      </svg>
    </div>
  )
}

function DiagramTall() {
  const rows: [string, string, boolean, boolean][] = [
    ['A year of BTC', '8,760 hours: up or down', false, false],
    ['Miners', 'grow tiny networks', false, false],
    ['Colony', 'keeps only better ones', false, false],
    ['Every node', 'recomputes the score', false, false],
    ['Oracle Machine', 'live BTC price, agreed', false, true],
    ['The call', '▲ UP or ▼ DOWN, scored vs market', true, true],
  ]
  const H = 64
  const G = 26
  return (
    <svg aria-hidden className="bpp-diag-tall" style={{ display: 'none', width: '100%', height: 'auto', maxWidth: 420 }} viewBox={`0 0 320 ${rows.length * (H + G) + 30}`}>
      <defs>
        <marker id="bpp-ar2" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
          <path d="M0 0 L8 4 L0 8 z" fill="#FFC46B" />
        </marker>
      </defs>
      {rows.map(([t, sub, hot, dashed], i) => {
        const y = 10 + i * (H + G)
        return (
          <g key={t}>
            {i === 4 && (
              <text fill="#FFC46B" fontSize="10.5" letterSpacing="2" x="2" y={y - 8}>
                FROM 18 NOVEMBER
              </text>
            )}
            <rect fill={hot ? 'rgba(255,196,107,.14)' : 'rgba(255,205,110,.04)'} height={H} rx="12" stroke={hot ? '#FFC46B' : 'rgba(255,205,110,.35)'} strokeDasharray={dashed ? '5 5' : undefined} width="316" x="2" y={y} />
            <text fill="#ecdfcb" fontSize="15" fontWeight="600" x="18" y={y + 27}>
              {t}
            </text>
            <text fill="#93857a" fontSize="12.5" x="18" y={y + 47}>
              {sub}
            </text>
            {i < rows.length - 1 && <path d={`M160 ${y + H + 2} v${G - 8}`} markerEnd="url(#bpp-ar2)" stroke="rgba(255,205,110,.6)" strokeWidth="1.6" />}
          </g>
        )
      })}
    </svg>
  )
}

export function BppHow() {
  return (
    <section aria-labelledby="bpp-how" id="how" style={{ scrollMarginTop: 80, display: 'grid', gap: 26, paddingTop: 28, borderTop: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 760 }}>
        <h2 className="nx" id="bpp-how" style={{ fontWeight: 300, fontSize: 'clamp(38px, 5vw, 56px)', lineHeight: 1, margin: 0, color: 'var(--hot)' }}>
          How BPP-9000 works
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, margin: '14px 0 0', color: 'var(--ink)' }}>
          BPP-9000 is a Bitcoin price predictor grown, not programmed. Qubic miners breed small neural networks for Aigarth, the network checks every one of them, and the best is set to call the next hour of bitcoin: up or down. The work that secures Qubic is the same work that trains it.
        </p>
      </div>

      <style>{`@media (max-width: 760px) { .bpp-diag-wide { display: none } .bpp-diag-tall { display: block !important } }`}</style>
      <Diagram />
      <DiagramTall />

      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(18px, 3vw, 30px)' }}>
        {STEPS.map(s => (
          <li key={s.n} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12 }}>
            <span
              aria-hidden
              className="nx"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 18,
                background: s.tag ? 'transparent' : 'rgba(255,196,107,.14)',
                border: `1px ${s.tag ? 'dashed' : 'solid'} rgba(255,196,107,.6)`,
                color: 'var(--fil)',
              }}
            >
              {s.n}
            </span>
            <div>
              <h3 style={{ margin: '5px 0 6px', fontSize: 15.5, fontWeight: 600 }}>
                {s.title}
                {s.tag && (
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: 'var(--fil)', border: '1px solid rgba(255,196,107,.5)', borderRadius: 999, padding: '1px 8px', verticalAlign: 2 }}>from 18 Nov</span>
                )}
              </h3>
              <p className="mute" style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="panel" style={{ padding: 'clamp(18px, 3vw, 24px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'clamp(18px, 3vw, 32px)' }}>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: 15.5, fontWeight: 600 }}>What you see above, today</h3>
          <p className="mute" style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            The best recent network from the miners, loaded from the Jetski ANN Explorer and run in your browser with the scoring rule from qubic/core. Until the live feed it has no input: it is a rhythm fitted to the past year, so its match rate is a fit to history, not a forecast. It replays that year once an hour, timed to end as the candle closes.
          </p>
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: 15.5, fontWeight: 600 }}>What counts, from 18 November</h3>
          <p className="mute" style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            Only live calls, made before the hour closes, checked against the real close. A coin is right half the time, so the number to watch is how far above 50% the network holds, over many hours. CfB asked for the same: a large, statistically significant test with many witnesses.
          </p>
        </div>
      </div>

      <p className="mute" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7 }}>
        Sources:{' '}
        <a href="https://github.com/qubic/core/blob/main/src/mining/score_bpp9000.h" rel="noopener noreferrer" style={{ color: 'var(--dim)' }} target="_blank">
          qubic/core scorer
        </a>
        ,{' '}
        <a href="https://github.com/qubic/core/blob/main/src/oracle_interfaces/Price.h" rel="noopener noreferrer" style={{ color: 'var(--dim)' }} target="_blank">
          Oracle Machine price interface
        </a>
        ,{' '}
        <a href="https://qubic.org/blog-detail/qubic-ant-colony-mining-live-epoch-228" rel="noopener noreferrer" style={{ color: 'var(--dim)' }} target="_blank">
          Qubic: ant colony mining
        </a>
        ,{' '}
        <a href="https://annexplorer.jetskipool.ai/" rel="noopener noreferrer" style={{ color: 'var(--dim)' }} target="_blank">
          Jetski ANN Explorer
        </a>
        .
      </p>
    </section>
  )
}
