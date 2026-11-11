import type { Medal as M } from '@/lib/me/medals'

/** A medal as a small struck coin: a gold rim, the glyph in the middle. Dim when not earned. */
export function MedalCoin({ medal, earned, size = 64 }: { medal: M; earned: boolean; size?: number }) {
  const id = `mg-${medal.id}-${earned ? 1 : 0}`
  const ink = earned ? '#2a1a06' : 'rgba(255,220,170,.35)'
  return (
    <svg aria-hidden height={size} viewBox="0 0 64 64" width={size}>
      <defs>
        <radialGradient cx="38%" cy="32%" id={id} r="75%">
          <stop offset="0" stopColor={earned ? '#fff1d2' : '#3a3128'} />
          <stop offset=".55" stopColor={earned ? '#ffc46b' : '#26201b'} />
          <stop offset="1" stopColor={earned ? '#c97d22' : '#1a1613'} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" fill={`url(#${id})`} r="29" stroke={earned ? '#ffe3b0' : 'rgba(255,200,140,.18)'} strokeWidth="1.5" />
      <circle cx="32" cy="32" fill="none" r="23.5" stroke={earned ? 'rgba(90,50,10,.45)' : 'rgba(255,200,140,.1)'} strokeDasharray="1.5 2.5" strokeWidth="1" />
      <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" transform="translate(32 32)">
        {medal.glyph === 'flame' && <path d="M0 13c-6 0-9-4-9-9 0-6 5-8 6-14 3 3 3 6 2 9 2-1 4-3 4-6 4 4 6 7 6 11 0 5-3 9-9 9z" />}
        {medal.glyph === 'crown' && <path d="M-12 8h24l2-14-8 6-6-10-6 10-8-6z M-12 12h24" />}
        {medal.glyph === 'quill' && <path d="M10-12C0-10-6-2-9 10 M10-12c-2 8-7 13-15 15 M-9 10l-3 3" />}
        {medal.glyph === 'speech' && <path d="M-12-8h24v14H-2l-6 6v-6h-4z" />}
        {medal.glyph === 'spark' && <path d="M0-13v26 M-13 0h26 M-9-9l18 18 M9-9L-9 9" />}
        {medal.glyph === 'clock' && (
          <>
            <circle r="12" />
            <path d="M0-7v7l5 4" />
          </>
        )}
        {medal.glyph === 'flag' && <path d="M-9 13v-26 M-9-12h18l-4 6 4 6h-18" />}
        {medal.glyph === 'week' && <path d="M-13 0h4l3-8 6 16 4-10 3 2h6" />}
      </g>
    </svg>
  )
}
