'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from '@/navigation'
import Link from 'next/link'
import { NavigationWheel } from './NavigationWheel'
import { ContentModals } from '@/components/church/ContentModals'

export function GlobalNavTrigger() {
  const pathname = usePathname()
  const [wheelOpen, setWheelOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

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
      {/* Site header: one quiet bar on every subpage */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-colors duration-200 ease-out ${
          scrolled
            ? 'bg-black/80 border-border'
            : 'bg-black/50 border-transparent'
        }`}
      >
        <div className="relative flex items-center justify-between h-14 px-4 md:px-8 max-w-screen-2xl mx-auto">
          {/* Left: menu opens the navigation wheel */}
          <button
            aria-expanded={wheelOpen}
            aria-haspopup="dialog"
            className="flex h-10 flex-shrink-0 items-center gap-2 px-3 -ml-3 text-sm font-medium text-fg-2 transition-colors duration-150 ease-out hover:text-foreground"
            onClick={() => setWheelOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="16"
              stroke="currentColor"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
              width="16"
            >
              <line x1="3" x2="21" y1="6" y2="6" />
              <line x1="3" x2="21" y1="12" y2="12" />
              <line x1="3" x2="21" y1="18" y2="18" />
            </svg>
            <span className="md:hidden">Menu</span>
            <span className="hidden md:inline">Start immersion</span>
          </button>

          {/* Center: wordmark */}
          <Link
            className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold uppercase tracking-wordmark text-gold whitespace-nowrap transition-colors duration-150 ease-out hover:text-gold-strong md:text-base"
            href="/"
          >
            Qubic Church
          </Link>

          {/* Right: Books + Donate */}
          <nav
            aria-label="Primary"
            className="flex items-center gap-1 flex-shrink-0"
          >
            <Link
              className="hidden sm:inline-flex h-10 items-center px-3 text-sm font-medium text-fg-2 transition-colors duration-150 ease-out hover:text-foreground"
              href="/books"
            >
              Books
            </Link>
            <Link
              className="inline-flex h-9 items-center border border-gold/50 px-3 text-sm font-medium text-gold transition-colors duration-150 ease-out hover:border-gold hover:bg-gold/10"
              href="/donate"
            >
              Donate
            </Link>
          </nav>
        </div>
      </header>

      {/* Spacer to push content below the fixed bar */}
      <div className="h-14" />

      {/* Navigation Wheel */}
      <NavigationWheel
        isOpen={wheelOpen}
        onClose={() => {
          setWheelOpen(false)
          menuButtonRef.current?.focus()
        }}
        onOpenModal={handleOpenModal}
      />

      {/* Content Modals, triggered by wheel segments on subpages */}
      <ContentModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  )
}
