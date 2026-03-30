import Link from 'next/link'
import { compareDesc } from 'date-fns'
import { allBlogs } from 'contentlayer/generated'
import { ArrowRight, Calendar, Newspaper } from 'lucide-react'
import { getSlugWithoutLocale } from '@/lib/opendocs/utils/locale'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface LatestUpdatesProps {
  locale?: string
  limit?: number
}

export function LatestUpdates({ locale = 'en', limit = 3 }: LatestUpdatesProps) {
  const posts = allBlogs
    .filter((b) => {
      const [localeFromSlug] = b.slugAsParams.split('/')
      return localeFromSlug === locale
    })
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .slice(0, limit)

  if (posts.length === 0) return null

  return (
    <section className="w-full py-12 md:py-16 border-t border-white/[0.04] bg-[#050505]">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Newspaper className="w-4 h-4 text-[#D4AF37]/50" />
              <span className="text-xs font-mono text-[#D4AF37]/60 uppercase tracking-wider">
                Research Updates
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white/90">
              Latest findings
            </h2>
            <p className="text-sm text-white/40 mt-1">
              What has been added, fixed, or discovered recently.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/docs/changelog"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white/60 transition-colors"
            >
              Changelog
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors border border-[#D4AF37]/20 px-3 py-1.5"
            >
              All updates
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map((post) => {
            const postLink = getSlugWithoutLocale(post.slug, 'blog')
            const tags = (post.tags ?? []).filter(
              (t): t is string => typeof t === 'string'
            )

            return (
              <Link
                key={post._id}
                href={postLink}
                className="group flex flex-col p-5 bg-white/[0.01] border border-white/[0.04] hover:border-[#D4AF37]/20 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs font-mono text-white/30 mb-3">
                  <Calendar className="w-3 h-3" />
                  {formatDate(post.date)}
                </div>
                <h3 className="text-base font-medium text-white/80 group-hover:text-[#D4AF37] transition-colors mb-2 leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-white/45 leading-relaxed line-clamp-3 mb-3">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono text-white/30 px-1.5 py-0.5 bg-white/[0.02] border border-white/[0.04]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
