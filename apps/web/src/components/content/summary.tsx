interface SummaryProps {
  children: React.ReactNode
}

export function Summary({ children }: SummaryProps) {
  return (
    <aside className="measure my-6 border border-border border-l-2 border-l-gold bg-surface-1 px-4 py-3.5 text-sm leading-relaxed text-fg-2">
      {children}
    </aside>
  )
}
