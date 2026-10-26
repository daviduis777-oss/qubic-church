import { Fragment } from 'react'

const URL_RE = /(https?:\/\/[^\s<>"']+)/g
/** Trailing punctuation belongs to the sentence, not the link. */
const TRAIL = /[.,;:!?)\]}'"»]+$/

/** Post text with every http(s) address turned into a link. Plain text otherwise; nothing else is interpreted. */
export function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_RE)
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
        const tail = part.match(TRAIL)?.[0] ?? ''
        const href = tail ? part.slice(0, -tail.length) : part
        return (
          <Fragment key={i}>
            <a href={href} rel="nofollow ugc noopener noreferrer" style={{ wordBreak: 'break-all' }} target="_blank">
              {href}
            </a>
            {tail}
          </Fragment>
        )
      })}
    </>
  )
}
