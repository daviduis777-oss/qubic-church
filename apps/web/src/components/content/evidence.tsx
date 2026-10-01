interface EvidenceProps {
  tier?: string | number
  confidence?: number
  children: React.ReactNode
}

export function Evidence({ tier, confidence, children }: EvidenceProps) {
  return (
    <aside className="measure my-6 border border-border border-l-2 border-l-fg-2 bg-surface-1 px-4 py-3.5 text-sm leading-relaxed text-fg-2">
      {(tier || confidence) && (
        <p className="eyebrow mb-2 flex gap-4 text-muted-foreground">
          {tier && <span>Tier {tier}</span>}
          {confidence && <span>Confidence {confidence}%</span>}
        </p>
      )}
      {children}
    </aside>
  )
}
