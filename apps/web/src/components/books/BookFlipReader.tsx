'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useMemo,
  useLayoutEffect,
} from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import HTMLFlipBook from 'react-pageflip'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Maximize2,
  Minimize2,
  Download,
  BookOpen,
} from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const GOLD = '#f0c030'
const TEXT_DIM = 'rgba(216, 216, 226, 0.55)'

const PDF_ASPECT = 1.414 // ~A4 portrait

type FlipPageProps = {
  pageNumber: number
  pageWidth: number
  pageHeight: number
  shouldRender: boolean
}

const FlipPage = forwardRef<HTMLDivElement, FlipPageProps>(function FlipPage(
  { pageNumber, pageWidth, pageHeight, shouldRender },
  ref
) {
  return (
    <div
      ref={ref}
      className="flip-page relative overflow-hidden"
      style={{
        width: pageWidth,
        height: pageHeight,
        backgroundColor: '#fdfbf3',
      }}
    >
      {shouldRender ? (
        <Page
          pageNumber={pageNumber}
          width={pageWidth}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          loading={
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2
                className="w-5 h-5 animate-spin"
                style={{ color: 'rgba(0,0,0,0.3)' }}
              />
            </div>
          }
          error={
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono opacity-40">
              Page {pageNumber}
            </div>
          }
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono opacity-25">
          {pageNumber}
        </div>
      )}
    </div>
  )
})

function BookSilhouette({ width = 240 }: { width?: number }) {
  const height = width * PDF_ASPECT
  return (
    <div className="flex items-center gap-2 opacity-80">
      <div
        className="rounded-sm"
        style={{
          width,
          height,
          background: `linear-gradient(135deg, rgba(240,192,48,0.06), rgba(240,192,48,0.02))`,
          border: `1px solid rgba(240,192,48,0.15)`,
        }}
      />
      <div
        className="rounded-sm"
        style={{
          width,
          height,
          background: `linear-gradient(135deg, rgba(240,192,48,0.06), rgba(240,192,48,0.02))`,
          border: `1px solid rgba(240,192,48,0.15)`,
        }}
      />
    </div>
  )
}

type BookFlipReaderProps = {
  files: { label: string; href: string }[]
  initialFile?: number
  onClose: () => void
}

export default function BookFlipReader({
  files,
  initialFile = 0,
  onClose,
}: BookFlipReaderProps) {
  const [activeFileIdx, setActiveFileIdx] = useState(initialFile)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageDims, setPageDims] = useState({ width: 380, height: 537 })
  const [isPortrait, setIsPortrait] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [containerRect, setContainerRect] = useState({ width: 0, height: 0 })
  const [docLoading, setDocLoading] = useState(true)
  const flipRef = useRef<{
    pageFlip: () => {
      flipNext: () => void
      flipPrev: () => void
      flip: (n: number) => void
    }
  } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const activeFile = files[activeFileIdx] ?? files[0]

  // Measure available container space via ResizeObserver
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setContainerRect({ width: rect.width, height: rect.height })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Compute page dims from container size
  useEffect(() => {
    const { width: cw, height: ch } = containerRect
    if (cw === 0 || ch === 0) return
    const SIDE_PADDING = 16
    const VERTICAL_PADDING = 16
    const SPREAD_GAP = 0
    const availW = cw - SIDE_PADDING * 2
    const availH = ch - VERTICAL_PADDING * 2
    const portrait = availW < 760
    let pageW: number
    let pageH: number
    if (portrait) {
      pageW = availW
      pageH = pageW * PDF_ASPECT
      if (pageH > availH) {
        pageH = availH
        pageW = pageH / PDF_ASPECT
      }
    } else {
      pageW = (availW - SPREAD_GAP) / 2
      pageH = pageW * PDF_ASPECT
      if (pageH > availH) {
        pageH = availH
        pageW = pageH / PDF_ASPECT
      }
    }
    // sanity floor
    pageW = Math.max(220, Math.floor(pageW))
    pageH = Math.max(310, Math.floor(pageH))
    setPageDims({ width: pageW, height: pageH })
    setIsPortrait(portrait)
  }, [containerRect])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleFlipNext = useCallback(() => {
    flipRef.current?.pageFlip()?.flipNext()
  }, [])
  const handleFlipPrev = useCallback(() => {
    flipRef.current?.pageFlip()?.flipPrev()
  }, [])
  const handleFlipTo = useCallback((p: number) => {
    flipRef.current?.pageFlip()?.flip(p)
  }, [])

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {})
        } else {
          onClose()
        }
      } else if (e.key === 'ArrowLeft') {
        handleFlipPrev()
      } else if (e.key === 'ArrowRight') {
        handleFlipNext()
      } else if (e.key === 'Home') {
        handleFlipTo(0)
      } else if (e.key === 'End' && numPages > 0) {
        handleFlipTo(numPages - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleFlipNext, handleFlipPrev, handleFlipTo, numPages, onClose])

  // Track fullscreen state
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && rootRef.current) {
        await rootRef.current.requestFullscreen()
      } else if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      // no-op
    }
  }, [])

  // Reset on file change
  const onDocumentLoad = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    setCurrentPage(0)
    setDocLoading(false)
  }, [])

  const handleFileSwitch = useCallback((i: number) => {
    if (i === activeFileIdx) return
    setDocLoading(true)
    setNumPages(0)
    setCurrentPage(0)
    setActiveFileIdx(i)
  }, [activeFileIdx])

  const PAGE_BUFFER = 4

  const pageElements = useMemo(() => {
    if (!numPages) return null
    return Array.from({ length: numPages }).map((_, i) => {
      const pageNum = i + 1
      const distance = Math.abs(i - currentPage)
      const shouldRender = distance <= PAGE_BUFFER
      return (
        <FlipPage
          key={pageNum}
          pageNumber={pageNum}
          pageWidth={pageDims.width}
          pageHeight={pageDims.height}
          shouldRender={shouldRender}
        />
      )
    })
  }, [numPages, currentPage, pageDims.width, pageDims.height])

  // Bucket dimensions to avoid remounting on every micro-resize, but force
  // remount on major changes (fullscreen toggle, orientation change).
  const flipBookKey = `${activeFile?.href ?? ''}-${isPortrait ? 'p' : 'l'}-${Math.floor(pageDims.width / 80)}`

  if (!activeFile) {
    return null
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        backgroundColor: '#080810',
      }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 h-14 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(240, 192, 48, 0.12)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
          <span
            className="text-[10px] sm:text-xs font-mono tracking-[0.2em] uppercase truncate"
            style={{ color: GOLD }}
          >
            Qubic — The Long Version
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {files.length > 1 && (
            <div
              className="flex border"
              style={{ borderColor: `${GOLD}30` }}
              role="tablist"
              aria-label="Language"
            >
              {files.map((f, i) => (
                <button
                  key={f.label}
                  onClick={() => handleFileSwitch(i)}
                  className="px-2.5 py-1 text-[10px] font-mono tracking-[0.15em] uppercase transition-all"
                  style={{
                    color: i === activeFileIdx ? GOLD : `${GOLD}60`,
                    backgroundColor: i === activeFileIdx ? `${GOLD}15` : 'transparent',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <a
            href={activeFile.href}
            download
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono tracking-[0.15em] uppercase border transition-all hover:opacity-80"
            style={{ color: TEXT_DIM, borderColor: 'rgba(216,216,226,0.20)' }}
            aria-label="Download PDF"
          >
            <Download className="w-3 h-3" /> PDF
          </a>

          <button
            onClick={toggleFullscreen}
            className="p-2 transition-opacity hover:opacity-70"
            style={{ color: TEXT_DIM }}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 transition-opacity hover:opacity-70"
            style={{ color: GOLD }}
            aria-label="Close reader"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Book area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-4"
      >
        {containerRect.width > 0 && (
          <Document
            key={activeFile.href}
            file={activeFile.href}
            onLoadSuccess={onDocumentLoad}
            loading={
              <div className="flex flex-col items-center gap-5" style={{ color: TEXT_DIM }}>
                <BookSilhouette width={Math.min(180, pageDims.width * 0.6)} />
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: GOLD }} />
                  <span className="text-[10px] font-mono tracking-[0.25em] uppercase">
                    Loading book…
                  </span>
                </div>
              </div>
            }
            error={
              <div
                className="text-[12px] font-mono tracking-[0.15em] uppercase"
                style={{ color: '#ec4899' }}
              >
                Failed to load PDF
              </div>
            }
          >
            {numPages > 0 && pageElements && (
              <HTMLFlipBook
                key={flipBookKey}
                ref={flipRef as never}
                width={pageDims.width}
                height={pageDims.height}
                size="fixed"
                minWidth={220}
                maxWidth={1400}
                minHeight={310}
                maxHeight={1980}
                showCover={false}
                drawShadow={false}
                flippingTime={650}
                usePortrait={isPortrait}
                startPage={currentPage}
                maxShadowOpacity={0.4}
                mobileScrollSupport
                clickEventForward
                useMouseEvents
                swipeDistance={30}
                showPageCorners
                disableFlipByClick={false}
                style={{}}
                className=""
                startZIndex={0}
                autoSize={false}
                onFlip={(e: { data: number }) => setCurrentPage(e.data)}
              >
                {pageElements as unknown as React.ReactElement[]}
              </HTMLFlipBook>
            )}
            {docLoading && numPages === 0 && (
              <div className="flex flex-col items-center gap-5" style={{ color: TEXT_DIM }}>
                <BookSilhouette width={Math.min(180, pageDims.width * 0.6)} />
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: GOLD }} />
                  <span className="text-[10px] font-mono tracking-[0.25em] uppercase">
                    Loading {activeFile.label === 'RU' ? 'Русский' : 'English'}…
                  </span>
                </div>
              </div>
            )}
          </Document>
        )}
      </div>

      {/* Footer */}
      <footer
        className="flex flex-col gap-2 px-4 sm:px-6 py-2 border-t flex-shrink-0"
        style={{ borderColor: 'rgba(240, 192, 48, 0.12)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleFlipPrev}
            disabled={currentPage === 0 || numPages === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-[0.15em] uppercase border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
            style={{
              color: GOLD,
              borderColor: `${GOLD}30`,
            }}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {numPages > 0 ? (
            <div className="flex-1 flex items-center gap-3 max-w-2xl mx-auto">
              <span
                className="text-[10px] font-mono tracking-[0.15em] uppercase tabular-nums"
                style={{ color: GOLD, minWidth: '3ch', textAlign: 'right' }}
              >
                {currentPage + 1}
              </span>
              <input
                type="range"
                min={0}
                max={numPages - 1}
                value={currentPage}
                onChange={(e) => handleFlipTo(parseInt(e.target.value, 10))}
                className="flex-1 h-1 appearance-none cursor-pointer focus:outline-none"
                style={{
                  background: `linear-gradient(to right, ${GOLD} 0%, ${GOLD} ${(currentPage / Math.max(1, numPages - 1)) * 100}%, rgba(240,192,48,0.15) ${(currentPage / Math.max(1, numPages - 1)) * 100}%, rgba(240,192,48,0.15) 100%)`,
                  borderRadius: '999px',
                }}
                aria-label="Page slider"
              />
              <span
                className="text-[10px] font-mono tracking-[0.15em] uppercase tabular-nums"
                style={{ color: TEXT_DIM, minWidth: '3ch' }}
              >
                {numPages}
              </span>
            </div>
          ) : (
            <div className="flex-1 text-center text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: TEXT_DIM }}>
              — / —
            </div>
          )}

          <button
            onClick={handleFlipNext}
            disabled={numPages === 0 || currentPage >= numPages - 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-[0.15em] uppercase border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
            style={{
              color: GOLD,
              borderColor: `${GOLD}30`,
            }}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="hidden sm:block text-center text-[9px] font-mono tracking-[0.2em] uppercase opacity-40" style={{ color: TEXT_DIM }}>
          ← / → flip · Esc close · Home / End jump
        </div>
      </footer>

      {/* Slider thumb styling + canvas hint to suppress sub-pixel banding */}
      <style jsx>{`
        :global(.flip-page canvas) {
          display: block;
          image-rendering: -webkit-optimize-contrast;
          backface-visibility: hidden;
        }
        :global(.stf__block) {
          box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.5);
        }
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: ${GOLD};
          box-shadow: 0 0 0 2px rgba(240, 192, 48, 0.25);
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 4px rgba(240, 192, 48, 0.3);
        }
        input[type='range']::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border: none;
          border-radius: 999px;
          background: ${GOLD};
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
