import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'

import { getTranslations } from 'next-intl/server'

import { getServerDocsConfig } from '@/lib/opendocs/utils/get-server-docs-config'
import type { NavItem, NavItemWithChildren } from '@/lib/opendocs/types/nav'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import type { Doc } from 'contentlayer/generated'
import { Link } from '@/navigation'
import { cn } from '@/lib/utils'

import {
  getSlugWithoutLocale,
  getObjectValueByLocale,
} from '@/lib/opendocs/utils/locale'

interface DocsPagerProps {
  doc: Doc
  locale: LocaleOptions
}

export async function DocsPager({ doc, locale }: DocsPagerProps) {
  const pager = await getPagerForCurrentDoc({
    doc,
    locale,
  })

  if (!pager) {
    return null
  }

  const t = await getTranslations('docs')
  const cardClass =
    'group flex min-w-0 flex-1 flex-col gap-1 border border-border px-4 py-3 transition-colors duration-150 ease-out hover:border-gold/50 hover:bg-surface-1'

  return (
    <nav
      aria-label="Previous and next"
      className="mt-4 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row"
    >
      {pager?.prev?.href ? (
        <Link className={cardClass} href={pager.prev.href}>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronLeftIcon aria-hidden="true" className="size-4" />
            {t('previous')}
          </span>
          <span className="truncate font-medium text-foreground group-hover:text-gold">
            {getObjectValueByLocale(pager.prev.title, pager.currentLocale)}
          </span>
        </Link>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}

      {pager?.next?.href && (
        <Link
          className={cn(cardClass, 'items-end text-right')}
          href={pager.next.href}
        >
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {t('next')}
            <ChevronRightIcon aria-hidden="true" className="size-4" />
          </span>
          <span className="max-w-full truncate font-medium text-foreground group-hover:text-gold">
            {getObjectValueByLocale(pager.next.title, pager.currentLocale)}
          </span>
        </Link>
      )}
    </nav>
  )
}

export async function getPagerForCurrentDoc({
  doc,
  locale,
}: {
  doc: Doc
  locale: LocaleOptions
}) {
  const docsConfig = await getServerDocsConfig({ locale })
  const flattenedLinks = [null, ...flatten(docsConfig.docs.sidebarNav), null]

  const slugWithoutLocaleFolder = getSlugWithoutLocale(doc.slug, 'docs')

  const activeIndex = flattenedLinks.findIndex(
    link => slugWithoutLocaleFolder === link?.href
  )

  const prev = activeIndex !== 0 ? flattenedLinks[activeIndex - 1] : null

  const next =
    activeIndex !== flattenedLinks.length - 1
      ? flattenedLinks[activeIndex + 1]
      : null

  return {
    prev,
    next,
    currentLocale: docsConfig.currentLocale,
  }
}

export function flatten(links: NavItemWithChildren[]): NavItem[] {
  const result: NavItem[] = []

  for (const link of links) {
    if (link.href) {
      result.push(link)
    }

    if (link.items?.length > 0) {
      result.push(...flatten(link.items))
    }
  }

  return result.filter(link => !link?.disabled)
}
