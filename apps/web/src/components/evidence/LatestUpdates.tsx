import Link from 'next/link'
import { compareDesc } from 'date-fns'
import { allBlogs } from 'contentlayer/generated'
import { ArrowRight } from 'lucide-react'
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

export function LatestUpdates({
  locale = 'en',
  limit = 3,
}: LatestUpdatesProps) {
  const posts = allBlogs
    .filter(b => {
      const [localeFromSlug] = b.slugAsParams.split('/')
      return localeFromSlug === locale
    })
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .slice(0, limit)

  if (posts.length === 0) return null

  return (
    <section className="w-full border-t border-border py-12 md:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2 text-gold">Research Updates</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Latest findings
            </h2>
            <p className="mt-1 text-sm text-fg-2">
              What has been added, fixed, or discovered recently.
            </p>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link
              className="text-fg-2 transition-colors hover:text-foreground"
              href="/docs/changelog"
            >
              Changelog
            </Link>
            <Link
              className="inline-flex items-center gap-1.5 font-medium text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold"
              href="/blog"
            >
              All updates
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        </div>

        <ol className="grid gap-px border border-border bg-border md:grid-cols-3">
          {posts.map(post => {
            const postLink = getSlugWithoutLocale(post.slug, 'blog')
            const tags = (post.tags ?? []).filter(
              (t): t is string => typeof t === 'string'
            )

            return (
              <li className="bg-card" key={post._id}>
                <Link
                  className="group flex h-full flex-col p-5 transition-colors duration-150 ease-out hover:bg-surface-2"
                  href={postLink}
                >
                  <time
                    className="mb-2 text-sm text-muted-foreground"
                    dateTime={post.date}
                  >
                    {formatDate(post.date)}
                  </time>
                  <h3 className="mb-2 font-medium leading-snug text-foreground transition-colors group-hover:text-gold">
                    {post.title}
                  </h3>
                  <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-fg-2">
                    {post.excerpt}
                  </p>
                  {tags.length > 0 && (
                    <p className="mt-auto text-xs text-muted-foreground">
                      {tags.slice(0, 3).join(' · ')}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
