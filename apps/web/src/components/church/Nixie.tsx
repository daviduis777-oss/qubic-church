'use client'

import { useId } from 'react'
import { DIGITS as D } from './nixie/digits'

/**
 * Nixie tubes, drawn from Bob's IN-18 reference: clear glass (only its rims, dome ring and getter disc catch light),
 * a dark hex-mesh anode behind the digit, the digit itself a thin glowing wire with unlit cathodes behind it,
 * and a strong blue light pooling in the base and reflecting on the table. Each digit is a hand-drawn monoline path.
 */

const GHOSTS = ['0', '8', '6', '3']

// fixed sparkle positions in the blue base (x, y, r) in tube units
const SPARKS = [
  [16, 108, 0.9], [22, 111, 0.6], [27, 106, 0.7], [33, 110, 1.0], [38, 107, 0.6], [44, 111, 0.8], [19, 113, 0.5],
  [30, 113, 0.7], [41, 114, 0.5], [25, 115, 0.8], [36, 116, 0.6], [14, 104, 0.5], [47, 105, 0.5],
] as const

export function NixieTube({ ch, h }: { ch: string; h: number }) {
  const id = useId().replace(/:/g, '')
  const w = h * 0.5
  const path = D[ch]
  // tube: 60 wide, 120 tall, dome radius 30
  const shape = 'M2,30 A28,28 0 0 1 58,30 L58,116 Q58,119 55,119 L5,119 Q2,119 2,116 Z'
  return (
    <svg aria-hidden height={h} style={{ display: 'block', overflow: 'visible', flex: 'none' }} viewBox="0 0 60 120" width={w}>
      <defs>
        <clipPath id={`c${id}`}>
          <path d={shape} />
        </clipPath>
        <pattern height="10.4" id={`m${id}`} patternTransform="scale(.7)" patternUnits="userSpaceOnUse" width="6">
          <path d="M3,0 L6,1.73 L6,5.2 L3,6.93 L0,5.2 L0,1.73 Z M3,6.93 L3,10.4" fill="none" stroke="#0b0c12" strokeWidth=".7" />
        </pattern>
        <linearGradient id={`cy${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".85" />
          <stop offset=".25" stopColor="#000" stopOpacity=".15" />
          <stop offset=".7" stopColor="#000" stopOpacity=".05" />
          <stop offset="1" stopColor="#000" stopOpacity=".8" />
        </linearGradient>
        <radialGradient cx="50%" cy="100%" id={`b${id}`} r="85%">
          <stop offset="0" stopColor="#bcd4ff" />
          <stop offset=".14" stopColor="#4f8dff" />
          <stop offset=".42" stopColor="#2457ff" stopOpacity=".45" />
          <stop offset="1" stopColor="#1a3cff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`mb${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset=".4" stopColor="#3f7bff" stopOpacity="0" />
          <stop offset="1" stopColor="#5b92ff" stopOpacity=".9" />
        </linearGradient>
        <filter filterUnits="userSpaceOnUse" height="180" id={`g${id}`} width="120" x="-30" y="-30">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter filterUnits="userSpaceOnUse" height="180" id={`gb${id}`} width="120" x="-30" y="-30">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* blue reflection on the table */}
      <ellipse cx="30" cy="121" fill="#3a74ff" filter={`url(#gb${id})`} opacity=".55" rx="30" ry="5" />

      <g clipPath={`url(#c${id})`}>
        {/* what is seen through the glass: near-black */}
        <rect fill="#050509" height="120" opacity=".55" width="60" />
        {/* the blue light pooling in the base, behind the mesh and the digit */}
        <rect fill={`url(#b${id})`} height="74" opacity=".95" width="60" y="46" />
        {/* the anode: a dark hex mesh, a cylinder, lit blue from below */}
        <rect fill={`url(#m${id})`} height="96" width="52" x="4" y="16" />
        
        <rect fill={`url(#cy${id})`} height="104" width="60" y="14" />

        {/* unlit cathodes behind */}
        {path &&
          GHOSTS.filter(g => g !== ch).map((g, i) => (
            <path d={D[g]} fill="none" key={g} stroke="#6d6660" strokeOpacity=".32" strokeWidth=".9" transform={`translate(${9 + i * 0.6},${20 - i * 0.4}) scale(.7)`} />
          ))}

        {/* the lit cathode: glow, wire, hot core */}
        {path && (
          <g transform="translate(9,20) scale(.7)">
            <path d={path} fill="none" filter={`url(#gb${id})`} stroke="#ff4d00" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".8" strokeWidth="12" />
            <path d={path} fill="none" filter={`url(#g${id})`} stroke="#ff7a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5.5" />
            <path d={path} fill="none" stroke="#ff9a3c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4" />
            <path d={path} fill="none" stroke="#fff0d8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
          </g>
        )}
        {!path && (
          <text fill="#ffb066" fontFamily="system-ui" fontSize="40" textAnchor="middle" x="30" y="66">
            {ch}
          </text>
        )}

        {/* sparks in the blue base */}
        {SPARKS.map(([x, y, r], i) => (
          <circle cx={x} cy={y} fill="#e8f0ff" key={i} opacity=".85" r={r} />
        ))}
      </g>

      {/* the glass itself: rims, dome ring, getter disc, a soft cold sheen */}
      <path d={shape} fill="none" stroke="rgba(220,230,255,.22)" strokeWidth=".8" />
      <linearGradient id={`r${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".8" /><stop offset=".6" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#6fa0ff" stopOpacity="1" /></linearGradient>
      <path d="M5,34 L5,114" stroke={`url(#r${id})`} strokeLinecap="round" strokeWidth="1.1" />
      <path d="M55,34 L55,114" stroke={`url(#r${id})`} strokeOpacity=".6" strokeLinecap="round" strokeWidth=".9" />
      <path d="M9,30 L9,70" stroke="rgba(255,255,255,.18)" strokeLinecap="round" strokeWidth="2.5" />
      <ellipse cx="30" cy="16" fill="rgba(210,214,224,.10)" rx="20" ry="2.6" stroke="rgba(235,238,245,.35)" strokeWidth=".6" />
      <path d="M10,22 A22,22 0 0 1 50,22" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".8" />
      <ellipse cx="30" cy="3.2" fill="rgba(255,255,255,.35)" rx="4" ry="1.4" />
      <path d="M3,117 L57,117" stroke="#7fa6ff" strokeOpacity=".9" strokeWidth="1.2" />
    </svg>
  )
}

/** Two neon dots between tube groups. */
function NixieColon({ h }: { h: number }) {
  const d = Math.max(4, Math.round(h * 0.06))
  const dot = { width: d, height: d, borderRadius: '50%', background: '#ffc28a', boxShadow: '0 0 4px #ff7a1a, 0 0 10px rgba(255,90,10,.8), 0 0 18px rgba(60,110,255,.55)' }
  return (
    <span aria-hidden style={{ display: 'inline-flex', flexDirection: 'column', justifyContent: 'center', gap: h * 0.2, height: h, padding: `0 ${Math.round(h * 0.06)}px` }}>
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
