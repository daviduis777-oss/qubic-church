'use client'

import { Fragment } from 'react'

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

import { getObjectValueByLocale } from '@/lib/opendocs/utils/locale'
import { Link as DesktopLink, usePathname } from '@/navigation'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import type { SidebarNavItem } from '@/lib/opendocs/types/nav'
import { MobileLink } from '../mobile-link'
import { cn } from '@/lib/utils'

export interface DocsSidebarNavProps {
  items: SidebarNavItem[]
  locale: LocaleOptions
  isMobile?: boolean
  handleMobileSidebar?: (state: boolean) => void
}

export function DocsSidebarNav({
  items,
  locale,
  isMobile,
  handleMobileSidebar,
}: DocsSidebarNavProps) {
  const pathname = usePathname()

  return items.length > 0 ? (
    <div
      className={cn(
        !isMobile && 'w-full',
        isMobile && 'flex flex-col space-y-3 pt-6 pr-3'
      )}
    >
      {items.map((item, index) => (
        <div
          className={cn('pb-6')}
          key={`${getObjectValueByLocale(item.title, locale)}-${index}`}
        >
          <h4
            className={cn(
              !isMobile && 'mb-2 text-sm font-semibold text-foreground',
              isMobile && 'font-medium'
            )}
          >
            {getObjectValueByLocale(item.title, locale)}
          </h4>
          {item?.items?.length > 0 && (
            <DocsSidebarNavItems
              handleMobileSidebar={handleMobileSidebar}
              isMobile={isMobile}
              items={item.items}
              locale={locale}
              pathname={pathname}
            />
          )}
        </div>
      ))}
    </div>
  ) : null
}

interface DocsSidebarNavItemsProps {
  items: SidebarNavItem[]
  locale: LocaleOptions
  pathname: string | null
  isMobile?: boolean
  handleMobileSidebar?: (state: boolean) => void
}

const accordionsStates = new Map<string, boolean>()

function toggleAccordionState(id: string) {
  accordionsStates.set(id, !accordionsStates.get(id))
}

interface ChildrenComponentProps {
  item: SidebarNavItem
  pathname: string | null
  locale: LocaleOptions
  isMobile?: boolean
  handleMobileSidebar?: (state: boolean) => void
}

function ChildrenComponent({
  item,
  pathname,
  locale,
  isMobile,
  handleMobileSidebar,
}: ChildrenComponentProps) {
  const activeChild = item?.items?.find(
    childItem => childItem.href === pathname
  )

  return (
    item.items.length > 0 && (
      <Accordion
        className="py-2"
        collapsible
        defaultValue={
          activeChild?.title ||
          accordionsStates.get(getObjectValueByLocale(item.title, locale))
            ? getObjectValueByLocale(item.title, locale)
            : ''
        }
        onValueChange={() =>
          toggleAccordionState(getObjectValueByLocale(item.title, locale))
        }
        type="single"
      >
        <AccordionItem value={getObjectValueByLocale(item.title, locale)}>
          <AccordionTrigger className="py-0 pb-3">
            <h4 className="flex items-center gap-2 pl-3 text-sm font-medium text-fg-2">
              {getObjectValueByLocale(item.title, locale)}

              {item.label && (
                <span className="h-fit border border-gold/50 px-1.5 py-0.5 text-xs leading-none text-gold">
                  {getObjectValueByLocale(item.label, locale)}
                </span>
              )}
            </h4>
          </AccordionTrigger>

          <AccordionContent>
            <div className="pl-4">
              <DocsSidebarNavItems
                handleMobileSidebar={handleMobileSidebar}
                isMobile={isMobile}
                items={item.items}
                locale={locale}
                pathname={pathname}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  )
}

export function DocsSidebarNavItems({
  items,
  pathname,
  locale,
  isMobile,
  handleMobileSidebar,
}: DocsSidebarNavItemsProps) {
  const Link = !isMobile ? DesktopLink : MobileLink

  return items?.length ? (
    <div className="grid grid-flow-row auto-rows-max border-l border-border text-sm">
      {items.map(item => {
        const key =
          getObjectValueByLocale(item.title, locale) +
          (item.href || '') +
          pathname

        const props =
          isMobile && item.href ? { onOpenChange: handleMobileSidebar } : {}

        return item.href && !item.disabled ? (
          <Fragment key={key}>
            <Link
              href={item.href}
              {...props}
              className={cn(
                '-ml-px flex h-fit w-full items-center gap-2 border-l py-1.5 pl-3 leading-snug transition-colors duration-150 ease-out',
                item.disabled && 'cursor-not-allowed opacity-60',
                pathname?.endsWith(item.href)
                  ? 'border-gold font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
              rel={item.external ? 'noreferrer' : ''}
              target={item.external ? '_blank' : ''}
            >
              {getObjectValueByLocale(item.title, locale)}

              {item.label && (
                <span className="border border-gold/50 px-1.5 py-0.5 text-xs leading-none text-gold">
                  {getObjectValueByLocale(item.label, locale)}
                </span>
              )}
            </Link>
          </Fragment>
        ) : (
          <Fragment key={key}>
            <ChildrenComponent
              handleMobileSidebar={handleMobileSidebar}
              isMobile={isMobile}
              item={item}
              locale={locale}
              pathname={pathname}
            />
          </Fragment>
        )
      })}
    </div>
  ) : null
}
