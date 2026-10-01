import { DocNotAvailableInThisLanguage } from '../docs/not-available'
import { getObjectValueByLocale } from '@/lib/opendocs/utils/locale'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import type { Blog } from 'contentlayer/generated'
import { formatDate } from '@/lib/utils'
import { dateLocales } from '@/config/i18n'

interface BlogPostHeadingProps {
  locale: LocaleOptions
  post: Blog & { notAvailable: boolean }

  messages: {
    by: string
    min_read: string
  }
}

export function BlogPostHeading({
  post,
  locale,
  messages,
}: BlogPostHeadingProps) {
  return (
    <div className="measure space-y-4">
      <h1 className="scroll-m-24 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
        {post.title}
      </h1>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <time dateTime={post.date}>
          {formatDate(post.date, getObjectValueByLocale(dateLocales, locale))}
        </time>

        {post.author?.name && (
          <span>
            {messages.by} {post.author.name}
          </span>
        )}

        {post.readTimeInMinutes ? (
          <span>
            {post.readTimeInMinutes} {messages.min_read}
          </span>
        ) : null}
      </p>

      {post.excerpt && (
        <p className="text-lg leading-relaxed text-pretty text-fg-2">
          {post.excerpt}
        </p>
      )}

      {post.notAvailable && <DocNotAvailableInThisLanguage locale={locale} />}
    </div>
  )
}
