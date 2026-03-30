import { Alert, AlertDescription } from '@/components/ui/alert'

interface SummaryProps {
  children: React.ReactNode
}

export function Summary({ children }: SummaryProps) {
  return (
    <Alert className="my-4 border-l-4 border-primary bg-primary/5">
      <AlertDescription className="text-sm leading-relaxed">
        {children}
      </AlertDescription>
    </Alert>
  )
}
