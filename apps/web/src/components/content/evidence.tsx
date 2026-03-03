import { Card, CardContent } from '@/components/ui/card'

interface EvidenceProps {
  tier?: string | number
  confidence?: number
  children: React.ReactNode
}

export function Evidence({ tier, confidence, children }: EvidenceProps) {
  return (
    <Card className="my-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="pt-6">
        {(tier || confidence) && (
          <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
            {tier && <span>Tier {tier}</span>}
            {confidence && <span>Confidence: {confidence}%</span>}
          </div>
        )}
        <div className="prose dark:prose-invert">{children}</div>
      </CardContent>
    </Card>
  )
}
