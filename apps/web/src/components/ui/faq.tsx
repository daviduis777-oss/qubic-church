import { ChevronDown } from 'lucide-react'

/** Question list built on native <details>: keyboard and screen reader ready. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map(item => (
        <details className="group" key={item.q}>
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium text-foreground transition-colors duration-150 ease-out hover:text-gold">
            {item.q}
            <ChevronDown
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-open:rotate-180"
            />
          </summary>
          <p className="measure pb-5 leading-relaxed text-fg-2">{item.a}</p>
        </details>
      ))}
    </div>
  )
}
