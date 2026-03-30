import { setRequestLocale } from 'next-intl/server'

import type { LocaleOptions } from '@/lib/opendocs/types/i18n'

interface BlogLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: LocaleOptions
  }>
}

export const dynamicParams = true

export default async function BlogLayout(props: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const params = await props.params

  const blogProps: BlogLayoutProps = {
    children: props.children,
    params: Promise.resolve({ locale: params.locale as LocaleOptions }),
  }
  const typedParams = await blogProps.params
  const locale = typedParams.locale

  const { children } = props

  setRequestLocale(locale)

  return (
    <div className="container mx-auto max-w-container px-4 pt-6 sm:px-6 lg:px-8">
      {children}
    </div>
  )
}
