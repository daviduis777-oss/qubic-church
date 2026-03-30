'use client'

import { useSearchParams } from 'next/navigation'
import Balancer from 'react-wrap-balancer'
import { compareDesc } from 'date-fns'
import { useMemo } from 'react'

import {
  getSlugWithoutLocale,
  getObjectValueByLocale,
} from '@/lib/opendocs/utils/locale'

import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { cn, formatDate, truncateText } from '@/lib/utils'
import { BlogPostItemTags } from './post-item-tags'
import type { Blog } from 'contentlayer/generated'
import { buttonVariants } from '../ui/button'
import { dateLocales } from '@/config/i18n'
import { Pagination } from './pagination'
import { RSSToggle } from './rss-toggle'
import { ReadTime } from './read-time'
import { Link } from '@/navigation'
import { Card } from '../ui/card'

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
    <main className="relative max-w-5xl mx-auto space-y-6 grid">
      <RSSToggle
        messages={{
          rss_feed: messages.rss_feed,
        }}
      />

      <div
        className={cn('grid gap-4 grid-cols-1', {
          'md:grid-cols-2': paginatedPosts.length >= 2,
          'md:grid-cols-1': paginatedPosts.length < 2,
        })}
      >
        {paginatedPosts.map(post => {
          const postLink = getSlugWithoutLocale(post.slug, 'blog')

          return (
            <Card
              className="flex flex-col p-4 md:p-8 w-full h-full backdrop-blur-lg dark:bg-card-primary justify-between"
              key={post._id}
            >
              <div>
                <div className="flex items-center mb-2 text-xs text-muted-foreground justify-between gap-1">
                  <time dateTime={post.date}>
                    {formatDate(
                      post.date,
                      getObjectValueByLocale(dateLocales, locale)
                    )}
                  </time>

                  <ReadTime
                    messages={{
                      min_read: messages.min_read,
                    }}
                    time={post.readTimeInMinutes}
                    variant="unstyled"
                  />
                </div>

                <Link
                  className={cn('hover:opacity-65 transition-all')}
                  href={postLink}
                >
                  <h1 className="text-xl py-2">
                    <Balancer>{post.title}</Balancer>
                  </h1>
                </Link>

                <p className="text-muted-foreground">
                  <Balancer>{truncateText(post.excerpt, 148)}</Balancer>
                </p>
              </div>

              <BlogPostItemTags post={post} />

              <Link
                className={cn(
                  'dark:hover:text-primary dark:text-primary-active transition-all',
                  buttonVariants({ variant: 'link' }),
                  'h-fit p-0 flex self-end mt-1'
                )}
                href={postLink}
              >
                {messages.read_more}
              </Link>
            </Card>
          )
        })}
      </div>

      <Pagination
        messages={messages}
        numberOfPages={totalOfPages}
        pagesToShow={10}
      />
    </main>
  )
}
