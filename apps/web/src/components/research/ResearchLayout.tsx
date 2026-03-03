'use client'

import { useState, useRef, useCallback, type ReactNode } from 'react'
import { GripVertical, Maximize2, Minimize2, PanelLeftClose, PanelRightClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ResearchLayoutProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  leftTitle?: string
  rightTitle?: string
  defaultLeftWidth?: number // percentage
  minLeftWidth?: number // percentage
  maxLeftWidth?: number // percentage
}

export function ResearchLayout({
  leftPanel,
  rightPanel,
  leftTitle = 'Explorer',
  rightTitle = 'Workspace',
  defaultLeftWidth = 40,
  minLeftWidth = 20,
  maxLeftWidth = 70,
}: ResearchLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const newWidth = (x / rect.width) * 100

      setLeftWidth(Math.min(maxLeftWidth, Math.max(minLeftWidth, newWidth)))
    },
    [isDragging, minLeftWidth, maxLeftWidth]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add event listeners for dragging
  useState(() => {
    if (typeof window === 'undefined') return

    const onMouseMove = (e: MouseEvent) => handleMouseMove(e)
    const onMouseUp = () => handleMouseUp()

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  })

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const actualLeftWidth = leftCollapsed ? 0 : rightCollapsed ? 100 : leftWidth
  const actualRightWidth = rightCollapsed ? 0 : leftCollapsed ? 100 : 100 - leftWidth

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex h-full w-full overflow-hidden bg-black',
        isDragging && 'select-none cursor-col-resize'
      )}
      onMouseMove={isDragging ? (e) => handleMouseMove(e.nativeEvent) : undefined}
      onMouseUp={isDragging ? handleMouseUp : undefined}
      onMouseLeave={isDragging ? handleMouseUp : undefined}
    >
      {/* Left Panel */}
      <div
        className={cn(
          'relative flex flex-col overflow-hidden transition-all duration-200',
          leftCollapsed && 'w-0'
        )}
        style={{ width: leftCollapsed ? 0 : `${actualLeftWidth}%` }}
      >
        {/* Left Header */}
        <div className="flex h-10 items-center justify-between border-b border-white/10 bg-[#050505] px-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/80">{leftTitle}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/50 hover:text-white"
              onClick={() => setLeftCollapsed(true)}
              title="Collapse left panel"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Left Content */}
        <div className="flex-1 overflow-auto">{leftPanel}</div>
      </div>

      {/* Resize Handle */}
      {!leftCollapsed && !rightCollapsed && (
        <div
          className={cn(
            'group relative z-10 flex w-1 cursor-col-resize items-center justify-center bg-white/5 hover:bg-white/20 transition-colors',
            isDragging && 'bg-[#D4AF37]/50'
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute flex h-8 w-4 items-center justify-center bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-white/50" />
          </div>
        </div>
      )}

      {/* Right Panel */}
      <div
        className={cn(
          'relative flex flex-col overflow-hidden transition-all duration-200',
          rightCollapsed && 'w-0'
        )}
        style={{ width: rightCollapsed ? 0 : `${actualRightWidth}%` }}
      >
        {/* Right Header */}
        <div className="flex h-10 items-center justify-between border-b border-white/10 bg-[#050505] px-3">
          <div className="flex items-center gap-2">
            {leftCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/50 hover:text-white"
                onClick={() => setLeftCollapsed(false)}
                title="Expand left panel"
              >
                <PanelRightClose className="h-3.5 w-3.5 rotate-180" />
              </Button>
            )}
            <span className="text-sm font-medium text-white/80">{rightTitle}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/50 hover:text-white"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            {!leftCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/50 hover:text-white"
                onClick={() => setRightCollapsed(true)}
                title="Collapse right panel"
              >
                <PanelRightClose className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-auto">{rightPanel}</div>
      </div>

      {/* Collapsed panel indicators */}
      {leftCollapsed && (
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 px-1 py-8 bg-[#050505] hover:bg-white/10 border-y border-r border-white/[0.06] transition-colors"
          onClick={() => setLeftCollapsed(false)}
        >
          <PanelRightClose className="h-4 w-4 text-white/60 rotate-180" />
        </button>
      )}

      {rightCollapsed && (
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 px-1 py-8 bg-[#050505] hover:bg-white/10 border-y border-l border-white/[0.06] transition-colors"
          onClick={() => setRightCollapsed(false)}
        >
          <PanelLeftClose className="h-4 w-4 text-white/60 rotate-180" />
        </button>
      )}
    </div>
  )
}

export default ResearchLayout
