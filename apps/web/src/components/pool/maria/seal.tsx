/**
 * The "Recorded" seal: a small engraved mark in the gold style, like a coin's milled edge around a check.
 * Each gold line sits on a dark twin a hair lower, so it reads as cut into the surface, not drawn on it.
 * Plain SVG with no ids and no hooks: the page (server) and the app (client) both draw it.
 */
const TICKS = 40

export function Seal({
  size = 28,
  dim = false,
  className,
}: {
  size?: number
  dim?: boolean
  className?: string
}) {
  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const a = (i / TICKS) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    return `M${(24 + c * 19).toFixed(2)} ${(24 + s * 19).toFixed(2)}L${(24 + c * 21.2).toFixed(2)} ${(24 + s * 21.2).toFixed(2)}`
  }).join('')
  const gold = dim ? '#8c8c8c' : '#fece34'
  const hi = dim ? '#b7b7b7' : '#ffe77c'
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 48 48"
      width={size}
    >
      <circle
        cx="24"
        cy="24"
        fill={gold}
        fillOpacity={dim ? 0.04 : 0.07}
        r="23"
      />
      {/* the engraving: dark first, a half pixel down, then the gold on top */}
      <g stroke="#000" strokeOpacity="0.85" transform="translate(0 0.7)">
        <circle cx="24" cy="24" r="23" strokeWidth="1.1" />
        <path d={ticks} strokeWidth="1" />
        <circle cx="24" cy="24" r="16.4" strokeWidth="0.9" />
        <path
          d="M17.6 24.6l4.3 4.2 8.6-9.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </g>
      <circle
        cx="24"
        cy="24"
        r="23"
        stroke={gold}
        strokeOpacity="0.9"
        strokeWidth="1.1"
      />
      <path d={ticks} stroke={gold} strokeOpacity="0.55" strokeWidth="1" />
      <circle
        cx="24"
        cy="24"
        r="16.4"
        stroke={gold}
        strokeOpacity="0.7"
        strokeWidth="0.9"
      />
      <path
        d="M17.6 24.6l4.3 4.2 8.6-9.4"
        stroke={hi}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  )
}
