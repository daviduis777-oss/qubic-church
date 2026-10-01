'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'

import type { TableOfContents } from '@/lib/opendocs/utils/toc'
import { useMounted } from '@/lib/opendocs/hooks/use-mounted'
import { Separator } from '@/components/ui/separator'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

interface DefaultTableOfContentItemsProps {
  sourceFilePath: string

  messages: {
    onThisPage: string
    editPageOnGitHub: string
    startDiscussionOnGitHub: string
  }
}

interface DashboardTableOfContentsProps
  extends DefaultTableOfContentItemsProps {
  toc: TableOfContents
}

export function DashboardTableOfContents({
  toc,
  messages,
  sourceFilePath,
}: DashboardTableOfContentsProps) {
  const itemIds = useMemo(
    () =>
      toc.items
        ? toc.items
            .flatMap(item => [item.url, item?.items?.map(item => item.url)])
            .flat()
            .filter(Boolean)
            .map(id => id?.split('#')[1])
        : [],
    [toc]
  )

  const mounted = useMounted()
  const activeHeading = useActiveItem(itemIds as string[])

  if (!toc?.items || !mounted) {
    return (
      <div className="space-y-2">
        <DefaultTableOfContentItems
          messages={messages}
          sourceFilePath={sourceFilePath}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="eyebrow text-muted-foreground">{messages.onThisPage}</p>

      <Tree activeItem={activeHeading as string} tree={toc} />

      <div className="py-4">
        <Separator />
      </div>

      <DefaultTableOfContentItems
        messages={messages}
        sourceFilePath={sourceFilePath}
      />
    </div>
  )
}

function DefaultTableOfContentItems({
  messages,
  sourceFilePath,
}: DefaultTableOfContentItemsProps) {
  return (
    <div className="mt-2 flex flex-col gap-1">
      <a
        className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        href={`${siteConfig.links.github.url}/edit/main/apps/content/${sourceFilePath}`}
      >
        {messages.editPageOnGitHub}{' '}
        <ExternalLink aria-hidden="true" size={12} />
      </a>

      <a
        className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        href={`${siteConfig.links.github.url}/discussions/new/choose`}
      >
        {messages.startDiscussionOnGitHub}{' '}
        <ExternalLink aria-hidden="true" size={12} />
      </a>
    </div>
  )
}

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0% 0% -80% 0%' }
    )

    itemIds?.forEach(id => {
      const element = document.getElementById(id)

      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      itemIds?.forEach(id => {
        const element = document.getElementById(id)

        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [itemIds])

  return activeId
}

interface TreeProps {
  level?: number
  activeItem?: string
  tree: TableOfContents
}

function Tree({ tree, level = 1, activeItem }: TreeProps) {
  return tree?.items?.length && level < 3 ? (
    <ul
      className={cn('m-0 list-none', level === 1 && 'border-l border-border')}
    >
      {tree.items.map(item => {
        return (
          <li className="mt-0" key={`${item.url}-${item.title}`}>
            <a
              className={cn(
                '-ml-px block border-l py-1 leading-snug no-underline transition-colors duration-150 ease-out',
                level === 1 ? 'pl-3' : 'pl-6',
                item.url === `#${activeItem}`
                  ? 'border-gold text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              href={item.url}
            >
              {item.title}
            </a>

            {item.items?.length ? (
              <Tree activeItem={activeItem} level={level + 1} tree={item} />
            ) : null}
          </li>
        )
      })}
    </ul>
  ) : null
}
