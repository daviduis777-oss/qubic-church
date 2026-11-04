'use client'

import { type ReactNode, useId, useState } from 'react'

/**
 * Server-rendered panels behind an accessible tab list (arrow keys move between tabs).
 * Every panel is in the HTML; without JavaScript the first one shows.
 */
export function PoolTabs({ tabs, classes }: { tabs: { label: string; panel: ReactNode }[]; classes: Record<'list' | 'tab' | 'on' | 'panel', string | undefined> }) {
  const [i, setI] = useState(0)
  const id = useId()
  return (
    <>
      <div aria-label="Who mines with what" className={classes.list} role="tablist">
        {tabs.map((t, k) => (
          <button
            aria-controls={`${id}-p${k}`}
            aria-selected={i === k}
            className={`${classes.tab} ${i === k ? classes.on : ''}`}
            id={`${id}-t${k}`}
            key={t.label}
            onClick={() => setI(k)}
            onKeyDown={e => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const n = (k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
                setI(n)
                document.getElementById(`${id}-t${n}`)?.focus()
              }
            }}
            role="tab"
            tabIndex={i === k ? 0 : -1}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, k) => (
        <div aria-labelledby={`${id}-t${k}`} className={classes.panel} hidden={i !== k} id={`${id}-p${k}`} key={t.label} role="tabpanel">
          {t.panel}
        </div>
      ))}
    </>
  )
}
