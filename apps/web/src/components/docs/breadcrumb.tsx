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
    <div className="text-muted-foreground mb-4 flex items-center space-x-1 text-sm">
      <Link className="text-foreground hover:underline" href="/docs">
        {messages.docs}
      </Link>

      {breadcrumbItems?.map((item, index, items) => {
        const isLastItem = index === items.length - 1
        const docTitle = getObjectValueByLocale(item.title, locale)

        return (
          <Fragment key={`${item.href || 'no-href'}-${docTitle}-${index}`}>
            <ChevronRightIcon className="size-4" />

            {item.href && !isLastItem ? (
              <Link
                className="truncate text-foreground font-medium hover:underline"
                href={item.href}
              >
                {docTitle}
              </Link>
            ) : (
              <span className="truncate">{docTitle}</span>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
