import { Lock } from 'lucide-react'

interface SourceLockProps {
  sources?: Array<{ path: string; type?: string; date?: string }>
  children?: React.ReactNode
}

export function SourceLock({ sources, children }: SourceLockProps) {
  if (!sources && !children) return null

  return (
    <div className="my-4 rounded-lg border border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/20">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
        <Lock className="h-4 w-4" />
        <span>Source Materials</span>
      </div>
      {children || (
        <div className="space-y-1 text-xs text-amber-800 dark:text-amber-200">
          {sources?.map((source, i) => (
            <div key={i} className="font-mono">
              {source.type && <span className="text-amber-600 dark:text-amber-400">[{source.type}]</span>}{' '}
              {source.path}
              {source.date && <span className="text-amber-600 dark:text-amber-400"> ({source.date})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
