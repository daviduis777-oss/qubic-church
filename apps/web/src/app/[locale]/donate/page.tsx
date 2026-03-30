'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, ExternalLink, Heart } from 'lucide-react'

const GOLD = '#f0c030'
const BG = '#0d0d14'
const TEXT_PRIMARY = '#d8d8e2'
const TEXT_DIM = 'rgba(216, 216, 226, 0.55)'
const BORDER = 'rgba(240, 192, 48, 0.20)'
const CARD_BG = 'rgba(255, 255, 255, 0.06)'

const DONATION_ADDRESS = 'BDRFCOFWHRTEHHMQQUIYJBXEOLNARADAGFUSBFGJFABYZBZLQNWJIPPFRTXO'

export default function DonatePage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-12">

        <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase hover:opacity-70 transition-opacity" style={{ color: TEXT_DIM }}>
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-8">

          {/* Header */}
          <div className="text-center space-y-4">
            <Heart className="w-8 h-8 mx-auto" style={{ color: GOLD }} />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.06em]" style={{ color: GOLD }}>
              Support Independent Research
            </h1>
            <p className="text-[15px] leading-[1.75] max-w-lg mx-auto" style={{ color: TEXT_DIM }}>
              Qubic Church is a nonprofit research community. Your donation funds open-source AGI research, community education, and the development of decentralised intelligence infrastructure.
            </p>
          </div>

          {/* QR Code + Address */}
          <div className="border p-6 sm:p-8 space-y-6" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${DONATION_ADDRESS}&bgcolor=FFFFFF&color=000000`}
                  alt="Donation QR Code"
                  width={200}
                  height={200}
                  className="block"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <div className="text-xs font-mono tracking-[0.2em] uppercase text-center" style={{ color: `${GOLD}80` }}>
                Qubic Wallet Address
              </div>
              <div
                className="p-4 border text-center cursor-pointer group transition-all hover:border-opacity-60"
                style={{ borderColor: BORDER, backgroundColor: 'rgba(240,192,48,0.04)' }}
                onClick={handleCopy}
              >
                <code className="text-sm sm:text-base font-mono break-all select-all leading-relaxed" style={{ color: GOLD }}>
                  {DONATION_ADDRESS}
                </code>
              </div>

              {/* Copy button */}
              <div className="flex justify-center">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-mono tracking-[0.15em] uppercase border transition-all"
                  style={{
                    color: copied ? '#10B981' : GOLD,
                    borderColor: copied ? 'rgba(16,185,129,0.4)' : `${GOLD}40`,
                    backgroundColor: copied ? 'rgba(16,185,129,0.08)' : `${GOLD}08`,
                  }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
              </div>
            </div>
          </div>

          {/* What your donation supports */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono tracking-[0.3em] uppercase text-center" style={{ color: `${GOLD}60` }}>
              Your Donation Supports
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Open Research', desc: 'Anna Matrix analysis, Aigarth architecture research, peer-reviewed publications' },
                { title: 'Community Education', desc: 'Making decentralised AGI accessible — documentation, guides, educational content' },
                { title: 'Infrastructure', desc: 'Website hosting, research tools, MiroFish simulations, data verification' },
                { title: 'Maria Aigarth', desc: 'Running the Fractal Rationalism AI agent — API costs, development, maintenance' },
              ].map((item) => (
                <div key={item.title} className="p-4 border space-y-2" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
                  <div className="text-sm font-mono font-bold" style={{ color: TEXT_PRIMARY }}>{item.title}</div>
                  <p className="text-[13px] leading-[1.6]" style={{ color: TEXT_DIM }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How to send */}
          <div className="border p-6 space-y-4" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
            <h3 className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: `${GOLD}80` }}>
              How to Send QUBIC
            </h3>
            <div className="space-y-2 text-[13px] leading-[1.75]" style={{ color: TEXT_DIM }}>
              <p><strong style={{ color: TEXT_PRIMARY }}>1.</strong> Open your Qubic wallet at <a href="https://wallet.qubic.org" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: GOLD }}>wallet.qubic.org</a></p>
              <p><strong style={{ color: TEXT_PRIMARY }}>2.</strong> Click &ldquo;Send&rdquo; and paste the address above</p>
              <p><strong style={{ color: TEXT_PRIMARY }}>3.</strong> Enter any amount and confirm the transaction</p>
              <p className="text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Qubic transactions have zero fees and confirm in under 1 second.</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex justify-center gap-4 text-[11px] font-mono" style={{ color: TEXT_DIM }}>
            <a href="https://wallet.qubic.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:opacity-70">
              <ExternalLink className="w-3 h-3" /> Qubic Wallet
            </a>
            <Link href="/get-qubic" className="flex items-center gap-1 hover:opacity-70">
              Get QUBIC
            </Link>
            <Link href="/" className="flex items-center gap-1 hover:opacity-70">
              Homepage
            </Link>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] italic" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Qubic Church is a 501(c)(3) nonprofit organization (registration in progress). All donations are used exclusively for research and community development.
          </p>

        </motion.div>
      </div>
    </div>
  )
}
