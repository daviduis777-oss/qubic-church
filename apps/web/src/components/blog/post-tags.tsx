import type { Blog } from 'contentlayer/generated'
import { badgeVariants } from '../ui/badge'
import { Link } from '@/navigation'

export async function BlogPostTags({ post }: { post: Blog }) {
  if (!post.tags) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-5">
      {post.tags.map(tag => (
        <Link
          className={badgeVariants({ variant: 'tag' })}
          href={`/blog?tag=${encodeURI(tag)}`}
          key={tag}
        >
          {tag}
        </Link>
      ))}
    </div>
  )
}
