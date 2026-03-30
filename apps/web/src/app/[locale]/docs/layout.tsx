import { setRequestLocale } from 'next-intl/server'

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

  return (
    <div className="relative z-10 border-b border-border/40 bg-background overflow-x-hidden">
      <div className="container px-4 sm:px-6 md:px-8">
        <div className="flex gap-6 lg:gap-10">
          <aside className="hidden w-[220px] shrink-0 md:block lg:w-[240px]">
            <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-6 pr-6 lg:py-8">
              <DocsSidebarNav
                items={docsConfig.docs.sidebarNav}
                locale={docsConfig.currentLocale}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1 max-w-full overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
