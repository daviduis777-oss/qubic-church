import { CopyButton, CopyNpmCommandButton } from './copy-button'
import type { NpmCommands } from '@/lib/opendocs/types/unist'
import { cn } from '@/lib/utils'

export const pre = ({
  className,
  __src__,
  __style__,
  __withMeta__,
  __rawString__,
  __bunCommand__,
  __npmCommand__,
  __yarnCommand__,
  __pnpmCommand__,
  ...props
}: React.HTMLAttributes<HTMLPreElement> & {
  __src__?: string
  __rawString__?: string
  __withMeta__?: boolean
  __style__?: 'default' | 'new-york'
} & NpmCommands) => {
  return (
    <div className="relative">
      <pre
        className={cn(
          'my-6 max-h-160 overflow-auto border border-border bg-surface-1 py-4 text-sm leading-relaxed',
          className
        )}
        {...props}
      />

      {__rawString__ && !__npmCommand__ && (
        <CopyButton
          className={cn('absolute right-2 top-2', __withMeta__ && 'top-14')}
          src={__src__}
          value={__rawString__}
        />
      )}
      {__npmCommand__ &&
        __yarnCommand__ &&
        __pnpmCommand__ &&
        __bunCommand__ && (
          <CopyNpmCommandButton
            className={cn('absolute right-2 top-2', __withMeta__ && 'top-14')}
            commands={{
              __bunCommand__,
              __npmCommand__,
              __yarnCommand__,
              __pnpmCommand__,
            }}
          />
        )}
    </div>
  )
}
