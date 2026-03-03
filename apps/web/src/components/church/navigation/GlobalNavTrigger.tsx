'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from '@/navigation'
import Link from 'next/link'
import { NavigationWheel } from './NavigationWheel'
import { ContentModals } from '@/components/church/ContentModals'

export function GlobalNavTrigger() {
  const pathname = usePathname()
  const [wheelOpen, setWheelOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)

  // Hide on homepage - hero handles its own navigation
  const isHomepage = pathname === '/' || pathname === ''

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleOpenModal = useCallback((modalId: string) => {
    setActiveModal(modalId)
  }, [])

  if (isHomepage) return null

  return (
    <>
      {/* Floating navigation bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-black/60 backdrop-blur-md border-b border-[#D4AF37]/10'
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between h-12 md:h-14 px-4 md:px-8 max-w-screen-2xl mx-auto">
          {/* Left: Menu button — compact icon on mobile, full text on md+ */}
          <button
            onClick={() => setWheelOpen(true)}
            className="flex-shrink-0 px-2.5 py-1.5 md:px-5 md:py-2 border border-[#D4AF37]/50 text-[#D4AF37] text-[11px] md:text-xs
                       uppercase tracking-[0.15em] md:tracking-[0.25em] font-medium
                       hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/80
                       transition-all duration-300"
          >
            {/* Mobile: compact icon */}
            <span className="md:hidden flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Menu
            </span>
            {/* Desktop: full text */}
            <span className="hidden md:inline">Start Immersion &#9662;</span>
          </button>

          {/* Center: QUBIC CHURCH title */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2
                       text-[#D4AF37] text-[11px] md:text-base
                       font-semibold tracking-[0.2em] md:tracking-[0.45em] uppercase
                       hover:text-[#D4AF37]/80 transition-colors duration-300
                       whitespace-nowrap"
          >
            Qubic Church
          </Link>

          {/* Right: spacer for balance */}
          <div className="w-16 md:w-[140px] flex-shrink-0" />
        </div>
      </div>

      {/* Spacer to push content below the floating bar */}
      <div className="h-12 md:h-14" />

      {/* Navigation Wheel */}
      <NavigationWheel
        isOpen={wheelOpen}
        onClose={() => setWheelOpen(false)}
        onOpenModal={handleOpenModal}
      />

      {/* Content Modals — triggered by wheel segments on subpages */}
      <ContentModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  )
}
