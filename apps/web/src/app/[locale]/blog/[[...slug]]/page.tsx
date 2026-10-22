import Link from 'next/link'
import { compareDesc } from 'date-fns'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'

import '@/styles/mdx.css'

import { BlogPostBreadcrumb } from '@/components/blog/breadcrumb'
import { DashboardTableOfContents } from '@/components/docs/toc'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { getBlogFromParams } from '@/lib/opendocs/utils/blog'
import { getTableOfContents } from '@/lib/opendocs/utils/toc'
import { BlogPostHeading } from '@/components/blog/heading'
import { BlogPostTags } from '@/components/blog/post-tags'
import { AuthorCard } from '@/components/blog/author'
import { allBlogs } from 'contentlayer/generated'
import { defaultLocale } from '@/config/i18n'
import { Mdx } from '@/components/docs/mdx'
import { PageHeader } from '@/components/ui/page-header'
import { siteConfig } from '@/config/site'
import { absoluteUrl } from '@/lib/utils'

interface BlogPageProps {
  params: Promise<{
    slug: string[]
    locale: LocaleOptions
  }>
}

export const dynamicParams = true

export async function generateMetadata(
  props: BlogPageProps
): Promise<Metadata> {
  const params = await props.params
  const locale = params.locale || defaultLocale

  setRequestLocale(locale)

  const [t, blogPost] = await Promise.all([
    getTranslations('site'),
    getBlogFromParams({ params }),
  ])

  if (!blogPost) {
    const title = t('words.blog')
    const description = t('description')

    const tags = new Set(allBlogs.flatMap(blog => blog.tags).filter(Boolean))

    const ogImage = absoluteUrl('/blog-og/introducing-blogs-og.jpg')

    return {
      title,
      description,
      keywords: Array.from(tags),

      openGraph: {
        title,
        description,
        type: 'website',
        url: absoluteUrl('/blog'),

        images: [
          {
            ...siteConfig.og.size,
            url: ogImage,
            alt: siteConfig.name,
          },
        ],
      },

      twitter: {
        title,
        description,
        images: [ogImage],
        card: 'summary_large_image',
        creator: siteConfig.links.twitter.username,
      },
    }
  }

  const [, ...blogSlugList] = blogPost.slugAsParams.split('/')
  const blogSlug = blogSlugList.join('/') || ''

  const postAuthorName = blogPost.author?.name || siteConfig.author.name
  const postAuthorUrl = blogPost.author?.site || siteConfig.author.site

  const postAuthorTwitter =
    blogPost.author?.social?.twitter || siteConfig.links.twitter.username

  const postOgImage = blogPost.og_image
    ? absoluteUrl(`/blog-og/${blogPost.og_image}`)
    : absoluteUrl(`/${locale}/blog/og/${blogSlug}`)

  return {
    title: blogPost.title,
    description: blogPost.excerpt,
    keywords: blogPost.tags || [],

    authors: {
      url: postAuthorUrl,
      name: postAuthorName,
    },

    openGraph: {
      type: 'article',
      title: blogPost.title,
      authors: postAuthorName,
      description: blogPost.excerpt,
      url: absoluteUrl(`/blog/${blogSlug}`),

      images: [
        {
          ...siteConfig.og.size,
          url: postOgImage,
          alt: blogPost.title,
        },
      ],
    },

    twitter: {
      title: blogPost.title,
      images: [postOgImage],
      creator: postAuthorTwitter,
      card: 'summary_large_image',
      description: blogPost.excerpt,
    },
  }
}

export async function generateStaticParams(): Promise<
  BlogPageProps['params'][]
> {
  const blog = allBlogs.map(blog => {
    const [locale, ...slugs] = blog.slugAsParams.split('/')

    return {
      slug: slugs,
      locale: locale as LocaleOptions,
    }
  })

  return blog as unknown as BlogPageProps['params'][]
}

export default async function BlogPage(props: BlogPageProps) {
  const params = await props.params
  const locale = params.locale || defaultLocale

  setRequestLocale(locale)

  const t = await getTranslations()
  const blogPost = await getBlogFromParams({ params })

  if (!blogPost) {
    return (
      <>
        <PageHeader title={t('blog.words.posts')} />
        <ol className="mx-auto w-full max-w-3xl divide-y divide-border border-y border-border">
          {allBlogs
            .filter(b => b.slugAsParams.split('/')[0] === locale)
            .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
            .map(b => (
              <li className="py-6" key={b.slugAsParams}>
                <time className="eyebrow text-fg-2" dateTime={b.date}>
                  {new Date(b.date).toISOString().slice(0, 10)}
                </time>
                <h2 className="mt-2 text-xl font-semibold leading-snug md:text-2xl">
                  <Link className="hover:text-gold" href={`/blog/${b.slugAsParams.split('/').slice(1).join('/')}`}>
                    {b.title}
                  </Link>
                </h2>
                {b.excerpt && <p className="mt-2 text-fg-2">{b.excerpt}</p>}
              </li>
            ))}
        </ol>
      </>
    )
  }

  const toc = await getTableOfContents(blogPost.body.raw)

  return (
    <article className="relative pb-8 lg:flex lg:gap-12">
      <div className="min-w-0 flex-1">
        <BlogPostBreadcrumb
          messages={{
            posts: t('blog.words.posts'),
          }}
          post={blogPost}
        />

        <BlogPostHeading
          locale={locale}
          messages={{
            by: t('blog.words.by'),
            min_read: t('blog.cards.min_read'),
          }}
          post={blogPost}
        />

        <BlogPostTags post={blogPost} />

        <div className="pt-10 pb-14">
          <Mdx code={blogPost.body.code} />
        </div>

        <AuthorCard post={blogPost} />
      </div>

      <div className="hidden w-56 shrink-0 text-sm lg:block">
        <div className="sticky top-14 max-h-under-header overflow-y-auto pt-6 pb-10">
          <DashboardTableOfContents
            messages={{
              onThisPage: t('docs.on_this_page'),
              editPageOnGitHub: t('docs.edit_page_on_github'),
              startDiscussionOnGitHub: t('docs.start_discussion_on_github'),
            }}
            sourceFilePath={blogPost._raw.sourceFilePath}
            toc={toc}
          />
        </div>
      </div>
    </article>
  )
}
