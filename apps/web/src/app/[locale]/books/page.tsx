'use client'

import { Fragment, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Copy,
  Check,
  Download,
  ExternalLink,
  BookOpen,
  Loader2,
} from 'lucide-react'

const BookFlipReader = dynamic(
  () => import('@/components/books/BookFlipReader'),
  {
    ssr: false,
    loading: () => (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(8,8,14,0.97)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: '#f0c030' }}
        />
      </div>
    ),
  }
)

const GOLD = 'var(--accent-gold)'
const BG = 'var(--background)'
const TEXT_PRIMARY = 'var(--foreground)'
const TEXT_DIM = 'var(--fg-2)'
const BORDER = 'var(--border)'
const CARD_BG = 'var(--card)'
const TIER1 = '#10B981'

const DONATION_ADDRESS =
  'BDRFCOFWHRTEHHMQQUIYJBXEOLNARADAGFUSBFGJFABYZBZLQNWJIPPFRTXO'

const READER_FILES = [
  { label: 'EN', href: '/books/qubic-long-version-eng.pdf' },
  { label: 'DE', href: '/books/qubic-long-version-deu.pdf' },
  { label: 'RU', href: '/books/qubic-long-version-rus.pdf' },
]

const EDITIONS = [
  {
    idx: 0,
    name: 'English',
    readLabel: 'Read · Flip-book',
    fileLabel: 'Download English PDF · 3.6 MB',
    href: '/books/qubic-long-version-eng.pdf',
  },
  {
    idx: 1,
    name: 'Deutsch',
    readLabel: 'Lesen · Flip-book',
    fileLabel: 'Deutsches PDF · 0.5 MB',
    href: '/books/qubic-long-version-deu.pdf',
  },
  {
    idx: 2,
    name: 'Русский',
    readLabel: 'Читать · Original',
    fileLabel: 'Скачать Русский PDF · 5.2 MB',
    href: '/books/qubic-long-version-rus.pdf',
  },
]

// Book Two: Come-from-Beyond (teal)
const TEAL = '#22b8b8'
const TEAL_BORDER = 'rgba(34, 184, 184, 0.22)'

const CFB_PDF = '/books/come-from-beyond.pdf'
const CFB_COVER = '/books/covers/come-from-beyond-cover.png'
const CFB_READER_FILES = [{ label: 'EN', href: CFB_PDF }]

// Reader is a single instance; index this to swap files + title together.
const READER_BOOKS = [
  { title: 'Qubic: The Long Version', files: READER_FILES },
  { title: 'Come-from-Beyond', files: CFB_READER_FILES },
]

const CFB_TOC: { num: number; name: string }[] = [
  { num: 1, name: 'The Man with a Time Machine' },
  { num: 2, name: 'Where Time Grows From' },
  { num: 3, name: 'One Line Through 25 Years' },
  { num: 4, name: 'The Vanished Satoshi' },
  { num: 5, name: 'The Visionary' },
  { num: 6, name: 'The Garden' },
  { num: 7, name: 'The Only Rival' },
  { num: 8, name: 'The Progressor' },
  { num: 9, name: 'Two Scientists' },
  { num: 10, name: 'Zero' },
  { num: 11, name: 'The Gifts' },
]

const TOC: {
  roman: string
  title: string
  chapters: { num: number; name: string }[]
}[] = [
  {
    roman: 'I',
    title: 'The Problem',
    chapters: [
      { num: 1, name: "Murdoch's Gas" },
      { num: 2, name: "Axelrod's Tournament" },
      { num: 3, name: "Why Bitcoin Can't Fix Itself" },
    ],
  },
  {
    roman: 'II',
    title: 'The Man',
    chapters: [
      { num: 4, name: 'Come-from-Beyond Before Bitcoin' },
      { num: 5, name: 'Three Projects, Three Metamorphoses' },
    ],
  },
  {
    roman: 'III',
    title: 'The Mechanics',
    chapters: [
      { num: 6, name: '676 Voices' },
      { num: 7, name: 'Weeks of Epochs' },
      { num: 8, name: "Murdoch's Gas in Action, UPoW" },
      { num: 9, name: 'The Breathing Token' },
      { num: 10, name: 'The Arbitrator, A Temporary Monarch' },
    ],
  },
  {
    roman: 'IV',
    title: 'Aigarth',
    chapters: [
      { num: 11, name: 'What Aigarth Is' },
      { num: 12, name: "What's Already Done" },
      { num: 13, name: 'Anna Matrix' },
      { num: 14, name: 'What the Deploy on April 13, 2027 Means' },
    ],
  },
  {
    roman: 'V',
    title: 'The Proof',
    chapters: [
      { num: 15, name: 'The War That No One Waged' },
      { num: 16, name: "What Qubic Didn't Do" },
      { num: 17, name: 'Qubic Church and Fractal Rationalism' },
    ],
  },
  {
    roman: 'VI',
    title: 'The Finale',
    chapters: [{ num: 18, name: 'The New Gold' }],
  },
]

export default function BooksPage() {
  const [copied, setCopied] = useState(false)
  const [reader, setReader] = useState<{
    files: { label: string; href: string }[]
    title: string
    file: number
  } | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // book = index into READER_BOOKS (0 = Long Version, 1 = Come-from-Beyond),
  // file = language/edition index within that book. Resolve here so files + title
  // always change together.
  const openReader = useCallback((book: number, file = 0) => {
    const b = READER_BOOKS[book]
    if (b) setReader({ files: b.files, title: b.title, file })
  }, [])

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ backgroundColor: BG }}
    >
      {/* Atmospheric backdrop: warm parchment glow behind cover */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[1200px] h-[1000px] rounded-full blur-3xl"
          style={{
            backgroundColor: `color-mix(in oklab, ${GOLD} 2%, transparent)`,
          }}
        />
        <div
          className="absolute top-[40%] left-[15%] w-[400px] h-[400px] rounded-full blur-3xl opacity-30"
          style={{
            backgroundColor: `color-mix(in oklab, ${GOLD} 3%, transparent)`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-24 pt-12 sm:pt-16"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.7 }}
        >
          <style>{'html { scroll-behavior: smooth; }'}</style>

          {/* The library: both books at a glance */}
          <section className="scroll-mt-20 space-y-8" id="library">
            <div className="text-center space-y-2">
              <div
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: GOLD }}
              >
                The Qubic Church Library
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{
                  backgroundColor: `color-mix(in oklab, ${GOLD} 19%, transparent)`,
                }}
              />
              <p
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: TEXT_DIM }}
              >
                Two books · Free
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5 sm:gap-10 max-w-2xl mx-auto">
              {/* Book One */}
              <a
                className="group flex flex-col items-center gap-3 focus:outline-none"
                href="#long-version"
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{
                    border: `1px solid ${BORDER}`,
                    boxShadow: '0 20px 50px -22px rgba(0,0,0,0.75)',
                  }}
                >
                  <Image
                    alt="Qubic, The Long Version cover"
                    className="block w-full h-auto transition-transform duration-300 group-hover:scale-[1.03]"
                    height={2263}
                    sizes="(max-width: 640px) 45vw, 320px"
                    src="/books/covers/qubic-long-version-cover.png"
                    width={1600}
                  />
                </div>
                <div className="text-center">
                  <div
                    className="text-xs sm:text-xs font-mono tracking-widest uppercase"
                    style={{ color: GOLD }}
                  >
                    The Long Version
                  </div>
                  <div
                    className="mt-1 inline-flex items-center gap-1 text-xs font-mono tracking-widest uppercase"
                    style={{ color: TEXT_DIM }}
                  >
                    Book One <ArrowDown className="w-3 h-3" />
                  </div>
                </div>
              </a>

              {/* Book Two: NEW */}
              <a
                className="group flex flex-col items-center gap-3 focus:outline-none"
                href="#come-from-beyond"
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{
                    border: `1px solid ${TEAL_BORDER}`,
                    boxShadow: '0 20px 50px -22px rgba(0,0,0,0.75)',
                  }}
                >
                  <span
                    className="absolute top-2 right-2 z-10 px-2 py-0.5 text-xs font-mono font-semibold tracking-widest uppercase"
                    style={{ color: BG, backgroundColor: TEAL }}
                  >
                    New
                  </span>
                  <Image
                    alt="Come-from-Beyond cover"
                    className="block w-full h-auto transition-transform duration-300 group-hover:scale-[1.03]"
                    height={2263}
                    sizes="(max-width: 640px) 45vw, 320px"
                    src={CFB_COVER}
                    width={1600}
                  />
                </div>
                <div className="text-center">
                  <div
                    className="text-xs sm:text-xs font-mono tracking-widest uppercase"
                    style={{ color: TEAL }}
                  >
                    Come-from-Beyond
                  </div>
                  <div
                    className="mt-1 inline-flex items-center gap-1 text-xs font-mono tracking-widest uppercase"
                    style={{ color: TEXT_DIM }}
                  >
                    Book Two <ArrowDown className="w-3 h-3" />
                  </div>
                </div>
              </a>
            </div>
          </section>

          {/* Book One: hero */}
          <section
            className="scroll-mt-20 space-y-10 text-center"
            id="long-version"
          >
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2.5 px-4 py-2 text-xs sm:text-xs font-mono font-medium tracking-widest uppercase"
                style={{
                  backgroundColor: `color-mix(in oklab, ${GOLD} 6%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${GOLD} 19%, transparent)`,
                  color: `color-mix(in oklab, ${GOLD} 80%, transparent)`,
                }}
              >
                <span
                  className="inline-flex h-1.5 w-1.5"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${GOLD} 60%, transparent)`,
                  }}
                />
                Book One · Qubic Church · 2026
              </span>
            </div>

            {/* Cover with glow */}
            <div className="flex justify-center">
              <div className="relative inline-block group">
                {/* Cover glow */}
                <div
                  className="absolute -inset-8 sm:-inset-12 blur-3xl opacity-40 -z-10 transition-opacity group-hover:opacity-60"
                  style={{
                    background: `radial-gradient(ellipse at center, color-mix(in oklab, ${GOLD} 15%, transparent) 0%, color-mix(in oklab, ${GOLD} 3%, transparent) 50%, transparent 75%)`,
                  }}
                />
                <button
                  aria-label="Open book in flip-book reader"
                  className="relative block transition-transform duration-300 ease-out hover:scale-[1.015] focus:outline-none focus:ring-2 focus:ring-[#f0c030]/50 cursor-pointer"
                  onClick={() => openReader(0)}
                  style={{
                    border: `1px solid ${BORDER}`,
                    boxShadow:
                      '0 50px 100px -30px rgba(0, 0, 0, 0.7), 0 25px 50px -25px rgba(240, 192, 48, 0.3)',
                  }}
                  type="button"
                >
                  <Image
                    alt="Qubic, The Long Version cover artwork: a sepia pencil illustration of a head whose brain is an industrial labyrinth labelled PROOF, ANN, AIGARTH, COMPUTOR, 676 and COMPUTE."
                    className="block w-full max-w-[300px] sm:max-w-[420px] md:max-w-[520px] h-auto"
                    height={2263}
                    priority
                    quality={88}
                    sizes="(max-width: 640px) 300px, (max-width: 768px) 420px, 520px"
                    src="/books/covers/qubic-long-version-cover.png"
                    width={1600}
                  />
                  {/* Read overlay on hover */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        'linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(13,13,20,0.85) 100%)',
                    }}
                  >
                    <span
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-xs font-mono tracking-widest uppercase border whitespace-nowrap"
                      style={{
                        color: GOLD,
                        borderColor: `color-mix(in oklab, ${GOLD} 50%, transparent)`,
                        backgroundColor: 'rgba(13,13,20,0.7)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <BookOpen className="w-3 h-3 inline mr-2" />
                      Open Book
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight"
                style={{
                  color: GOLD,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                Qubic
                <span
                  className="block text-2xl sm:text-3xl md:text-4xl italic font-normal mt-2"
                  style={{
                    color: `color-mix(in oklab, ${GOLD} 80%, transparent)`,
                  }}
                >
                  The Long Version
                </span>
              </h1>
              <div
                className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs sm:text-xs font-mono tracking-widest uppercase pt-2"
                style={{ color: TEXT_DIM }}
              >
                <span>By Qubic Church</span>
                <span style={{ color: GOLD }}>·</span>
                <span>2026</span>
                <span style={{ color: GOLD }}>·</span>
                <span>18 Chapters</span>
                <span style={{ color: GOLD }}>·</span>
                <span>~200 Pages</span>
                <span style={{ color: GOLD }}>·</span>
                <span style={{ color: TIER1 }}>Free</span>
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-90"
                onClick={() => openReader(0)}
                style={{
                  color: BG,
                  backgroundColor: GOLD,
                  borderColor: GOLD,
                  fontWeight: 600,
                }}
                type="button"
              >
                <BookOpen className="w-4 h-4" />
                Read in Browser
              </button>
              <a
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-90"
                download
                href="/books/qubic-long-version-eng.pdf"
                style={{
                  color: GOLD,
                  borderColor: `color-mix(in oklab, ${GOLD} 31%, transparent)`,
                  backgroundColor: `color-mix(in oklab, ${GOLD} 3%, transparent)`,
                }}
              >
                <Download className="w-4 h-4" />
                Download PDF · 3.6 MB
              </a>
            </div>

            {/* Language switch, read any edition in the browser */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 pt-1">
              <span
                className="text-xs font-mono tracking-widest uppercase mr-1"
                style={{ color: TEXT_DIM }}
              >
                Read in
              </span>
              {EDITIONS.map(ed => (
                <button
                  className="px-3 py-1.5 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-80"
                  key={ed.name}
                  onClick={() => openReader(0, ed.idx)}
                  style={{
                    color: `color-mix(in oklab, ${GOLD} 80%, transparent)`,
                    borderColor: `color-mix(in oklab, ${GOLD} 19%, transparent)`,
                    backgroundColor: 'transparent',
                  }}
                  type="button"
                >
                  {ed.name}
                </button>
              ))}
            </div>
          </section>

          {/* CfB pull-quote */}
          <section className="space-y-5">
            <div
              className="h-px max-w-[200px] mx-auto"
              style={{
                background: `linear-gradient(to right, transparent, color-mix(in oklab, ${GOLD} 25%, transparent), transparent)`,
              }}
            />
            <blockquote className="text-center space-y-4 px-4">
              <span
                aria-hidden
                className="block text-6xl sm:text-7xl leading-none -mb-2 select-none"
                style={{ color: GOLD, fontFamily: 'Georgia, serif' }}
              >
                &ldquo;
              </span>
              <p
                className="text-xl sm:text-2xl md:text-3xl italic leading-snug max-w-2xl mx-auto"
                style={{
                  color: GOLD,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontWeight: 400,
                }}
              >
                Qubic is doomed to succeed. Aigarth? Depends on miners.
              </p>
              <footer
                className="text-xs sm:text-xs font-mono tracking-widest uppercase pt-2"
                style={{ color: GOLD }}
              >
                Come-from-Beyond
                <span className="opacity-50 mx-2">·</span>
                February 7, 2026
              </footer>
            </blockquote>
            <div
              className="h-px max-w-[200px] mx-auto"
              style={{
                background: `linear-gradient(to right, transparent, color-mix(in oklab, ${GOLD} 25%, transparent), transparent)`,
              }}
            />
          </section>

          {/* Preface */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <div
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: GOLD }}
              >
                Preface
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{
                  backgroundColor: `color-mix(in oklab, ${GOLD} 19%, transparent)`,
                }}
              />
            </div>

            <div
              className="space-y-5 text-base sm:text-lg leading-[1.85]"
              style={{ color: TEXT_PRIMARY, fontFamily: 'Georgia, serif' }}
            >
              <p
                className="first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.85]"
                style={{ ['--first-letter-color' as never]: GOLD }}
              >
                <span className="contents" style={{ color: GOLD }}>
                  T
                </span>
                he story of Qubic begins long before Bitcoin and contains many
                vivid stages. To study the path that the visionary
                Come-from-Beyond lays beneath his own feet is genuinely
                interesting.
              </p>
              <p style={{ color: TEXT_DIM }}>
                My father spent a significant amount of time studying this
                subject and, being a master of religious studies, looked at
                Qubic on a somewhat larger scale than is customary.
              </p>
              <p style={{ color: TEXT_DIM }}>
                The main challenge for the ordinary person who today takes an
                interest in Qubic is to grasp the scale, the structure, the
                functions, and the meaning of every detail of a large mechanism.
                Believe me, this is a whole universe with a rich history and
                many secrets we&apos;ll be uncovering over time.
                Come-from-Beyond, like an ancient artist, is painting a large
                picture. Elements that seem unconnected gradually begin to fuse
                and take shape.
              </p>
            </div>

            <div className="flex justify-center">
              <span
                aria-hidden
                className="text-2xl select-none"
                style={{ color: GOLD, fontFamily: 'Georgia, serif' }}
              >
                ❦
              </span>
            </div>

            <div
              className="space-y-5 text-base sm:text-base leading-[1.85]"
              style={{ color: TEXT_DIM, fontFamily: 'Georgia, serif' }}
            >
              <p>
                This book does one simple thing: it gathers what&apos;s been
                scattered into a single fresco, structures it, and presents it
                in plain language.
              </p>
              <p>
                Who should read this? Anyone who&apos;s even a little connected
                to Qubic will find something here for themselves. A newcomer
                will learn the basic principles of how it works and see
                connections where they didn&apos;t see them before. An
                experienced holder can enjoy the history and the beautiful
                allegories my father&apos;s speech is so full of. The
                professional and the master can take a look at the overall
                picture from the outside and, perhaps, see something they used
                to miss.
              </p>
              <p>
                All CfB quotes used in this book are taken verbatim from open
                primary sources, the official Qubic Discord, his publications
                on X, the team&apos;s scientific papers. If you spot an
                inaccuracy, write in. The book is alive; the next edition will
                incorporate corrections.
              </p>
              <p>
                A caveat is in order: Come-from-Beyond&apos;s style is a wild
                ride on a motorcycle off-road. In the Qubic universe, you rarely
                find information laid out in a structured way. That&apos;s why
                we believe this book will be a pleasant addition to every Qubic
                holder&apos;s library.
              </p>
            </div>

            <div
              className="text-center pt-2 text-base sm:text-base italic"
              style={{ color: TEXT_PRIMARY, fontFamily: 'Georgia, serif' }}
            >
              The book is distributed absolutely freely.
            </div>

            <div
              className="text-center pt-3 italic"
              style={{ color: TEXT_DIM, fontFamily: 'Georgia, serif' }}
            >
              <p className="text-sm sm:text-base leading-relaxed">
                Thank you, Father. Your contribution is invaluable.
              </p>
            </div>
          </section>

          {/* Downloads card */}
          <section className="space-y-5">
            <div className="text-center space-y-2">
              <div
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: GOLD }}
              >
                Read &amp; Download
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{
                  backgroundColor: `color-mix(in oklab, ${GOLD} 19%, transparent)`,
                }}
              />
            </div>

            <div
              className="border p-6 sm:p-8 space-y-4"
              style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {EDITIONS.map(ed => (
                  <button
                    className="flex items-center gap-3 p-4 border text-left transition-all hover:opacity-90"
                    key={ed.name}
                    onClick={() => openReader(0, ed.idx)}
                    style={{
                      color: GOLD,
                      borderColor: `color-mix(in oklab, ${GOLD} 25%, transparent)`,
                      backgroundColor: `color-mix(in oklab, ${GOLD} 3%, transparent)`,
                    }}
                    type="button"
                  >
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-mono tracking-widest uppercase">
                        {ed.name}
                      </span>
                      <span
                        className="text-xs font-mono mt-0.5"
                        style={{ color: GOLD }}
                      >
                        {ed.readLabel}
                      </span>
                    </div>
                  </button>
                ))}
                <a
                  className="flex items-center gap-3 p-4 border transition-all hover:opacity-90"
                  download
                  href="/books/anna-matrix-companion.pdf"
                  style={{
                    color: GOLD,
                    borderColor: `color-mix(in oklab, ${GOLD} 25%, transparent)`,
                    backgroundColor: `color-mix(in oklab, ${GOLD} 3%, transparent)`,
                  }}
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-mono tracking-widest uppercase">
                      Companion
                    </span>
                    <span
                      className="text-xs font-mono mt-0.5"
                      style={{ color: GOLD }}
                    >
                      PDF · 1.6 MB · Ch. 13
                    </span>
                  </div>
                </a>
              </div>

              <div
                className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 text-xs font-mono tracking-widest uppercase"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {EDITIONS.map((ed, i) => (
                  <Fragment key={ed.name}>
                    {i > 0 && <span aria-hidden>·</span>}
                    <a
                      className="hover:opacity-80 underline underline-offset-2"
                      download
                      href={ed.href}
                      style={{ color: TEXT_DIM }}
                    >
                      {ed.fileLabel}
                    </a>
                  </Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* ToC */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <div
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: GOLD }}
              >
                Inside the Book
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{
                  backgroundColor: `color-mix(in oklab, ${GOLD} 19%, transparent)`,
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {TOC.map(part => (
                <div className="space-y-4" key={part.roman}>
                  <div
                    className="flex items-baseline gap-4 pb-2 border-b"
                    style={{
                      borderColor: `color-mix(in oklab, ${GOLD} 13%, transparent)`,
                    }}
                  >
                    <span
                      className="text-3xl sm:text-4xl font-light tracking-wider"
                      style={{
                        color: GOLD,
                        fontFamily: 'Georgia, serif',
                      }}
                    >
                      {part.roman}
                    </span>
                    <span
                      className="text-lg sm:text-xl italic flex-1"
                      style={{
                        color: TEXT_PRIMARY,
                        fontFamily: 'Georgia, serif',
                      }}
                    >
                      {part.title}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {part.chapters.map(ch => (
                      <li
                        className="flex items-baseline gap-3 text-sm leading-relaxed group"
                        key={ch.num}
                      >
                        <span
                          className="text-xs font-mono tracking-[0.05em] flex-shrink-0 whitespace-nowrap transition-colors tabular-nums"
                          style={{ color: GOLD, minWidth: '3.5rem' }}
                        >
                          Ch.&nbsp;{ch.num}
                        </span>
                        <span
                          className="transition-colors group-hover:text-white/90"
                          style={{
                            color: TEXT_DIM,
                            fontFamily: 'Georgia, serif',
                          }}
                        >
                          {ch.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Excerpt teaser, opening of Chapter 1 */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <div
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: GOLD }}
              >
                A Taste · Chapter 1
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{
                  backgroundColor: `color-mix(in oklab, ${GOLD} 19%, transparent)`,
                }}
              />
            </div>

            <div
              className="relative px-6 sm:px-10 py-10 sm:py-14 mx-auto max-w-2xl"
              style={{
                background: 'linear-gradient(180deg, #fdfbf3 0%, #f7f1de 100%)',
                color: '#1c1a14',
                boxShadow:
                  '0 30px 60px -25px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
              }}
            >
              {/* Decorative top ornament */}
              <div className="text-center mb-6">
                <span
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: '#7a6f4d' }}
                >
                  Chapter 1
                </span>
                <h3
                  className="text-3xl sm:text-4xl mt-1"
                  style={{
                    color: '#1c1a14',
                    fontFamily: 'Georgia, serif',
                    fontWeight: 700,
                  }}
                >
                  Murdoch&apos;s Gas
                </h3>
                <span
                  aria-hidden
                  className="block text-2xl mt-3"
                  style={{ color: '#a89863', fontFamily: 'Georgia, serif' }}
                >
                  ❦
                </span>
              </div>

              <p
                className="italic text-base mb-5"
                style={{ color: '#5a5340', fontFamily: 'Georgia, serif' }}
              >
                Useful waste.
              </p>

              <p
                className="text-base leading-[1.85] mb-5"
                style={{ color: '#1c1a14', fontFamily: 'Georgia, serif' }}
              >
                <span
                  className="float-left text-[64px] leading-[0.85] font-bold mr-2 mt-1"
                  style={{ color: '#1c1a14', fontFamily: 'Georgia, serif' }}
                >
                  T
                </span>
                here&apos;s a kind of thing you learn to see one day, and then
                you wonder how you didn&apos;t notice it before. One of those
                things is the difference between work and its waste.
              </p>

              <p
                className="text-base leading-[1.85] mb-5"
                style={{ color: '#1c1a14', fontFamily: 'Georgia, serif' }}
              >
                Take any furnace. Something burns inside it, something gets
                heated, and the desired product comes out. But besides the
                product, there&apos;s always something else left over. Smoke.
                Steam. Smell. Noise. Heat going off into the walls. For
                centuries people treated those leftovers as garbage, the
                inevitable companion of useful work, something that had to be
                disposed of somehow or simply released into the air.
              </p>

              <p
                className="text-base leading-[1.85]"
                style={{ color: '#1c1a14', fontFamily: 'Georgia, serif' }}
              >
                Sometimes a person comes along who looks at this garbage more
                attentively than the rest. And asks a strange question:{' '}
                <em>what if we don&apos;t release it?</em>
              </p>

              <div
                className="flex items-center justify-center gap-4 pt-8 mt-8 border-t"
                style={{ borderColor: 'rgba(28,26,20,0.12)' }}
              >
                <button
                  className="flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-90"
                  onClick={() => openReader(0)}
                  style={{
                    color: '#1c1a14',
                    borderColor: 'rgba(28,26,20,0.4)',
                    backgroundColor: 'transparent',
                  }}
                  type="button"
                >
                  <BookOpen className="w-3 h-3" />
                  Continue Reading
                </button>
                <span
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: '#7a6f4d' }}
                >
                  Page 11 →
                </span>
              </div>
            </div>
          </section>

          {/* Companion section */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <div
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: GOLD }}
              >
                The Companion File
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{
                  backgroundColor: `color-mix(in oklab, ${GOLD} 19%, transparent)`,
                }}
              />
            </div>

            <div
              className="border p-6 sm:p-8 space-y-6"
              style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
            >
              <p
                className="text-base leading-relaxed"
                style={{ color: TEXT_PRIMARY, fontFamily: 'Georgia, serif' }}
              >
                Chapter 13 covers the{' '}
                <Link
                  className="underline underline-offset-2"
                  href="/evidence"
                  style={{ color: GOLD }}
                >
                  Anna Matrix
                </Link>{' '}
                in narrative form. The Companion is a 41-page appendix with
                Python snippets that run against the published matrix data.
                Several of its claims were withdrawn in September 2026; the
                companion page lists which.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-90"
                  href="/companion"
                  style={{
                    color: GOLD,
                    borderColor: `color-mix(in oklab, ${GOLD} 31%, transparent)`,
                    backgroundColor: `color-mix(in oklab, ${GOLD} 6%, transparent)`,
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Companion Page
                </Link>
                <a
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-90"
                  download
                  href="/books/anna-matrix-companion.pdf"
                  style={{
                    color: TEXT_DIM,
                    borderColor: 'rgba(216,216,226,0.20)',
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF · 1.6 MB
                </a>
              </div>
            </div>
          </section>

          {/* Book Two: Come-from-Beyond (teal) */}
          <section
            className="scroll-mt-20 space-y-10 text-center"
            id="come-from-beyond"
          >
            <div
              className="h-px max-w-[240px] mx-auto"
              style={{
                background: `linear-gradient(to right, transparent, ${TEAL}55, transparent)`,
              }}
            />

            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2.5 px-4 py-2 text-xs sm:text-xs font-mono font-medium tracking-widest uppercase"
                style={{
                  backgroundColor: `${TEAL}12`,
                  border: `1px solid ${TEAL}40`,
                  color: TEAL,
                }}
              >
                <span
                  className="inline-flex h-1.5 w-1.5"
                  style={{ backgroundColor: TEAL }}
                />
                New · Second Book · 2026
              </span>
            </div>

            {/* Cover with teal glow */}
            <div className="flex justify-center">
              <div className="relative inline-block group">
                <div
                  className="absolute -inset-8 sm:-inset-12 blur-3xl opacity-40 -z-10 transition-opacity group-hover:opacity-60"
                  style={{
                    background: `radial-gradient(ellipse at center, ${TEAL}22 0%, ${TEAL}08 50%, transparent 75%)`,
                  }}
                />
                <button
                  aria-label="Open Come-from-Beyond in flip-book reader"
                  className="relative block transition-transform duration-300 ease-out hover:scale-[1.015] focus:outline-none focus:ring-2 focus:ring-[#22b8b8]/50 cursor-pointer"
                  onClick={() => openReader(1)}
                  style={{
                    border: `1px solid ${TEAL_BORDER}`,
                    boxShadow:
                      '0 50px 100px -30px rgba(0, 0, 0, 0.7), 0 25px 50px -25px rgba(34, 184, 184, 0.28)',
                  }}
                  type="button"
                >
                  <Image
                    alt="Come-from-Beyond cover artwork: a portrait of the founder over a branching diagram from Satoshi and IOTA to NXT, Qubic, Aigarth and anna.exe."
                    className="block w-full max-w-[300px] sm:max-w-[420px] md:max-w-[520px] h-auto"
                    height={2263}
                    quality={88}
                    sizes="(max-width: 640px) 300px, (max-width: 768px) 420px, 520px"
                    src={CFB_COVER}
                    width={1600}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        'linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(13,13,20,0.85) 100%)',
                    }}
                  >
                    <span
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-xs font-mono tracking-widest uppercase border whitespace-nowrap"
                      style={{
                        color: TEAL,
                        borderColor: `${TEAL}80`,
                        backgroundColor: 'rgba(13,13,20,0.7)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <BookOpen className="w-3 h-3 inline mr-2" />
                      Open Book
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h2
                className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight"
                style={{
                  color: TEAL,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                Come-from-Beyond
                <span
                  className="block text-xl sm:text-2xl md:text-3xl italic font-normal mt-3"
                  style={{ color: `${TEAL}cc` }}
                >
                  A portrait of the man behind Qubic
                </span>
              </h2>
              <div
                className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs sm:text-xs font-mono tracking-widest uppercase pt-2"
                style={{ color: TEXT_DIM }}
              >
                <span>By Qubic Church</span>
                <span style={{ color: TEAL }}>·</span>
                <span>2026</span>
                <span style={{ color: TEAL }}>·</span>
                <span>11 Chapters</span>
                <span style={{ color: TEAL }}>·</span>
                <span>47 Pages</span>
                <span style={{ color: TEAL }}>·</span>
                <span>Translated from Russian</span>
                <span style={{ color: TEAL }}>·</span>
                <span style={{ color: TIER1 }}>Free</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-90"
                onClick={() => openReader(1)}
                style={{
                  color: BG,
                  backgroundColor: TEAL,
                  borderColor: TEAL,
                  fontWeight: 600,
                }}
                type="button"
              >
                <BookOpen className="w-4 h-4" />
                Read in Browser
              </button>
              <a
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-90"
                download
                href={CFB_PDF}
                style={{
                  color: TEAL,
                  borderColor: `${TEAL}50`,
                  backgroundColor: `${TEAL}08`,
                }}
              >
                <Download className="w-4 h-4" />
                Download PDF · 1.2 MB
              </a>
            </div>

            {/* Pull-quote from CfB on the book */}
            <div className="pt-4 space-y-5">
              <div
                className="h-px max-w-[200px] mx-auto"
                style={{
                  background: `linear-gradient(to right, transparent, ${TEAL}40, transparent)`,
                }}
              />
              <blockquote className="text-center space-y-4 px-4">
                <span
                  aria-hidden
                  className="block text-6xl sm:text-7xl leading-none -mb-2 select-none"
                  style={{ color: TEAL, fontFamily: 'Georgia, serif' }}
                >
                  &ldquo;
                </span>
                <p
                  className="text-lg sm:text-xl md:text-2xl italic leading-snug max-w-2xl mx-auto"
                  style={{
                    color: TEAL,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontWeight: 400,
                  }}
                >
                  NAh, you&apos;ll read in a book. @QubicChurch knows when
                  it&apos;s being published.
                </p>
                <footer
                  className="text-xs sm:text-xs font-mono tracking-widest uppercase pt-1"
                  style={{ color: TEAL }}
                >
                  Come-from-Beyond
                  <span className="opacity-50 mx-2">·</span>
                  Discord, June 19, 2026
                </footer>
              </blockquote>
              <div
                className="h-px max-w-[200px] mx-auto"
                style={{
                  background: `linear-gradient(to right, transparent, ${TEAL}40, transparent)`,
                }}
              />
            </div>

            {/* Preface excerpt */}
            <div
              className="space-y-5 text-base sm:text-base leading-[1.85] text-left max-w-2xl mx-auto"
              style={{ color: TEXT_DIM, fontFamily: 'Georgia, serif' }}
            >
              <p>
                Our previous book, &laquo;Qubic. The Long Version&raquo;,
                assembled the Qubic universe into a single fresco: the
                mechanism, the details, the functions of one large whole. This
                book is different. It is about a man.
              </p>
              <p>
                About a twenty-five-year line stretched from an article in a
                Minsk computer newspaper to an event that happened in the summer
                of 2026 on the screens of hundreds of home computers around the
                world. It answers the questions &ldquo;who is building it, and
                why&rdquo;. At its end you will find answers to riddles you may
                have long stopped hoping to solve.
              </p>
            </div>

            {/* ToC: 11 chapters */}
            <div className="pt-4 space-y-6">
              <div className="text-center space-y-2">
                <div
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: TEAL }}
                >
                  Inside the Book
                </div>
                <div
                  className="h-px w-12 mx-auto"
                  style={{ backgroundColor: `${TEAL}40` }}
                />
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5 text-left max-w-2xl mx-auto">
                {CFB_TOC.map(ch => (
                  <li
                    className="flex items-baseline gap-3 text-sm leading-relaxed group"
                    key={ch.num}
                  >
                    <span
                      className="text-xs font-mono tracking-[0.05em] flex-shrink-0 whitespace-nowrap tabular-nums"
                      style={{ color: TEAL, minWidth: '3.5rem' }}
                    >
                      Ch.&nbsp;{ch.num}
                    </span>
                    <span
                      className="transition-colors group-hover:text-white/90"
                      style={{ color: TEXT_DIM, fontFamily: 'Georgia, serif' }}
                    >
                      {ch.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Teaser: opening of Chapter 1 */}
            <div className="pt-4">
              <div className="text-center space-y-2 mb-6">
                <div
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: TEAL }}
                >
                  A Taste · Chapter 1
                </div>
                <div
                  className="h-px w-12 mx-auto"
                  style={{ backgroundColor: `${TEAL}40` }}
                />
              </div>
              <div
                className="relative px-6 sm:px-10 py-10 sm:py-14 mx-auto max-w-2xl text-left"
                style={{
                  background:
                    'linear-gradient(180deg, #fdfbf3 0%, #f7f1de 100%)',
                  color: '#1c1a14',
                  boxShadow: '0 30px 60px -25px rgba(0,0,0,0.5)',
                }}
              >
                <div className="text-center mb-6">
                  <span
                    className="text-xs font-mono tracking-widest uppercase"
                    style={{ color: '#7a6f4d' }}
                  >
                    Chapter 1
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl mt-1"
                    style={{
                      color: '#1c1a14',
                      fontFamily: 'Georgia, serif',
                      fontWeight: 700,
                    }}
                  >
                    The Man with a Time Machine
                  </h3>
                  <span
                    aria-hidden
                    className="block text-2xl mt-3"
                    style={{ color: '#a89863', fontFamily: 'Georgia, serif' }}
                  >
                    ❦
                  </span>
                </div>
                <p
                  className="text-lg italic leading-[1.85] mb-5"
                  style={{ color: '#5a5340', fontFamily: 'Georgia, serif' }}
                >
                  The time machine exists.
                </p>
                <p
                  className="text-base leading-[1.85]"
                  style={{ color: '#1c1a14', fontFamily: 'Georgia, serif' }}
                >
                  <span
                    className="float-left text-[64px] leading-[0.85] font-bold mr-2 mt-1"
                    style={{ color: '#1c1a14', fontFamily: 'Georgia, serif' }}
                  >
                    Y
                  </span>
                  es, that is hard to believe. The science fiction writers are
                  largely to blame. They decided how the machine was supposed to
                  look and how it was supposed to work: a chair, levers, dates
                  blinking on a counter, or even a DeLorean. Which is exactly
                  why everyone who goes looking for a time machine goes looking
                  for a chair with levers.
                </p>
                <div
                  className="flex items-center justify-center gap-4 pt-8 mt-8 border-t"
                  style={{ borderColor: 'rgba(28,26,20,0.12)' }}
                >
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-90"
                    onClick={() => openReader(1)}
                    style={{
                      color: '#1c1a14',
                      borderColor: 'rgba(28,26,20,0.4)',
                      backgroundColor: 'transparent',
                    }}
                    type="button"
                  >
                    <BookOpen className="w-3 h-3" />
                    Continue Reading
                  </button>
                  <span
                    className="text-xs font-mono tracking-widest uppercase"
                    style={{ color: '#7a6f4d' }}
                  >
                    Page 5 →
                  </span>
                </div>
              </div>
            </div>

            {/* Meet the man: link to the /cfb dossier */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-xs font-mono tracking-widest uppercase border transition-all hover:opacity-90"
                href="/cfb"
                style={{
                  color: TEAL,
                  borderColor: `${TEAL}40`,
                  backgroundColor: `${TEAL}08`,
                }}
              >
                Meet the man · The Dossier
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                className="inline-flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase hover:opacity-70 transition-opacity"
                href="#library"
                style={{ color: TEXT_DIM }}
              >
                <ArrowLeft className="w-3 h-3" /> Back to the Library
              </a>
            </div>
          </section>

          {/* Voluntary Support */}
          <section className="space-y-5 max-w-xl mx-auto">
            <div className="text-center space-y-2">
              <div
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: GOLD }}
              >
                Voluntary Support
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{
                  backgroundColor: `color-mix(in oklab, ${GOLD} 19%, transparent)`,
                }}
              />
            </div>
            <p
              className="text-sm leading-relaxed text-center"
              style={{ color: TEXT_DIM }}
            >
              The book is free. If you wish to thank the author, you may
              voluntarily send QUBIC to the wallet below, or use the{' '}
              <Link
                className="underline underline-offset-2"
                href="/donate"
                style={{ color: GOLD }}
              >
                donate page
              </Link>{' '}
              for a QR code.
            </p>
            <div
              className="p-3 border text-center cursor-pointer transition-all"
              onClick={handleCopy}
              style={{
                borderColor: BORDER,
                backgroundColor: 'rgba(240,192,48,0.04)',
              }}
            >
              <code
                className="text-xs sm:text-xs font-mono break-all select-all leading-relaxed"
                style={{ color: GOLD }}
              >
                {DONATION_ADDRESS}
              </code>
            </div>
            <div className="flex justify-center">
              <button
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-widest uppercase border transition-all"
                onClick={handleCopy}
                style={{
                  color: copied ? '#10B981' : GOLD,
                  borderColor: copied
                    ? 'rgba(16,185,129,0.4)'
                    : `color-mix(in oklab, ${GOLD} 25%, transparent)`,
                  backgroundColor: copied
                    ? 'rgba(16,185,129,0.08)'
                    : `color-mix(in oklab, ${GOLD} 3%, transparent)`,
                }}
                type="button"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Copied' : 'Copy Address'}
              </button>
            </div>
          </section>

          {/* Future placeholder + footer */}
          <div className="space-y-6 pt-8">
            <p
              className="text-center text-xs italic"
              style={{
                color: 'var(--muted-foreground)',
                fontFamily: 'Georgia, serif',
              }}
            >
              More books, coming soon.
            </p>
            <div
              className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-mono pt-6 border-t"
              style={{ color: TEXT_DIM, borderColor: 'rgba(216,216,226,0.06)' }}
            >
              <a
                className="flex items-center gap-1 hover:opacity-70"
                href="https://wallet.qubic.org"
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="w-3 h-3" /> Qubic Wallet
              </a>
              <Link
                className="flex items-center gap-1 hover:opacity-70"
                href="/get-qubic"
              >
                Get QUBIC
              </Link>
              <Link
                className="flex items-center gap-1 hover:opacity-70"
                href="/donate"
              >
                Donate
              </Link>
              <Link
                className="flex items-center gap-1 hover:opacity-70"
                href="/companion"
              >
                Companion
              </Link>
              <Link
                className="flex items-center gap-1 hover:opacity-70"
                href="/"
              >
                Homepage
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Flip book reader, when open, hide the page underneath to eliminate any
          gradient-banding artifacts behind the reader's solid backdrop. */}
      {reader && (
        <>
          <style>{'html, body { overflow: hidden; }'}</style>
          <BookFlipReader
            files={reader.files}
            initialFile={reader.file}
            onClose={() => setReader(null)}
            title={reader.title}
          />
        </>
      )}
    </div>
  )
}
