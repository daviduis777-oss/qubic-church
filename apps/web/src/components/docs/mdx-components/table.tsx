import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'

import { isNumericCell } from '@/lib/numeric-cell'
import { cn } from '@/lib/utils'

type WithChildren = ReactElement<{ children?: ReactNode }>

function elements(node: ReactNode): WithChildren[] {
  return Children.toArray(node).filter(isValidElement) as WithChildren[]
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children)
  }
  return ''
}

/**
 * Marks every cell of a column whose body cells are all numbers with
 * data-numeric, so th/td can right-align it. Author alignment wins.
 */
function markNumericColumns(children: ReactNode): ReactNode {
  const sections = elements(children)
  const bodyRows = sections
    .filter(section => section.type === 'tbody')
    .flatMap(section => elements(section.props.children))
  if (bodyRows.length === 0) return children

  const width = Math.max(
    ...bodyRows.map(row => elements(row.props.children).length)
  )
  const numeric = new Set<number>()
  for (let col = 0; col < width; col++) {
    const values = bodyRows
      .map(row => textOf(elements(row.props.children)[col]?.props.children))
      .filter(value => value.trim() !== '')
    if (values.length > 0 && values.every(isNumericCell)) numeric.add(col)
  }
  if (numeric.size === 0) return children

  return sections.map(section =>
    cloneElement(section, {
      children: elements(section.props.children).map(row =>
        cloneElement(row, {
          children: elements(row.props.children).map((cell, col) =>
            numeric.has(col)
              ? cloneElement(cell as ReactElement<Record<string, unknown>>, {
                  'data-numeric': '',
                })
              : cell
          ),
        })
      ),
    })
  )
}

export const table = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="my-8 w-full overflow-x-auto border border-border">
    <table
      className={cn('w-full border-collapse text-sm tabular-nums', className)}
      {...props}
    >
      {markNumericColumns(children)}
    </table>
  </div>
)
