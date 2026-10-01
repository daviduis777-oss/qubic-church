'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function TabSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-96 w-full items-center justify-center">
      <span className="text-sm text-muted-foreground">Loading {label}…</span>
    </div>
  )
}

const MatrixExplorerTab = dynamic(() => import('./tabs/MatrixExplorerTab'), {
  loading: () => <TabSkeleton label="Matrix Explorer" />,
  ssr: false,
})
const OriginTab = dynamic(() => import('./tabs/OriginTab'), {
  loading: () => <TabSkeleton label="Origin" />,
  ssr: false,
})
const EmergenceLab = dynamic(() => import('./emergence-lab/EmergenceLab'), {
  loading: () => <TabSkeleton label="Anna.exe & Emergence" />,
  ssr: false,
})
const AigarthLabTab = dynamic(() => import('./tabs/AigarthLabTab'), {
  loading: () => <TabSkeleton label="Aigarth Lab" />,
  ssr: false,
})
const AnnaConceptLab = dynamic(
  () => import('./anna-concept-lab/AnnaConceptLab'),
  { loading: () => <TabSkeleton label="Anna Concept Lab" />, ssr: false }
)
const CognitiveLab = dynamic(() => import('./cognitive-lab/CognitiveLab'), {
  loading: () => <TabSkeleton label="Cognitive Lab" />,
  ssr: false,
})
const SpectralTab = dynamic(() => import('./tabs/SpectralTab'), {
  loading: () => <TabSkeleton label="Spectral" />,
  ssr: false,
})
const VisualizationsTab = dynamic(() => import('./tabs/VisualizationsTab'), {
  loading: () => <TabSkeleton label="3D Analysis" />,
  ssr: false,
})
const ContactCubeTab = dynamic(() => import('./tabs/ContactCubeTab'), {
  loading: () => <TabSkeleton label="Contact Cube" />,
  ssr: false,
})

const TABS = [
  {
    id: 'matrix-explorer',
    label: 'Matrix Explorer',
    description:
      'The 128 × 128 map, as transcribed and corrected, cell by cell.',
    Component: MatrixExplorerTab,
  },
  {
    id: 'origin',
    label: 'Origin',
    description: 'How trained Aigarth units compare with the Anna map.',
    Component: OriginTab,
  },
  {
    id: 'anna-exe',
    label: 'Anna.exe & Emergence',
    description:
      'Reverse engineering of Anna.exe and an evolve-and-compose demo.',
    Component: EmergenceLab,
  },
  {
    id: 'aigarth-lab',
    label: 'Aigarth Lab',
    description:
      'Benchmarks of the public unit on bit-pattern tasks (reported, not independently re-run).',
    Component: AigarthLabTab,
  },
  {
    id: 'anna-concept-lab',
    label: 'Anna Concept Lab',
    description:
      'A port of the AIT inference. The concept reading was withdrawn in September 2026.',
    Component: AnnaConceptLab,
  },
  {
    id: 'cognitive-lab',
    label: 'Cognitive Lab',
    description: 'Evolution experiments on the public unit.',
    Component: CognitiveLab,
  },
  {
    id: 'spectral',
    label: 'Spectral',
    description: 'Eigenvalue analysis of the matrix.',
    Component: SpectralTab,
  },
  {
    id: 'visualizations',
    label: '3D Analysis',
    description: 'A 3D network view of the matrix.',
    Component: VisualizationsTab,
  },
  {
    id: 'contact-cube',
    label: 'Contact Cube',
    description: 'The matrix folded onto a cube, as a visualisation.',
    Component: ContactCubeTab,
  },
]

export function EvidenceTabs() {
  const [activeTab, setActiveTab] = useState('matrix-explorer')
  const active = TABS.find(t => t.id === activeTab)

  return (
    <section className="scroll-mt-14 py-12 md:py-16" id="data-tables">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Check it yourself
          </h2>
          <p className="text-fg-2">
            Interactive tools that run on the published data in your browser.
          </p>
        </div>

        <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <div className="mb-4 max-md:overflow-x-auto">
            <TabsList className="h-auto justify-start max-md:w-max md:flex-wrap">
              {TABS.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  <span className="py-1.5">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {active && (
            <p className="mb-6 text-sm text-fg-2">{active.description}</p>
          )}

          <div className="border border-border bg-card p-4 md:p-6">
            {TABS.map(({ id, Component }) => (
              <TabsContent className="mt-0" key={id} value={id}>
                <Component />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </section>
  )
}
