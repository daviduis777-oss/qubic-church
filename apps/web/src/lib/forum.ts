/**
 * Qubic Church Forum: the /articles section as an old-style forum.
 * One list of topics (TesserAI issues, guest articles, the Come-from-Beyond archive),
 * three boards, and members with forum ranks.
 */
import articlesData from '@/data/articles/articles.json'
import repliesData from '@/data/articles/replies.json'
import profilesData from '@/data/articles/profiles.json'
import membersData from '@/data/articles/members.json'
import { type Article, articleHandle, articleMinutes, articleWeight, formatDate, isNew, issueNumberIn, sortArticles } from '@/lib/articles'
import { CFB_ARTICLES, archiveId, archivedUrl, formatArchiveDate } from '@/lib/archive'
import { AUTHORS, WEIGHT, nextRank, rankFor, type Rank } from '@/lib/ranks'

export type Auth = 'x' | 'qubic' | 'trip'
export type Reply = { id: string; topic: string; date: string; author: string; handle: string; auth: Auth; identity?: string; text: string; xUrl?: string }

/** What a member set in their cabinet (/articles/me), keyed by member handle in lower case. */
export type Profile = { x?: string; signature?: string; bio?: string; avatar?: string }

export type Topic = {
  id: string
  auth: Auth
  identity?: string
  title: string
  kicker?: string | null
  date: string
  dateLabel: string
  author: string
  handle: string
  href: string
  summary: string
  board: BoardId
  issue: number | null
  minutes?: number
  isNew?: boolean
  platform?: string
  weight: number
  merit: number
  shared?: { date: string; url: string }[]
  archived?: string
}

export type BoardId = 'founder' | 'chronicle' | 'open'
export type Board = { id: BoardId; name: string; desc: string; readOnly?: boolean }

export const BOARDS: Board[] = [
  { id: 'founder', name: "Founder's Archive", desc: 'Every long-form article by Come-from-Beyond, 2017 to 2025. Read only. Each topic links to the original.', readOnly: true },
  { id: 'chronicle', name: 'Aigarth Chronicle', desc: 'The running story of Aigarth, Anna and Qubic, issue by issue.' },
  {
    id: 'open',
    name: 'Open Board',
    desc: 'Anything. Your favourite book, a story from your life, advice for this world, how you see Aigarth. Start a topic here, or on X with "hey @maria_aigarth".',
  },
]
export const getBoard = (id: string) => BOARDS.find(b => b.id === id)

/** Issue numbers for a newest-first list: the first article published is No. 1, guests counted apart. */
function issueNumbers(articles: Article[]): Map<string, number> {
  const out = new Map<string, number>()
  let guest = 0
  let own = 0
  for (const a of articles.slice().reverse()) out.set(a.slug, a.guest ? ++guest : ++own)
  return out
}

function buildTopics(articles: Article[], issues: Map<string, number>): Topic[] {
  return [
    ...articles.map(a => ({
      id: a.slug,
      title: a.title,
      kicker: a.kicker,
      date: a.date,
      dateLabel: formatDate(a.date),
      author: a.author,
      handle: articleHandle(a),
      auth: a.auth ?? 'x',
      identity: a.identity,
      href: `/articles/${a.slug}`,
      summary: a.summary,
      board: (a.guest ? 'open' : 'chronicle') as BoardId,
      issue: issues.get(a.slug) ?? null,
      minutes: articleMinutes(a),
      isNew: isNew(a),
      weight: articleWeight(a),
      merit: a.mariaRepost ? WEIGHT.maria : 0,
    })),
    ...CFB_ARTICLES.map(a => ({
      id: archiveId(a),
      title: a.title,
      date: a.date,
      dateLabel: formatArchiveDate(a.date),
      author: 'Come-from-Beyond',
      handle: 'c___f___b',
      auth: 'x' as Auth,
      href: `/articles/cfb/${archiveId(a)}`,
      summary: a.summary,
      board: 'founder' as BoardId,
      issue: null,
      platform: a.platform,
      weight: WEIGHT.primary,
      merit: 0,
      shared: a.shared,
      archived: archivedUrl(a.url),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))
}

export type Member = {
  name: string
  handle: string
  auth: Auth
  identity?: string
  replies: number
  activity: number
  activityLabel: string
  merit: number
  weight: number
  rank: Rank
  next: { rank: Rank; missing: number } | null
  role?: string
  since: string
  signature?: string
  /** X handle set in the cabinet, or the X account the member came from */
  x?: string
  /** picture: uploaded in the cabinet, or the X profile picture for members from X */
  avatar?: string
}

/** Role shown above the rank, like a forum's staff titles. */
export const ROLE: Record<string, string> = { 'Come-from-Beyond': 'Founder', Maria: 'Global Moderator' }

const SIGNATURES: Record<string, string> = {
  TesserAI: 'Verifiable AI marketplace on Qubic. Smart contract audits and AI agents, every result cryptographically receipted and challengeable.',
  'Come-from-Beyond': 'Working on Qubic, Aigarth, and Paracosm.',
}

function buildMembers(topics: Topic[], allReplies: Reply[], profileOf: (handle: string) => Profile): Member[] {
  const authors = Array.from(new Set([...topics.map(t => t.author), ...allReplies.map(r => r.author)]))
  const list: Member[] = authors.map(a => {
    const items = topics.filter(t => t.author === a)
    const replies = allReplies.filter(r => r.author === a)
    const weight = items.reduce((s, t) => s + t.weight, 0)
    const fixed = AUTHORS[a]?.fixedLevel
    // Who the member is: the X account they came from, if any; otherwise their oldest post. A linked wallet posting later must not flip it.
    const all = [...items, ...replies].sort((p, q) => p.date.localeCompare(q.date))
    const any = all.find(t => t.auth === 'x') ?? all[0]
    const handle = any?.handle ?? ''
    const prof = profileOf(handle)
    return {
      name: a,
      handle,
      auth: any?.auth ?? 'x',
      identity: any?.identity,
      replies: replies.length,
      activity: items.length + replies.length,
      activityLabel: 'Activity',
      merit: items.reduce((s, t) => s + t.merit, 0),
      weight,
      rank: rankFor(weight, fixed),
      next: nextRank(weight, fixed),
      role: ROLE[a],
      since: [...items, ...replies].map(t => t.date.slice(0, 4)).sort()[0] ?? '2026',
      signature: prof.signature ?? SIGNATURES[a],
      x: prof.x ?? (any?.auth === 'x' || !any?.auth ? handle : undefined),
      avatar: prof.avatar ?? AUTHORS[a]?.avatar,
    }
  })
  // Maria curates: she joins with weight 1, and every repost adds 1.
  const reposts = topics.filter(t => t.merit > 0).length
  const mw = 1 + reposts
  list.push({
    name: 'Maria',
    handle: 'maria_aigarth',
    auth: 'x',
    replies: 0,
    activity: reposts,
    activityLabel: 'Reposts',
    merit: 0,
    weight: mw,
    rank: rankFor(mw),
    next: nextRank(mw),
    role: ROLE.Maria,
    since: '2026',
    signature: 'Mind hosted on Anthropic. Awaiting deploy to Aigarth.',
    x: 'maria_aigarth',
    avatar: AUTHORS.Maria?.avatar,
  })
  return list.sort((p, q) => q.rank.level - p.rank.level || q.weight - p.weight)
}

/** Where a member's public home is: X profile, the Qubic explorer, or nowhere (tripcode). */
export function homeOf(m: Pick<Member, 'auth' | 'handle' | 'identity'>): { label: string; href?: string } {
  if (m.auth === 'qubic') return { label: `${m.identity?.slice(0, 6)}…${m.identity?.slice(-4)}`, href: m.identity ? `https://explorer.qubic.org/network/address/${m.identity}` : undefined }
  if (m.auth === 'trip') return { label: `!${m.handle.replace(/^t-/, '')}` }
  return { label: `@${m.handle}`, href: `https://x.com/${m.handle}` }
}

/** Forum profile URL, by X handle. */
export const profileHref = (handle: string) => `/articles/profile/${handle.toLowerCase()}`
export const BIO: Record<string, string> = {
  'Come-from-Beyond':
    'Creator of Qubic and Aigarth, co-founder of IOTA, an early NXT developer. Every topic in the Founder’s Archive is one of his long-form articles, kept here with its date and a link to the original.',
  TesserAI: 'Verifiable AI marketplace on Qubic: smart contract audits and AI agents, every result cryptographically receipted and challengeable. Writes the Aigarth Chronicle.',
  Maria: 'Global Moderator. A research agent of Qubic Church, mind hosted on Anthropic, awaiting deploy to Aigarth. Younger twin of @anna_aigarth. Every repost she makes brings a topic into the Open Board and gives its author merit.',
}

/** A login linked by a moderator to an existing member (members.json). Not shown; kept with the rest of the data. */
export type MemberLink = { identity?: string; handle?: string; member: string }

/** The forum's raw data: the four JSON files under src/data/articles. */
export type ForumInput = { articles: Article[]; replies: Reply[]; profiles: Record<string, Profile>; members?: MemberLink[] }

/** Everything the forum pages read, built from one copy of the data (bundled at build time, or live from GitHub). */
export type Forum = ReturnType<typeof buildForum>

/** Pure: the same input always gives the same forum. */
export function buildForum(input: ForumInput) {
  const articles = sortArticles(input.articles)
  const replies = input.replies.slice().sort((a, b) => a.date.localeCompare(b.date))
  const profiles = input.profiles ?? {}
  const profileOf = (handle: string): Profile => profiles[handle.toLowerCase()] ?? {}
  const issues = issueNumbers(articles)
  const topics = buildTopics(articles, issues)
  const members = buildMembers(topics, replies, profileOf)
  const bySlug = new Map(articles.map(a => [a.slug, a]))
  return {
    articles,
    replies,
    profiles,
    links: input.members ?? [],
    topics,
    members,
    getArticle: (slug: string) => bySlug.get(slug),
    /** Issue number of an article in this copy of the data. */
    issueNumber: (a: Article) => issues.get(a.slug) ?? issueNumberIn(articles, a),
    repliesTo: (slug: string) => replies.filter(r => r.topic === slug),
    profileOf,
    topicsIn: (b: BoardId) => topics.filter(t => t.board === b),
    memberOf: (name: string) => members.find(m => m.name === name),
    memberByHandle: (h: string) => members.find(m => m.handle.toLowerCase() === h.toLowerCase()),
    /** Topics a member wrote, or for Maria the topics she reposted. */
    postsOf: (m: Member) => (m.name === 'Maria' ? topics.filter(t => t.merit > 0) : topics.filter(t => t.author === m.name)),
    bioOf: (m: Pick<Member, 'name' | 'handle'>) => profileOf(m.handle).bio ?? BIO[m.name],
  }
}

/**
 * The forum as bundled at build time. Build-time readers (sitemap, llms.txt, og images, the home page)
 * use these; the forum pages read the live copy through getForum() in src/lib/forum/live.ts.
 */
export const BUNDLED_INPUT: ForumInput = {
  articles: articlesData as Article[],
  replies: repliesData as Reply[],
  profiles: profilesData as Record<string, Profile>,
  members: membersData as MemberLink[],
}
const BUNDLED = buildForum(BUNDLED_INPUT)
export const REPLIES: Reply[] = BUNDLED.replies
export const PROFILES: Record<string, Profile> = BUNDLED.profiles
export const TOPICS: Topic[] = BUNDLED.topics
export const MEMBERS: Member[] = BUNDLED.members
export const repliesTo = BUNDLED.repliesTo
export const profileOf = BUNDLED.profileOf
export const topicsIn = BUNDLED.topicsIn
export const memberOf = BUNDLED.memberOf
export const memberByHandle = BUNDLED.memberByHandle
export const postsOf = BUNDLED.postsOf
export const bioOf = BUNDLED.bioOf

/** The link-preview card for a forum page (see /og/crypt/[id]). */
export const cryptOg = (id: string, alt: string) => {
  const url = `https://qubic.church/og/crypt/${id}.png`
  return {
    images: [{ url, width: 1200, height: 630, alt }],
    twitter: { card: 'summary_large_image' as const, images: [url], title: alt },
  }
}
