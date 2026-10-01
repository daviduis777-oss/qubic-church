'use client'

import { useSearchParams } from 'next/navigation'
import { compareDesc } from 'date-fns'
import { useMemo } from 'react'

import {
  getSlugWithoutLocale,
  getObjectValueByLocale,
} from '@/lib/opendocs/utils/locale'

import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { formatDate, truncateText } from '@/lib/utils'
import { BlogPostItemTags } from './post-item-tags'
import type { Blog } from 'contentlayer/generated'
import { dateLocales } from '@/config/i18n'
import { Pagination } from './pagination'
import { RSSToggle } from './rss-toggle'
import { Link } from '@/navigation'

interface PaginatedBlogPostsProps {
  posts: Blog[]
  perPage?: number
  locale: LocaleOptions

  messages: {
    by: string
    next: string
    previous: string
    min_read: string
    rss_feed: string
    read_more: string
    go_to_next_page: string
    go_to_previous_page: string
  }
}

export function PaginatedBlogPosts({
  posts,
  locale,
  messages,
  perPage = 10,
}: PaginatedBlogPostsProps) {
  const searchParams = useSearchParams()
  const tag = searchParams.get('tag')

  const currentPage = useMemo(() => {
    const page = searchParams.get('page')

    return page ? Number.parseInt(page, 10) : 1
  }, [searchParams])

  const blogPosts = useMemo(() => {
    let blogPosts = posts

    if (tag) {
      blogPosts = blogPosts.filter(post => post.tags?.includes(decodeURI(tag)))
    }

    return blogPosts
  }, [posts, tag])

  const sortedPosts = useMemo(
    () =>
      blogPosts
        .filter(post => {
          const [localeFromSlug] = post.slugAsParams.split('/')

          return localeFromSlug === locale
        })
        .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date))),
    [blogPosts, locale]
  )

  const totalOfPages = useMemo(
    () => Math.ceil(sortedPosts.length / perPage),
    [sortedPosts.length, perPage]
  )

  const paginatedPosts = useMemo(
    () => sortedPosts.slice((currentPage - 1) * perPage, currentPage * perPage),
    [sortedPosts, currentPage, perPage]
  )

  return (
    <div className="relative mx-auto max-w-3xl space-y-8 pb-8">
      <div className="flex justify-end">
        <RSSToggle
          messages={{
            rss_feed: messages.rss_feed,
          }}
        />
      </div>

      <ol className="divide-y divide-border border-y border-border">
        {paginatedPosts.map(post => {
          const postLink = getSlugWithoutLocale(post.slug, 'blog')

          return (
            <li className="py-8" key={post._id}>
              <article>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <time dateTime={post.date}>
                    {formatDate(
                      post.date,
                      getObjectValueByLocale(dateLocales, locale)
                    )}
                  </time>
                  {post.readTimeInMinutes ? (
                    <span>
                      {post.readTimeInMinutes} {messages.min_read}
                    </span>
                  ) : null}
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance">
                  <Link
                    className="text-foreground transition-colors duration-150 ease-out hover:text-gold"
                    href={postLink}
                  >
                    {post.title}
                  </Link>
                </h2>

                <p className="measure mt-3 leading-7 text-pretty text-fg-2">
                  {truncateText(post.excerpt, 220)}
                </p>

                <BlogPostItemTags post={post} />

                <Link
                  className="mt-4 inline-flex text-sm font-medium text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold"
                  href={postLink}
                >
                  {messages.read_more}
                  <span className="sr-only">: {post.title}</span>
                </Link>
              </article>
            </li>
          )
        })}
      </ol>

      <Pagination
        messages={messages}
        numberOfPages={totalOfPages}
        pagesToShow={10}
      />
    </div>
  )
}
