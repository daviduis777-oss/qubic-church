'use client'

import { Tabs as BaseTabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import React from 'react'

interface TabProps {
  label: string
  children: React.ReactNode
}

interface TabsProps {
  items?: string[]
  children: React.ReactNode
}

export function Tab({ children }: TabProps) {
  return <>{children}</>
}

export function Tabs({ items, children }: TabsProps) {
  const tabs = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<TabProps> =>
      React.isValidElement(child) && (child.type as any).name === 'Tab'
  )

  const labels = items || tabs.map((tab) => tab.props.label).filter((label): label is string => !!label)

  if (labels.length === 0) return null

  return (
    <BaseTabs defaultValue={labels[0]} className="w-full">
      <TabsList className="w-full">
        {labels.map((label) => (
          <TabsTrigger key={label} value={label}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, index) => {
        const label = labels[index]
        if (!label) return null
        return (
          <TabsContent key={label} value={label}>
            {tab.props.children}
          </TabsContent>
        )
      })}
    </BaseTabs>
  )
}
