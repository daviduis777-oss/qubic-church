/** biome-ignore-all lint/performance/noImgElement: Using img elements for OG image generation */
import { allBlogs, type Blog } from 'contentlayer/generated'
import type { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'

import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { absoluteUrl, truncateText } from '@/lib/utils'
import { siteConfig } from '@/config/site'
import { getFonts } from '@/lib/fonts'

// Using Node.js runtime instead of edge due to size limits
export const runtime = 'nodejs'
export const dynamicParams = true

interface BlogOgProps {
  params: Promise<{ slug: string; locale: LocaleOptions }>
}

export async function GET(
  _: NextRequest,
  context: { params: Promise<{ locale: string; slug: string }> }
) {
  const params = await context.params

  const blogProps: BlogOgProps = {
    params: Promise.resolve({
      slug: params.slug,
      locale: params.locale as LocaleOptions,
    }),
  }
  const typedParams = await blogProps.params
  const post = getBlogPostBySlugAndLocale(typedParams.slug, typedParams.locale)

  if (!post) {
    return new ImageResponse(<Fallback src="/og.jpg" />, {
      ...siteConfig.og.size,
    })
  }

  const { bold, regular } = await getFonts()

  const fonts = []
  if (regular) {
    fonts.push({
      name: 'Geist',
      data: regular,
      style: 'normal' as const,
      weight: 400 as const,
    })
  }
  if (bold) {
    fonts.push({
      name: 'Geist',
      data: bold,
      style: 'normal' as const,
      weight: 700 as const,
    })
  }

  return new ImageResponse(
    <div
      tw={`bg-black flex flex-col min-w-full h-[${siteConfig.og.size.height}px] relative`}
    >
      <Background src="/og-background.jpg" />

      <div tw="my-10 mx-14 flex flex-col">
        <Logo src="/logo.svg" />

        <div tw="flex flex-col h-full max-h-[300px]">
          <Title>{post.title}</Title>
          <Author post={post} />
        </div>
      </div>
    </div>,
    {
      ...siteConfig.og.size,
      fonts,
    }
  )
}

function Author({ post }: { post: Blog }) {
  return (
    <div tw="flex items-center pt-10">
      {post.author?.image && (
        <img
          alt=""
          src={absoluteUrl(post.author?.image)}
          tw="w-20 h-20 rounded-full border-gray-800 border-4"
        />
      )}

      <span tw="ml-3 text-gray-400 text-3xl">{post.author?.name}</span>
    </div>
  )
}

function Background({ src }: { src: string }) {
  return (
    <img
      alt=""
      src={absoluteUrl(src)}
      tw="w-full h-full absolute left-0 top-0 opacity-70"
    />
  )
}

function Logo({ src }: { src: string }) {
  return <img alt="" src={absoluteUrl(src)} tw="w-28 h-28 rounded-full" />
}

function Title({ children }: { children: string }) {
  return (
    <div tw="pt-4 flex flex-col h-full justify-center">
      <h1 tw="text-white text-7xl w-full">{truncateText(children)}</h1>
    </div>
  )
}

function Fallback({ src }: { src: string }) {
  return (
    <div tw="flex w-full h-full">
      <img alt="" src={absoluteUrl(src)} tw="w-full h-full" />
    </div>
  )
}

function getBlogPostBySlugAndLocale(slug: string, locale: LocaleOptions) {
  return allBlogs.find(post => {
    const [postLocale, ...slugs] = post.slugAsParams.split('/')

    return slugs.join('/') === slug && postLocale === locale
  })
}
