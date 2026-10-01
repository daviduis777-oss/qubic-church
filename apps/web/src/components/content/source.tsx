interface SourceProps {
  path: string
  type?: string
  date?: string
}

export function Source({ path, type, date }: SourceProps) {
  return (
    <div className="font-mono text-xs break-words text-fg-2">
      {type && <span className="text-muted-foreground">[{type}]</span>} {path}
      {date && <span className="text-muted-foreground"> ({date})</span>}
    </div>
  )
}
