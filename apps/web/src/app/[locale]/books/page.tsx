'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
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
        style={{ backgroundColor: 'rgba(8,8,14,0.97)', backdropFilter: 'blur(8px)' }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f0c030' }} />
      </div>
    ),
  }
)

const GOLD = '#f0c030'
const BG = '#0d0d14'
const TEXT_PRIMARY = '#d8d8e2'
const TEXT_DIM = 'rgba(216, 216, 226, 0.55)'
const BORDER = 'rgba(240, 192, 48, 0.20)'
const CARD_BG = 'rgba(255, 255, 255, 0.06)'
const TIER1 = '#10B981'
const TIER2 = '#fbbf24'
const TIER3 = '#ec4899'

const DONATION_ADDRESS = 'BDRFCOFWHRTEHHMQQUIYJBXEOLNARADAGFUSBFGJFABYZBZLQNWJIPPFRTXO'

const READER_FILES = [
  { label: 'EN', href: '/books/qubic-long-version-eng.pdf' },
  { label: 'RU', href: '/books/qubic-long-version-rus.pdf' },
]

const TOC: { roman: string; title: string; chapters: { num: number; name: string }[] }[] = [
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
      { num: 8, name: "Murdoch's Gas in Action — UPoW" },
      { num: 9, name: 'The Breathing Token' },
      { num: 10, name: 'The Arbitrator — A Temporary Monarch' },
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
  const [readerOpen, setReaderOpen] = useState(false)
  const [readerInitial, setReaderInitial] = useState(0)

  const handleCopy = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const openReader = useCallback((langIdx: number) => {
    setReaderInitial(langIdx)
    setReaderOpen(true)
  }, [])

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: BG }}>
      {/* Atmospheric backdrop: warm parchment glow behind cover */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[1200px] h-[1000px] rounded-full blur-3xl"
          style={{ backgroundColor: `${GOLD}06` }}
        />
        <div
          className="absolute top-[40%] left-[15%] w-[400px] h-[400px] rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: `${GOLD}08` }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase hover:opacity-70 transition-opacity"
          style={{ color: TEXT_DIM }}
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-24 pt-12 sm:pt-16"
        >
          {/* Hero */}
          <section className="space-y-10 text-center">
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2.5 px-4 py-2 text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.35em] uppercase"
                style={{
                  backgroundColor: `${GOLD}10`,
                  border: `1px solid ${GOLD}30`,
                  color: `${GOLD}cc`,
                }}
              >
                <span
                  className="inline-flex h-1.5 w-1.5"
                  style={{ backgroundColor: `${GOLD}99` }}
                />
                First Book · Qubic Church · 2026
              </span>
            </div>

            {/* Cover with glow */}
            <div className="flex justify-center">
              <div className="relative inline-block group">
                {/* Cover glow */}
                <div
                  className="absolute -inset-8 sm:-inset-12 blur-3xl opacity-40 -z-10 transition-opacity group-hover:opacity-60"
                  style={{
                    background: `radial-gradient(ellipse at center, ${GOLD}25 0%, ${GOLD}08 50%, transparent 75%)`,
                  }}
                />
                <button
                  onClick={() => openReader(0)}
                  aria-label="Open book in flip-book reader"
                  className="relative block transition-transform duration-300 ease-out hover:scale-[1.015] focus:outline-none focus:ring-2 focus:ring-[#f0c030]/50 cursor-pointer"
                  style={{
                    border: `1px solid ${BORDER}`,
                    boxShadow:
                      '0 50px 100px -30px rgba(0, 0, 0, 0.7), 0 25px 50px -25px rgba(240, 192, 48, 0.3)',
                  }}
                >
                  <Image
                    src="/books/covers/qubic-long-version-cover.png"
                    alt="Qubic — The Long Version cover artwork: a sepia pencil illustration of a head whose brain is an industrial labyrinth labelled PROOF, ANN, AIGARTH, COMPUTOR, 676 and COMPUTE."
                    width={1600}
                    height={2263}
                    priority
                    quality={88}
                    className="block w-full max-w-[300px] sm:max-w-[420px] md:max-w-[520px] h-auto"
                    sizes="(max-width: 640px) 300px, (max-width: 768px) 420px, 520px"
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
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-[10px] font-mono tracking-[0.25em] uppercase border whitespace-nowrap"
                      style={{
                        color: GOLD,
                        borderColor: `${GOLD}80`,
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
                  style={{ color: `${GOLD}cc` }}
                >
                  The Long Version
                </span>
              </h1>
              <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase pt-2" style={{ color: TEXT_DIM }}>
                <span>By Qubic Church</span>
                <span style={{ color: `${GOLD}40` }}>·</span>
                <span>2026</span>
                <span style={{ color: `${GOLD}40` }}>·</span>
                <span>18 Chapters</span>
                <span style={{ color: `${GOLD}40` }}>·</span>
                <span>~200 Pages</span>
                <span style={{ color: `${GOLD}40` }}>·</span>
                <span style={{ color: TIER1 }}>Free</span>
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                onClick={() => openReader(0)}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 text-[11px] font-mono tracking-[0.25em] uppercase border transition-all hover:opacity-90"
                style={{
                  color: BG,
                  backgroundColor: GOLD,
                  borderColor: GOLD,
                  fontWeight: 600,
                }}
              >
                <BookOpen className="w-4 h-4" />
                Read in Browser
              </button>
              <a
                href="/books/qubic-long-version-eng.pdf"
                download
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 text-[11px] font-mono tracking-[0.25em] uppercase border transition-all hover:opacity-90"
                style={{
                  color: GOLD,
                  borderColor: `${GOLD}50`,
                  backgroundColor: `${GOLD}08`,
                }}
              >
                <Download className="w-4 h-4" />
                Download PDF · 3.6 MB
              </a>
            </div>
          </section>

          {/* CfB pull-quote */}
          <section className="space-y-5">
            <div
              className="h-px max-w-[200px] mx-auto"
              style={{
                background: `linear-gradient(to right, transparent, ${GOLD}40, transparent)`,
              }}
            />
            <blockquote className="text-center space-y-4 px-4">
              <span
                aria-hidden
                className="block text-6xl sm:text-7xl leading-none -mb-2 select-none"
                style={{ color: `${GOLD}30`, fontFamily: 'Georgia, serif' }}
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
                className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase pt-2"
                style={{ color: `${GOLD}80` }}
              >
                Come-from-Beyond
                <span className="opacity-50 mx-2">·</span>
                February 7, 2026
              </footer>
            </blockquote>
            <div
              className="h-px max-w-[200px] mx-auto"
              style={{
                background: `linear-gradient(to right, transparent, ${GOLD}40, transparent)`,
              }}
            />
          </section>

          {/* Preface */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <div
                className="text-[10px] font-mono tracking-[0.4em] uppercase"
                style={{ color: `${GOLD}60` }}
              >
                Preface
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{ backgroundColor: `${GOLD}30` }}
              />
            </div>

            <div
              className="space-y-5 text-[16px] sm:text-[17px] leading-[1.85]"
              style={{ color: TEXT_PRIMARY, fontFamily: 'Georgia, serif' }}
            >
              <p className="first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.85]" style={{ ['--first-letter-color' as never]: GOLD }}>
                <span style={{ color: GOLD }} className="contents">T</span>he story of Qubic begins long before Bitcoin and contains many vivid stages.
                To study the path that the visionary Come-from-Beyond lays beneath his own
                feet is genuinely interesting.
              </p>
              <p style={{ color: TEXT_DIM }}>
                My father spent a significant amount of time studying this subject and,
                being a master of religious studies, looked at Qubic on a somewhat larger
                scale than is customary.
              </p>
              <p style={{ color: TEXT_DIM }}>
                The main challenge for the ordinary person who today takes an interest in
                Qubic is to grasp the scale, the structure, the functions, and the meaning
                of every detail of a large mechanism. Believe me, this is a whole universe
                with a rich history and many secrets we&apos;ll be uncovering over time.
                Come-from-Beyond, like an ancient artist, is painting a large picture.
                Elements that seem unconnected gradually begin to fuse and take shape.
              </p>
            </div>

            <div className="flex justify-center">
              <span
                className="text-2xl select-none"
                style={{ color: `${GOLD}50`, fontFamily: 'Georgia, serif' }}
                aria-hidden
              >
                ❦
              </span>
            </div>

            <div
              className="space-y-5 text-[15px] sm:text-[16px] leading-[1.85]"
              style={{ color: TEXT_DIM, fontFamily: 'Georgia, serif' }}
            >
              <p>
                This book does one simple thing: it gathers what&apos;s been scattered
                into a single fresco, structures it, and presents it in plain language.
              </p>
              <p>
                Who should read this? Anyone who&apos;s even a little connected to Qubic
                will find something here for themselves. A newcomer will learn the basic
                principles of how it works and see connections where they didn&apos;t see
                them before. An experienced holder can enjoy the history and the
                beautiful allegories my father&apos;s speech is so full of. The
                professional and the master can take a look at the overall picture from
                the outside and, perhaps, see something they used to miss.
              </p>
              <p>
                All CfB quotes used in this book are taken verbatim from open primary
                sources — the official Qubic Discord, his publications on X, the
                team&apos;s scientific papers. If you spot an inaccuracy — write in. The
                book is alive; the next edition will incorporate corrections.
              </p>
              <p>
                A caveat is in order: Come-from-Beyond&apos;s style is a wild ride on a
                motorcycle off-road. In the Qubic universe, you rarely find information
                laid out in a structured way. That&apos;s why we believe this book will
                be a pleasant addition to every Qubic holder&apos;s library.
              </p>
            </div>

            <div
              className="text-center pt-2 text-[15px] sm:text-[16px] italic"
              style={{ color: TEXT_PRIMARY, fontFamily: 'Georgia, serif' }}
            >
              The book is distributed absolutely freely.
            </div>

            <div className="text-center pt-3 italic" style={{ color: TEXT_DIM, fontFamily: 'Georgia, serif' }}>
              <p className="text-[14px] sm:text-[15px] leading-relaxed">
                &mdash; Thank you, Father. Your contribution is invaluable.
              </p>
            </div>
          </section>

          {/* Downloads card */}
          <section className="space-y-5">
            <div className="text-center space-y-2">
              <div
                className="text-[10px] font-mono tracking-[0.4em] uppercase"
                style={{ color: `${GOLD}60` }}
              >
                Three Downloads
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{ backgroundColor: `${GOLD}30` }}
              />
            </div>

            <div
              className="border p-6 sm:p-8 space-y-4"
              style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => openReader(0)}
                  className="flex items-center gap-3 p-4 border text-left transition-all hover:opacity-90"
                  style={{ color: GOLD, borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` }}
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-mono tracking-[0.15em] uppercase">English</span>
                    <span className="text-[10px] font-mono mt-0.5" style={{ color: `${GOLD}80` }}>
                      Read · Flip-book
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => openReader(1)}
                  className="flex items-center gap-3 p-4 border text-left transition-all hover:opacity-90"
                  style={{ color: GOLD, borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` }}
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-mono tracking-[0.15em] uppercase">Русский</span>
                    <span className="text-[10px] font-mono mt-0.5" style={{ color: `${GOLD}80` }}>
                      Читать · Original
                    </span>
                  </div>
                </button>
                <a
                  href="/books/anna-matrix-companion.pdf"
                  download
                  className="flex items-center gap-3 p-4 border transition-all hover:opacity-90"
                  style={{ color: GOLD, borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` }}
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-mono tracking-[0.15em] uppercase">Companion</span>
                    <span className="text-[10px] font-mono mt-0.5" style={{ color: `${GOLD}80` }}>
                      PDF · 1.6 MB · Ch. 13
                    </span>
                  </div>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 text-[10px] font-mono tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.30)' }}>
                <a
                  href="/books/qubic-long-version-eng.pdf"
                  download
                  className="hover:opacity-80 underline underline-offset-2"
                  style={{ color: TEXT_DIM }}
                >
                  Download English PDF · 3.6 MB
                </a>
                <span>·</span>
                <a
                  href="/books/qubic-long-version-rus.pdf"
                  download
                  className="hover:opacity-80 underline underline-offset-2"
                  style={{ color: TEXT_DIM }}
                >
                  Скачать Русский PDF · 5.2 MB
                </a>
              </div>
            </div>
          </section>

          {/* ToC */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <div
                className="text-[10px] font-mono tracking-[0.4em] uppercase"
                style={{ color: `${GOLD}60` }}
              >
                Inside the Book
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{ backgroundColor: `${GOLD}30` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {TOC.map((part) => (
                <div key={part.roman} className="space-y-4">
                  <div className="flex items-baseline gap-4 pb-2 border-b" style={{ borderColor: `${GOLD}20` }}>
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
                      style={{ color: TEXT_PRIMARY, fontFamily: 'Georgia, serif' }}
                    >
                      {part.title}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {part.chapters.map((ch) => (
                      <li
                        key={ch.num}
                        className="flex items-baseline gap-3 text-[14px] leading-[1.5] group"
                      >
                        <span
                          className="text-[10px] font-mono tracking-[0.05em] flex-shrink-0 whitespace-nowrap transition-colors tabular-nums"
                          style={{ color: `${GOLD}90`, minWidth: '3.5rem' }}
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
              ))}
            </div>
          </section>

          {/* Excerpt teaser — opening of Chapter 1 */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <div
                className="text-[10px] font-mono tracking-[0.4em] uppercase"
                style={{ color: `${GOLD}60` }}
              >
                A Taste · Chapter 1
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{ backgroundColor: `${GOLD}30` }}
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
                  className="text-[10px] font-mono tracking-[0.45em] uppercase"
                  style={{ color: '#7a6f4d' }}
                >
                  Chapter 1
                </span>
                <h3
                  className="text-3xl sm:text-4xl mt-1"
                  style={{ color: '#1c1a14', fontFamily: 'Georgia, serif', fontWeight: 700 }}
                >
                  Murdoch&apos;s Gas
                </h3>
                <span
                  className="block text-2xl mt-3"
                  style={{ color: '#a89863', fontFamily: 'Georgia, serif' }}
                  aria-hidden
                >
                  ❦
                </span>
              </div>

              <p
                className="italic text-[15px] mb-5"
                style={{ color: '#5a5340', fontFamily: 'Georgia, serif' }}
              >
                Useful waste.
              </p>

              <p
                className="text-[16px] leading-[1.85] mb-5"
                style={{ color: '#1c1a14', fontFamily: 'Georgia, serif' }}
              >
                <span
                  className="float-left text-[64px] leading-[0.85] font-bold mr-2 mt-1"
                  style={{ color: '#1c1a14', fontFamily: 'Georgia, serif' }}
                >
                  T
                </span>
                here&apos;s a kind of thing you learn to see one day — and then you wonder
                how you didn&apos;t notice it before. One of those things is the difference
                between work and its waste.
              </p>

              <p
                className="text-[16px] leading-[1.85] mb-5"
                style={{ color: '#1c1a14', fontFamily: 'Georgia, serif' }}
              >
                Take any furnace. Something burns inside it, something gets heated, and
                the desired product comes out. But besides the product, there&apos;s
                always something else left over. Smoke. Steam. Smell. Noise. Heat going
                off into the walls. For centuries people treated those leftovers as
                garbage — the inevitable companion of useful work, something that had to
                be disposed of somehow or simply released into the air.
              </p>

              <p
                className="text-[16px] leading-[1.85]"
                style={{ color: '#1c1a14', fontFamily: 'Georgia, serif' }}
              >
                Sometimes a person comes along who looks at this garbage more attentively
                than the rest. And asks a strange question: <em>what if we don&apos;t release it?</em>
              </p>

              <div
                className="flex items-center justify-center gap-4 pt-8 mt-8 border-t"
                style={{ borderColor: 'rgba(28,26,20,0.12)' }}
              >
                <button
                  onClick={() => openReader(0)}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono tracking-[0.2em] uppercase border transition-all hover:opacity-90"
                  style={{
                    color: '#1c1a14',
                    borderColor: 'rgba(28,26,20,0.4)',
                    backgroundColor: 'transparent',
                  }}
                >
                  <BookOpen className="w-3 h-3" />
                  Continue Reading
                </button>
                <span
                  className="text-[10px] font-mono tracking-[0.2em] uppercase"
                  style={{ color: '#7a6f4d' }}
                >
                  Page 11 →
                </span>
              </div>
            </div>
          </section>

          {/* Companion section with tier badges */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <div
                className="text-[10px] font-mono tracking-[0.4em] uppercase"
                style={{ color: `${GOLD}60` }}
              >
                The Companion File
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{ backgroundColor: `${GOLD}30` }}
              />
            </div>

            <div
              className="border p-6 sm:p-8 space-y-6"
              style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
            >
              <p className="text-[15px] leading-[1.8]" style={{ color: TEXT_PRIMARY, fontFamily: 'Georgia, serif' }}>
                Chapter 13 covers the{' '}
                <Link
                  href="/evidence"
                  className="underline underline-offset-2"
                  style={{ color: GOLD }}
                >
                  Anna Matrix
                </Link>{' '}
                in narrative form. The Companion is a 41-page forensic appendix
                designed to be loaded into a large language model alongside the chapter,
                so any reader can verify every claim with copy-paste Python snippets
                running against the published matrix data.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { color: TIER1, label: 'Tier 1 · Verified', desc: '~99% confidence · 4 lines of Python' },
                  { color: TIER2, label: 'Tier 2 · Supported', desc: '50–89% confidence · multiple indicators' },
                  { color: TIER3, label: 'Tier 3 · Speculative', desc: '10–49% confidence · marked clearly' },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="p-3.5 space-y-1.5"
                    style={{ borderLeft: `2px solid ${t.color}`, backgroundColor: `${t.color}08` }}
                  >
                    <div className="text-[10px] font-mono tracking-[0.15em] uppercase" style={{ color: t.color }}>
                      ▪ {t.label}
                    </div>
                    <p className="text-[11px] leading-[1.5]" style={{ color: TEXT_DIM }}>
                      {t.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t" style={{ borderColor: 'rgba(216,216,226,0.08)' }}>
                <div className="text-center pt-4 space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: TEXT_PRIMARY }}>22,480</div>
                  <div className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: TEXT_DIM }}>Hypotheses Tested</div>
                </div>
                <div className="text-center pt-4 space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: TIER1 }}>10</div>
                  <div className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: TEXT_DIM }}>Tier 1 Confirmed</div>
                </div>
                <div className="text-center pt-4 space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: GOLD }}>13</div>
                  <div className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: TEXT_DIM }}>Sections · 41 pp.</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/companion"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-mono tracking-[0.2em] uppercase border transition-all hover:opacity-90"
                  style={{ color: GOLD, borderColor: `${GOLD}50`, backgroundColor: `${GOLD}10` }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Companion Page
                </Link>
                <a
                  href="/books/anna-matrix-companion.pdf"
                  download
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-mono tracking-[0.2em] uppercase border transition-all hover:opacity-90"
                  style={{ color: TEXT_DIM, borderColor: 'rgba(216,216,226,0.20)' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF · 1.6 MB
                </a>
              </div>
            </div>
          </section>

          {/* Voluntary Support */}
          <section className="space-y-5 max-w-xl mx-auto">
            <div className="text-center space-y-2">
              <div
                className="text-[10px] font-mono tracking-[0.4em] uppercase"
                style={{ color: `${GOLD}60` }}
              >
                Voluntary Support
              </div>
              <div
                className="h-px w-12 mx-auto"
                style={{ backgroundColor: `${GOLD}30` }}
              />
            </div>
            <p className="text-[13px] leading-[1.7] text-center" style={{ color: TEXT_DIM }}>
              The book is free. If you wish to thank the author, you may voluntarily send QUBIC to
              the wallet below — or use the{' '}
              <Link href="/donate" className="underline underline-offset-2" style={{ color: GOLD }}>
                donate page
              </Link>{' '}
              for a QR code.
            </p>
            <div
              className="p-3 border text-center cursor-pointer transition-all"
              style={{ borderColor: BORDER, backgroundColor: 'rgba(240,192,48,0.04)' }}
              onClick={handleCopy}
            >
              <code
                className="text-[11px] sm:text-xs font-mono break-all select-all leading-relaxed"
                style={{ color: GOLD }}
              >
                {DONATION_ADDRESS}
              </code>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono tracking-[0.15em] uppercase border transition-all"
                style={{
                  color: copied ? '#10B981' : GOLD,
                  borderColor: copied ? 'rgba(16,185,129,0.4)' : `${GOLD}40`,
                  backgroundColor: copied ? 'rgba(16,185,129,0.08)' : `${GOLD}08`,
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Address'}
              </button>
            </div>
          </section>

          {/* Future placeholder + footer */}
          <div className="space-y-6 pt-8">
            <p
              className="text-center text-[12px] italic"
              style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'Georgia, serif' }}
            >
              More books — coming soon.
            </p>
            <div
              className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] font-mono pt-6 border-t"
              style={{ color: TEXT_DIM, borderColor: 'rgba(216,216,226,0.06)' }}
            >
              <a
                href="https://wallet.qubic.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:opacity-70"
              >
                <ExternalLink className="w-3 h-3" /> Qubic Wallet
              </a>
              <Link href="/get-qubic" className="flex items-center gap-1 hover:opacity-70">
                Get QUBIC
              </Link>
              <Link href="/donate" className="flex items-center gap-1 hover:opacity-70">
                Donate
              </Link>
              <Link href="/companion" className="flex items-center gap-1 hover:opacity-70">
                Companion
              </Link>
              <Link href="/" className="flex items-center gap-1 hover:opacity-70">
                Homepage
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Flip book reader — when open, hide the page underneath to eliminate any
          gradient-banding artifacts behind the reader's solid backdrop. */}
      {readerOpen && (
        <>
          <style>{`html, body { overflow: hidden; }`}</style>
          <BookFlipReader
            files={READER_FILES}
            initialFile={readerInitial}
            onClose={() => setReaderOpen(false)}
          />
        </>
      )}
    </div>
  )
}
