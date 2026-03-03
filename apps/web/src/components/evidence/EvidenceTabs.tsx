'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Database, Cpu, Grid3X3, Info, TrendingUp, Box, Lock } from 'lucide-react'

// Tab components will be lazy loaded
import dynamic from 'next/dynamic'

// Quick Win 13: Enhanced loading skeleton with progress
function TableSkeleton({ label }: { label?: string }) {
  return (
    <div className="w-full h-[600px] bg-[#050505] border border-white/[0.04] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-[#D4AF37]/30" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-[#D4AF37] border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <span className="text-muted-foreground text-sm block">Loading {label || 'data'}...</span>
          <span className="text-muted-foreground/50 text-xs">This may take a moment</span>
        </div>
      </div>
    </div>
  )
}

// Consolidated Address Database Tab (combines Qubic, Bitcoin, Patoshi)
const AddressDatabaseTab = dynamic(() => import('./tabs/AddressDatabaseTab'), {
  loading: () => <TableSkeleton label="Address Database" />,
  ssr: false,
})

const VisualizationsTab = dynamic(() => import('./tabs/VisualizationsTab'), {
  loading: () => <TableSkeleton label="visualizations" />,
  ssr: false,
})

interface TabConfig {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  count?: string
  badge?: string
  badgeColor?: string
  gradient?: string
  comingSoon?: boolean
}

// Research-focused tab configuration
const TABS: TabConfig[] = [
  {
    id: 'visualizations',
    label: '3D Analysis',
    icon: <Cpu className="w-4 h-4" />,
    description: 'Qortex neural network visualization',
    badge: 'Interactive',
    badgeColor: 'bg-[#D4AF37]/15 text-[#D4AF37]/60 border-[#D4AF37]/20',
    gradient: 'bg-[#D4AF37]/10',
  },
  {
    id: 'addresses',
    label: 'Address Database',
    icon: <Database className="w-4 h-4" />,
    description: 'Qubic Seeds, Bitcoin addresses & Patoshi mining data',
    count: '1M+',
    gradient: 'bg-[#D4AF37]/10',
  },
  {
    id: 'contact-cube',
    label: 'Contact Cube',
    icon: <Box className="w-4 h-4" />,
    description: '3D cube folding visualization of the Anna Matrix',
    gradient: 'bg-[#D4AF37]/10',
    comingSoon: true,
  },
  {
    id: 'matrix',
    label: 'Anna Matrix',
    icon: <Grid3X3 className="w-4 h-4" />,
    description: '128×128 cryptographic matrix explorer',
    gradient: 'bg-[#D4AF37]/10',
    comingSoon: true,
  },
]

const ACTIVE_TABS = TABS.filter(t => !t.comingSoon)
const COMING_SOON_TABS = TABS.filter(t => t.comingSoon)

// Quick Win 15: Tab info tooltip component
function TabTooltip({ tab, visible }: { tab: TabConfig; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.95 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#050505] border border-white/[0.06] shadow-lg z-50 min-w-[200px] pointer-events-none"
        >
          <div className="text-sm font-medium text-foreground mb-1">{tab.label}</div>
          <div className="text-xs text-muted-foreground">{tab.description}</div>
          {tab.comingSoon && (
            <div className="text-xs text-[#D4AF37]/50 mt-1 font-mono">Coming soon</div>
          )}
          {tab.count && (
            <div className="text-xs text-[#D4AF37]/70 mt-1 font-mono">{tab.count} records</div>
          )}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#050505] border-r border-b border-white/[0.06]" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function EvidenceTabs() {
  const [activeTab, setActiveTab] = useState('visualizations')
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Quick Win 16: Smooth loading transition
  const handleTabChange = (value: string) => {
    // Prevent switching to coming soon tabs
    const tab = TABS.find(t => t.id === value)
    if (tab?.comingSoon) return

    if (value !== activeTab) {
      setIsLoading(true)
      setActiveTab(value)
      setTimeout(() => setIsLoading(false), 100)
    }
  }

  // Quick Win 17: Keyboard navigation between active tabs only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      const currentIndex = ACTIVE_TABS.findIndex(t => t.id === activeTab)

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const nextIndex = (currentIndex + 1) % ACTIVE_TABS.length
        setActiveTab(ACTIVE_TABS[nextIndex]?.id || 'visualizations')
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const prevIndex = (currentIndex - 1 + ACTIVE_TABS.length) % ACTIVE_TABS.length
        setActiveTab(ACTIVE_TABS[prevIndex]?.id || 'visualizations')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  return (
      <section id="data-tables" className="py-16 px-4">
        <div className="container max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 text-sm text-[#D4AF37]/70 mb-4">
              <TrendingUp className="w-4 h-4" />
              <span className="font-mono tracking-wider">Research Datasets</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-wider mb-2">Data Explorer</h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Interactive analysis tools and research datasets
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full flex flex-wrap justify-center gap-2 bg-transparent h-auto p-2 mb-8">
              {/* Active tabs */}
              {ACTIVE_TABS.map((tab) => (
                <div
                  key={tab.id}
                  className="relative"
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  <TabTooltip tab={tab} visible={hoveredTab === tab.id} />
                  <TabsTrigger
                    value={tab.id}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-3 border transition-all duration-200',
                      'data-[state=active]:text-[#D4AF37]',
                      'data-[state=active]:border-[#D4AF37]/30 data-[state=active]:bg-[#D4AF37]/[0.06]',
                      'data-[state=inactive]:bg-[#050505] data-[state=inactive]:border-white/[0.04]',
                      'data-[state=inactive]:hover:bg-white/[0.03]',
                      'overflow-hidden'
                    )}
                  >
                    {/* Active tab background */}
                    <div
                      className={cn(
                        'absolute inset-0 opacity-0 transition-opacity',
                        tab.gradient,
                        'data-[state=active]:opacity-100'
                      )}
                      data-state={activeTab === tab.id ? 'active' : 'inactive'}
                    />
                    <div
                      className={cn(
                        'absolute inset-0 bg-[#D4AF37]/[0.06] opacity-0 transition-opacity',
                        activeTab === tab.id && 'opacity-100'
                      )}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      {tab.icon}
                      <span className="font-medium">{tab.label}</span>
                      {tab.count && (
                        <span className="text-xs bg-white/10 px-2 py-0.5 font-mono">
                          {tab.count}
                        </span>
                      )}
                      {tab.badge && (
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 border uppercase font-medium',
                          tab.badgeColor || 'bg-[#D4AF37]/15 text-[#D4AF37]/60 border-[#D4AF37]/20'
                        )}>
                          {tab.badge}
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                </div>
              ))}

              {/* Coming soon tabs - disabled appearance */}
              {COMING_SOON_TABS.map((tab) => (
                <div
                  key={tab.id}
                  className="relative"
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  <TabTooltip tab={tab} visible={hoveredTab === tab.id} />
                  <div
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 border transition-all duration-200 cursor-default',
                      'bg-[#050505] border-white/[0.03] text-white/20'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {tab.icon}
                      <span className="font-medium">{tab.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 border border-white/[0.06] bg-white/[0.02] text-white/25 uppercase font-medium">
                        Soon
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </TabsList>

            {/* Quick Win 20: Enhanced content container with subtle animation */}
            <motion.div
              className="bg-[#050505] border border-white/[0.04] p-4 md:p-6 relative overflow-hidden"
              initial={false}
              animate={{ opacity: isLoading ? 0.7 : 1 }}
              transition={{ duration: 0.15 }}
            >
              {/* Decorative corner dots */}
              <div className="absolute top-2 left-2 w-1 h-1 bg-[#D4AF37]/30 pointer-events-none" />
              <div className="absolute top-2 right-2 w-1 h-1 bg-[#D4AF37]/30 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-1 h-1 bg-[#D4AF37]/30 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-1 h-1 bg-[#D4AF37]/30 pointer-events-none" />

              <TabsContent value="visualizations" className="mt-0 focus-visible:outline-none">
                <VisualizationsTab />
              </TabsContent>

              <TabsContent value="addresses" className="mt-0 focus-visible:outline-none">
                <AddressDatabaseTab />
              </TabsContent>
            </motion.div>
          </Tabs>

          {/* Quick Win: Navigation hint */}
          <motion.div
            className="mt-4 flex items-center justify-center gap-4 text-xs text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono">&larr;</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono">&rarr;</kbd>
              <span className="ml-1">Switch tabs</span>
            </span>
            <span className="text-white/15">|</span>
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Hover tabs for details</span>
            </span>
          </motion.div>
        </div>
      </section>
  )
}
