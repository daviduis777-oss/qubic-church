import type { ArticleBlock } from '@/lib/articles'

/** Plain text (as pasted from X or typed) → forum blocks. The words are never changed, only the layout is inferred. */
export function blocksFromText(text: string, title?: string): ArticleBlock[] {
  const lines = text
    .replace(/ /g, ' ')
    .split(/\r?\n/)
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter(l => !/^(#\w+|@\w+|\$\w+)(\s+(#\w+|@\w+|\$\w+))*$/.test(l)) // tag-only lines
  const out: ArticleBlock[] = []
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i]!
    const next = lines[i + 1] ?? ''
    if (title && i === 0 && s.toLowerCase() === title.toLowerCase()) continue
    const quote = s.match(/^[>"“«]\s?(.+?)[”"»]?\s*[-–—]\s*(.{2,120})$/)
    if (quote && /^[>"“«]/.test(s)) {
      out.push({ t: 'quote', text: quote[1]!.replace(/^[>"“«]\s?/, '').replace(/[”"»]$/, ''), cite: quote[2] })
      continue
    }
    if (s.startsWith('> ')) {
      out.push({ t: 'quote', text: s.slice(2) })
      continue
    }
    if (s.startsWith('## ') || s.startsWith('# ')) {
      out.push({ t: 'h', text: s.replace(/^#+\s/, '') })
      continue
    }
    const heading = s.length <= 80 && !/[.!?;,:"”»)…]$/.test(s) && /^[A-ZА-Я0-9]/.test(s) && next.length > s.length && !/^\d+[.)]\s/.test(s)
    out.push({ t: heading ? 'h' : 'p', text: s })
  }
  return out
}

type DraftBlock = { text: string; type: string }
/** X Article body (Draft.js blocks from FxTwitter) → forum blocks. */
export function blocksFromDraft(blocks: DraftBlock[]): ArticleBlock[] {
  const out: ArticleBlock[] = []
  for (const b of blocks) {
    const text = (b.text ?? '').replace(/ /g, ' ').trim()
    if (!text) continue
    if (/^header/.test(b.type)) out.push({ t: 'h', text })
    else if (b.type === 'blockquote') out.push({ t: 'quote', text })
    else if (/list-item$/.test(b.type)) out.push({ t: 'p', text: `• ${text}` })
    else for (const part of text.split(/\n{2,}/)) out.push(...blocksFromText(part))
  }
  return out
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’"“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '') || 'topic'

export const summaryOf = (blocks: ArticleBlock[]) => {
  const first = blocks.find(b => b.t === 'p' && b.text.length > 80)?.text ?? blocks[0]?.text ?? ''
  return first.length <= 240 ? first : `${first.slice(0, 237).replace(/\s+\S*$/, '')}…`
}
export const wordCount = (blocks: ArticleBlock[]) => blocks.reduce((n, b) => n + b.text.split(/\s+/).filter(Boolean).length, 0)
