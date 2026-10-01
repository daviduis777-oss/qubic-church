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
      className="flip-page relative overflow-hidden"
      ref={ref}
      style={{
        width: pageWidth,
        height: pageHeight,
        backgroundColor: '#fdfbf3',
      }}
    >
      {shouldRender ? (
        <Page
          error={
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono opacity-40">
              Page {pageNumber}
            </div>
          }
          loading={
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2
                className="w-5 h-5 animate-spin"
                style={{ color: 'rgba(0,0,0,0.3)' }}
              />
            </div>
          }
          pageNumber={pageNumber}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          width={pageWidth}
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
          background:
            'linear-gradient(135deg, rgba(240,192,48,0.06), rgba(240,192,48,0.02))',
          border: '1px solid rgba(240,192,48,0.15)',
        }}
      />
      <div
        className="rounded-sm"
        style={{
          width,
          height,
          background:
            'linear-gradient(135deg, rgba(240,192,48,0.06), rgba(240,192,48,0.02))',
          border: '1px solid rgba(240,192,48,0.15)',
        }}
      />
    </div>
  )
}

const LANGUAGE_NAMES: Record<string, string> = {
  EN: 'English',
  DE: 'Deutsch',
  RU: 'Русский',
}

type BookFlipReaderProps = {
  files: { label: string; href: string }[]
  initialFile?: number
  title?: string
  onClose: () => void
}

export default function BookFlipReader({
  files,
  initialFile = 0,
  title = 'Qubic, The Long Version',
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
  const onDocumentLoad = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n)
      setCurrentPage(0)
      setDocLoading(false)
    },
    []
  )

  const handleFileSwitch = useCallback(
    (i: number) => {
      if (i === activeFileIdx) return
      setDocLoading(true)
      setNumPages(0)
      setCurrentPage(0)
      setActiveFileIdx(i)
    },
    [activeFileIdx]
  )

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
          pageHeight={pageDims.height}
          pageNumber={pageNum}
          pageWidth={pageDims.width}
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
      className="fixed inset-0 z-[100] flex flex-col"
      ref={rootRef}
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
          <BookOpen
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: GOLD }}
          />
          <span
            className="text-xs sm:text-xs font-mono tracking-widest uppercase truncate"
            style={{ color: GOLD }}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {files.length > 1 && (
            <div
              aria-label="Language"
              className="flex border"
              role="tablist"
              style={{ borderColor: `${GOLD}30` }}
            >
              {files.map((f, i) => (
                <button
                  className="px-2.5 py-1 text-xs font-mono tracking-widest uppercase transition-all"
                  key={f.label}
                  onClick={() => handleFileSwitch(i)}
                  style={{
                    color: i === activeFileIdx ? GOLD : `${GOLD}60`,
                    backgroundColor:
                      i === activeFileIdx ? `${GOLD}15` : 'transparent',
                  }}
                  type="button"
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <a
            aria-label="Download PDF"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-80"
            download
            href={activeFile.href}
            style={{ color: TEXT_DIM, borderColor: 'rgba(216,216,226,0.20)' }}
          >
            <Download className="w-3 h-3" /> PDF
          </a>

          <button
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="p-2 transition-opacity hover:opacity-70"
            onClick={toggleFullscreen}
            style={{ color: TEXT_DIM }}
            type="button"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <button
            aria-label="Close reader"
            className="p-2 transition-opacity hover:opacity-70"
            onClick={onClose}
            style={{ color: GOLD }}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Book area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-4"
        ref={containerRef}
      >
        {containerRect.width > 0 && (
          <Document
            error={
              <div
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: '#ec4899' }}
              >
                Failed to load PDF
              </div>
            }
            file={activeFile.href}
            key={activeFile.href}
            loading={
              <div
                className="flex flex-col items-center gap-5"
                style={{ color: TEXT_DIM }}
              >
                <BookSilhouette width={Math.min(180, pageDims.width * 0.6)} />
                <div className="flex items-center gap-2">
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin"
                    style={{ color: GOLD }}
                  />
                  <span className="text-xs font-mono tracking-widest uppercase">
                    Loading book…
                  </span>
                </div>
              </div>
            }
            onLoadSuccess={onDocumentLoad}
          >
            {numPages > 0 && pageElements && (
              <HTMLFlipBook
                autoSize={false}
                className=""
                clickEventForward
                disableFlipByClick={false}
                drawShadow={false}
                flippingTime={650}
                height={pageDims.height}
                key={flipBookKey}
                maxHeight={1980}
                maxShadowOpacity={0.4}
                maxWidth={1400}
                minHeight={310}
                minWidth={220}
                mobileScrollSupport
                onFlip={(e: { data: number }) => setCurrentPage(e.data)}
                ref={flipRef as never}
                showCover={false}
                showPageCorners
                size="fixed"
                startPage={currentPage}
                startZIndex={0}
                style={{}}
                swipeDistance={30}
                useMouseEvents
                usePortrait={isPortrait}
                width={pageDims.width}
              >
                {pageElements as unknown as React.ReactElement[]}
              </HTMLFlipBook>
            )}
            {docLoading && numPages === 0 && (
              <div
                className="flex flex-col items-center gap-5"
                style={{ color: TEXT_DIM }}
              >
                <BookSilhouette width={Math.min(180, pageDims.width * 0.6)} />
                <div className="flex items-center gap-2">
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin"
                    style={{ color: GOLD }}
                  />
                  <span className="text-xs font-mono tracking-widest uppercase">
                    Loading {LANGUAGE_NAMES[activeFile.label] ?? 'English'}…
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
            aria-label="Previous page"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-widest uppercase border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
            disabled={currentPage === 0 || numPages === 0}
            onClick={handleFlipPrev}
            style={{
              color: GOLD,
              borderColor: `${GOLD}30`,
            }}
            type="button"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {numPages > 0 ? (
            <div className="flex-1 flex items-center gap-3 max-w-2xl mx-auto">
              <span
                className="text-xs font-mono tracking-widest uppercase tabular-nums"
                style={{ color: GOLD, minWidth: '3ch', textAlign: 'right' }}
              >
                {currentPage + 1}
              </span>
              <input
                aria-label="Page slider"
                className="flex-1 h-1 appearance-none cursor-pointer focus:outline-none"
                max={numPages - 1}
                min={0}
                onChange={e => handleFlipTo(parseInt(e.target.value, 10))}
                style={{
                  background: `linear-gradient(to right, ${GOLD} 0%, ${GOLD} ${(currentPage / Math.max(1, numPages - 1)) * 100}%, rgba(240,192,48,0.15) ${(currentPage / Math.max(1, numPages - 1)) * 100}%, rgba(240,192,48,0.15) 100%)`,
                  borderRadius: '999px',
                }}
                type="range"
                value={currentPage}
              />
              <span
                className="text-xs font-mono tracking-widest uppercase tabular-nums"
                style={{ color: TEXT_DIM, minWidth: '3ch' }}
              >
                {numPages}
              </span>
            </div>
          ) : (
            <div
              className="flex-1 text-center text-xs font-mono tracking-widest uppercase"
              style={{ color: TEXT_DIM }}
            >
              /
            </div>
          )}

          <button
            aria-label="Next page"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-widest uppercase border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
            disabled={numPages === 0 || currentPage >= numPages - 1}
            onClick={handleFlipNext}
            style={{
              color: GOLD,
              borderColor: `${GOLD}30`,
            }}
            type="button"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div
          className="hidden sm:block text-center text-xs font-mono tracking-widest uppercase opacity-40"
          style={{ color: TEXT_DIM }}
        >
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
