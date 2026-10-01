import { ChevronRightIcon } from 'lucide-react'
import { Fragment } from 'react'

import { getObjectValueByLocale } from '@/lib/opendocs/utils/locale'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { getBreadcrumb } from '@/lib/opendocs/utils/doc'
import type { Doc } from 'contentlayer/generated'
import { defaultLocale } from '@/config/i18n'
import { Link } from '@/navigation'

interface DocBreadcrumbProps {
  doc: Doc

  messages: {
    docs: string
  }
}

export function DocBreadcrumb({ doc, messages }: DocBreadcrumbProps) {
  const [locale] = (doc.slugAsParams.split('/') || defaultLocale) as [
    LocaleOptions,
  ]

  const breadcrumbItems = getBreadcrumb(doc.slug)

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex min-w-0 items-center gap-1 text-sm text-muted-foreground"
    >
      <Link
        className="shrink-0 transition-colors hover:text-foreground"
        href="/docs"
      >
        {messages.docs}
      </Link>

      {breadcrumbItems?.map((item, index, items) => {
        const isLastItem = index === items.length - 1
        const docTitle = getObjectValueByLocale(item.title, locale)

        return (
          <Fragment key={`${item.href || 'no-href'}-${docTitle}-${index}`}>
            <ChevronRightIcon
              aria-hidden="true"
              className="size-3.5 shrink-0"
            />

            {item.href && !isLastItem ? (
              <Link
                className="truncate transition-colors hover:text-foreground"
                href={item.href}
              >
                {docTitle}
              </Link>
            ) : (
              <span aria-current="page" className="truncate text-fg-2">
                {docTitle}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
