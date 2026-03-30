interface SourceProps {
  path: string
  type?: string
  date?: string
}

export function Source({ path, type, date }: SourceProps) {
  return (
    <div className="font-mono text-xs text-amber-800 dark:text-amber-200">
      {type && <span className="text-amber-600 dark:text-amber-400">[{type}]</span>}{' '}
      {path}
      {date && <span className="text-amber-600 dark:text-amber-400"> ({date})</span>}
    </div>
  )
}
