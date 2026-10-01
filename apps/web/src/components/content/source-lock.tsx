interface SourceLockProps {
  sources?: Array<{ path: string; type?: string; date?: string }>
  children?: React.ReactNode
}

export function SourceLock({ sources, children }: SourceLockProps) {
  if (!sources && !children) return null

  return (
    <aside className="my-6 border border-border bg-surface-1 px-4 py-3.5">
      <p className="eyebrow mb-2 text-muted-foreground">Source materials</p>
      {children || (
        <ul className="space-y-1 font-mono text-xs break-words text-fg-2">
          {sources?.map(source => (
            <li key={`${source.path}-${source.date ?? ''}`}>
              {source.type && (
                <span className="text-muted-foreground">[{source.type}]</span>
              )}{' '}
              {source.path}
              {source.date && (
                <span className="text-muted-foreground"> ({source.date})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
