import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'

import { getServerDocsConfig } from '@/lib/opendocs/utils/get-server-docs-config'
import type { NavItem, NavItemWithChildren } from '@/lib/opendocs/types/nav'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import type { Doc } from 'contentlayer/generated'
import { buttonVariants } from '../ui/button'
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

  return (
    <div className="flex flex-row items-center justify-between">
      {pager?.prev?.href && (
        <Link
          className={buttonVariants({ variant: 'outline' })}
          href={pager.prev.href}
        >
          <ChevronLeftIcon className="mr-2 size-4" />

          {getObjectValueByLocale(pager.prev.title, pager.currentLocale)}
        </Link>
      )}

      {pager?.next?.href && (
        <Link
          className={cn(buttonVariants({ variant: 'outline' }), 'ml-auto')}
          href={pager.next.href}
        >
          {getObjectValueByLocale(pager.next.title, pager.currentLocale)}

          <ChevronRightIcon className="ml-2 size-4" />
        </Link>
      )}
    </div>
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
