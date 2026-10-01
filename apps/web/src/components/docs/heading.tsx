import Balancer from 'react-wrap-balancer'

import { DocNotAvailableInThisLanguage } from './not-available'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import type { Doc } from 'contentlayer/generated'

interface DocHeadingProps {
  doc: Doc & { notAvailable: boolean }
  locale: LocaleOptions
}

export function DocHeading({ doc, locale }: DocHeadingProps) {
  return (
    <div className="measure space-y-3">
      <h1 className="scroll-m-24 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
        {doc.title}
      </h1>

      {doc.description && (
        <p className="text-lg leading-relaxed text-fg-2">
          <Balancer>{doc.description}</Balancer>
        </p>
      )}

      {doc.notAvailable && <DocNotAvailableInThisLanguage locale={locale} />}
    </div>
  )
}
