import { getTranslations, setRequestLocale } from 'next-intl/server'

import { getServerDocsConfig } from '@/lib/opendocs/utils/get-server-docs-config'
import { DocsSidebarNav } from '@/components/docs/sidebar-nav'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'

interface DocsLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: LocaleOptions
  }>
}

export const dynamicParams = true

export default async function DocsLayout(props: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const params = await props.params

  const docsProps: DocsLayoutProps = {
    children: props.children,
    params: Promise.resolve({ locale: params.locale as LocaleOptions }),
  }

  const typedParams = await docsProps.params
  const locale = typedParams.locale

  const { children } = props

  setRequestLocale(locale)

  const docsConfig = await getServerDocsConfig({ locale })
  const t = await getTranslations('docs')

  return (
    <div className="relative z-10 overflow-x-clip border-b border-border bg-background">
      <div className="container">
        {/* Phones and small tablets: the sidebar collapses into a disclosure */}
        <details className="group border-b border-border md:hidden">
          <summary className="flex h-12 cursor-pointer list-none items-center justify-between text-sm font-medium text-fg-2 ">
            {t('browse')}
            <span
              aria-hidden="true"
              className="text-muted-foreground transition-transform duration-200 ease-out group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="max-h-96 overflow-y-auto pb-4">
            <DocsSidebarNav
              items={docsConfig.docs.sidebarNav}
              locale={docsConfig.currentLocale}
            />
          </div>
        </details>

        <div className="flex gap-8 lg:gap-12">
          <aside className="hidden w-56 shrink-0 border-r border-border md:block lg:w-60">
            <div className="sticky top-14 max-h-under-header overflow-y-auto py-8 pr-4">
              <DocsSidebarNav
                items={docsConfig.docs.sidebarNav}
                locale={docsConfig.currentLocale}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
