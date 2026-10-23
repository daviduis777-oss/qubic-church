import { getTranslations, setRequestLocale } from 'next-intl/server'
import { seoDescription, seoTitle, seoTitleText } from '@/lib/seo'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import type { Metadata } from 'next'

import '@/styles/mdx.css'

import { DashboardTableOfContents } from '@/components/docs/toc'
import { DocumentNotFound } from '@/components/docs/not-found'
import { getTableOfContents } from '@/lib/opendocs/utils/toc'
import type { DocPageProps } from '@/lib/opendocs/types/docs'
import { DocBreadcrumb } from '@/components/docs/breadcrumb'
import { getDocFromParams } from '@/lib/opendocs/utils/doc'
import { DocHeading } from '@/components/docs/heading'
import { DocsPager } from '@/components/docs/pager'
import { DocLinks } from '@/components/docs/links'
import { allDocs } from 'contentlayer/generated'
import { defaultLocale } from '@/config/i18n'
import { Mdx } from '@/components/docs/mdx'
import { siteConfig } from '@/config/site'
import { absoluteUrl } from '@/lib/utils'

export const dynamicParams = true

export async function generateMetadata(props: {
  params: Promise<DocPageProps['params']>
}): Promise<Metadata> {
  const params = await props.params
  const locale = params.locale

  setRequestLocale(locale || defaultLocale)

  const doc = await getDocFromParams({ params })

  if (!doc) {
    return {}
  }

  const [, ...docSlugList] = doc.slugAsParams.split('/')
  const docSlug = docSlugList.join('/') || ''

  return {
    title: seoTitle(doc.title),
    description: seoDescription(doc.description),

    ...(doc.noindex && {
      robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
    }),

    alternates: { canonical: absoluteUrl(`/docs${docSlug ? `/${docSlug}` : ''}`) },

    openGraph: {
      type: 'article',
      title: seoTitleText(doc.title),
      url: absoluteUrl(`/docs${docSlug ? `/${docSlug}` : ''}`),
      description: seoDescription(doc.description),

      images: [
        {
          ...siteConfig.og.size,
          url: siteConfig.og.image,
          alt: siteConfig.name,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: seoTitleText(doc.title),
      description: seoDescription(doc.description),
      images: [siteConfig.og.image],
      creator: siteConfig.links.twitter.username,
    },
  }
}

export async function generateStaticParams(): Promise<
  DocPageProps['params'][]
> {
  const docs = allDocs.map(doc => {
    const [locale, ...slugs] = doc.slugAsParams.split('/')

    return {
      slug: slugs,
      locale: locale as LocaleOptions,
    }
  })

  return docs
}

export default async function DocPage(props: {
  params: Promise<DocPageProps['params']>
}) {
  const params = await props.params
  setRequestLocale(params.locale || defaultLocale)

  const doc = await getDocFromParams({ params })
  const t = await getTranslations('docs')

  if (!doc) {
    return (
      <DocumentNotFound
        messages={{
          title: t('not_found.title'),
          description: t('not_found.description'),
        }}
      />
    )
  }

  const toc = await getTableOfContents(doc.body.raw)

  return (
    <article className="relative py-8 lg:py-10 xl:flex xl:gap-12">
      <div className="w-full min-w-0 flex-1">
        <DocBreadcrumb
          doc={doc}
          messages={{
            docs: t('docs'),
          }}
        />

        <DocHeading doc={doc} locale={params.locale} />
        <DocLinks doc={doc} />

        <div className="pt-10 pb-14">
          <Mdx code={doc.body.code} />
        </div>

        <DocsPager doc={doc} locale={params.locale} />
      </div>

      {doc.toc && (
        <div className="hidden w-56 shrink-0 text-sm xl:block">
          <div className="sticky top-14 max-h-under-header overflow-y-auto pt-6 pb-10">
            <DashboardTableOfContents
              messages={{
                onThisPage: t('on_this_page'),
                editPageOnGitHub: t('edit_page_on_github'),
                startDiscussionOnGitHub: t('start_discussion_on_github'),
              }}
              sourceFilePath={doc._raw.sourceFilePath}
              toc={toc}
            />
          </div>
        </div>
      )}
    </article>
  )
}
