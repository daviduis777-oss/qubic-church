import { getTranslations } from 'next-intl/server'
import { ExternalLinkIcon } from 'lucide-react'

import type { Doc } from 'contentlayer/generated'
import { badgeVariants } from '../ui/badge'
import { Link } from '@/navigation'
import { cn } from '@/lib/utils'

export async function DocLinks({ doc }: { doc: Doc }) {
  if (!doc?.links) {
    return null
  }

  const tDocs = await getTranslations('docs')
  const tSite = await getTranslations('site')

  return (
    <div className="flex items-center space-x-2 pt-4">
      {doc.links?.source && (
        <Link
          className={cn(badgeVariants({ variant: 'secondary' }), 'gap-1')}
          href={doc.links.source}
          rel="noreferrer"
          target="_blank"
        >
          {tDocs('source')}

          <ExternalLinkIcon className="size-3" />
        </Link>
      )}

      {doc.links?.doc && (
        <Link
          className={cn(badgeVariants({ variant: 'secondary' }), 'gap-1')}
          href={doc.links.doc}
          rel="noreferrer"
          target="_blank"
        >
          {tDocs('docs')}

          <ExternalLinkIcon className="size-3" />
        </Link>
      )}

      {doc.links?.api && (
        <Link
          className={cn(badgeVariants({ variant: 'secondary' }), 'gap-1')}
          href={doc.links.api}
          rel="noreferrer"
          target="_blank"
        >
          {tDocs('api_reference')}

          <ExternalLinkIcon className="size-3" />
        </Link>
      )}

      {doc.links?.blog && (
        <Link
          className={cn(badgeVariants({ variant: 'secondary' }), 'gap-1')}
          href={doc.links.blog}
          rel="noreferrer"
          target="_blank"
        >
          {tSite('words.blog')}

          <ExternalLinkIcon className="size-3" />
        </Link>
      )}
    </div>
  )
}
