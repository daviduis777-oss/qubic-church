import { LinkedInLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons'
import type { Blog } from 'contentlayer/generated'
import { Globe, Mail } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from '@/components/ui/card'

import { buttonVariants } from '../ui/button'
import { cn } from '@/lib/utils'
import { Icons } from '../icons'

export function AuthorCard({ post }: { post: Blog }) {
  const { author } = post

  return (
    <Card className="backdrop-blur-lg dark:bg-card-primary w-full">
      <CardHeader
        className={cn('flex gap-4 flex-wrap', 'flex-row items-center')}
      >
        {author?.image && author?.name && (
          <Image
            alt={author.name}
            className="w-20 rounded-full border-4 border-muted"
            height={80}
            src={author.image}
            width={80}
          />
        )}

        <div className="flex flex-col items-start justify-start">
          {author?.name && <CardTitle>{author.name}</CardTitle>}

          <CardContent className="p-0 pt-1">
            {author?.bio && <CardDescription>{author.bio}</CardDescription>}
          </CardContent>

          <div className="flex flex-wrap items-center w-full pt-2">
            {author?.site && (
              <Link
                aria-label={author.site}
                className={cn(
                  'text-accent-foreground w-fit',
                  buttonVariants({
                    variant: 'ghost',
                  }),
                  'px-2'
                )}
                href={author.site}
                rel="noopener noreferrer"
                target="_blank"
                title={author.site}
              >
                <Globe size={16} />
              </Link>
            )}

            {author?.social?.github && (
              <Link
                aria-label={author?.social?.github}
                className={cn(
                  'text-accent-foreground w-fit',
                  buttonVariants({
                    variant: 'ghost',
                  }),
                  'px-2'
                )}
                href={`https://github.com/${author?.social?.github}`}
                rel="noopener noreferrer"
                target="_blank"
                title={author?.social?.github}
              >
                <Icons.gitHub className="size-4" />
              </Link>
            )}

            {author?.social?.twitter && (
              <Link
                aria-label={author?.social?.twitter}
                className={cn(
                  'text-accent-foreground w-fit',
                  buttonVariants({
                    variant: 'ghost',
                  }),
                  'px-2'
                )}
                href={`https://x.com/${author?.social?.twitter}`}
                rel="noopener noreferrer"
                target="_blank"
                title={author?.social?.twitter}
              >
                <TwitterLogoIcon />
              </Link>
            )}

            {author?.social?.linkedin && (
              <Link
                aria-label={author?.social?.linkedin}
                className={cn(
                  'text-accent-foreground w-fit',
                  buttonVariants({
                    variant: 'ghost',
                  }),
                  'px-2'
                )}
                href={`https://linkedin.com/in/${author?.social?.linkedin}`}
                rel="noopener noreferrer"
                target="_blank"
                title={author?.social?.linkedin}
              >
                <LinkedInLogoIcon />
              </Link>
            )}

            {author?.social?.youtube && (
              <Link
                aria-label={author?.social?.youtube}
                className={cn(
                  'text-accent-foreground w-fit',
                  buttonVariants({
                    variant: 'ghost',
                  }),
                  'px-2'
                )}
                href={`https://www.youtube.com/${author?.social?.youtube}`}
                rel="noopener noreferrer"
                target="_blank"
                title={author?.social?.youtube}
              >
                <Icons.youtube className="size-4" />
              </Link>
            )}

            {author?.email && (
              <Link
                aria-label={author.email}
                className={cn(
                  'text-accent-foreground w-fit',
                  buttonVariants({
                    variant: 'ghost',
                  }),
                  'px-2'
                )}
                href={`mailto:${author.email}`}
                rel="noopener noreferrer"
                target="_blank"
                title={author.email}
              >
                <Mail size={16} />
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
