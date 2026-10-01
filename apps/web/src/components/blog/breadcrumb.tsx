import type { Blog } from 'contentlayer/generated'
import { ChevronRightIcon } from 'lucide-react'

import { Link } from '@/navigation'

interface BlogPostBreadcrumbProps {
  post: Blog

  messages: {
    posts: string
  }
}

export function BlogPostBreadcrumb({
  post,
  messages,
}: BlogPostBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex min-w-0 items-center gap-1 text-sm text-muted-foreground"
    >
      <Link
        className="shrink-0 transition-colors hover:text-foreground"
        href="/blog"
      >
        {messages.posts}
      </Link>

      <ChevronRightIcon aria-hidden="true" className="size-3.5 shrink-0" />

      <span aria-current="page" className="truncate text-fg-2">
        {post.title}
      </span>
    </nav>
  )
}
