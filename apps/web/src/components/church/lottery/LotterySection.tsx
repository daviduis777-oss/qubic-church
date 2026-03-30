'use client'

/**
 * LotterySection Component
 * Holy Circle Lottery for Anna NFT holders
 * Church HUD Design System: no rounded corners, gold accents, angular aesthetic
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LOTTERY_CONFIG, PRIZE_STRUCTURE } from '@/config/lottery'
import { Trophy, Coins, AlertCircle, CheckCircle2, Sparkles, Crown, Medal, Award } from 'lucide-react'

/**
 * Format bigint with commas
 */
function formatBigInt(num: bigint): string {
  return num.toLocaleString('en-US')
}

const placeIcons = [Crown, Medal, Award, Trophy, Trophy]
const placeColors = ['text-[#D4AF37]', 'text-white/50', 'text-[#D4AF37]/60', 'text-[#D4AF37]/40', 'text-[#D4AF37]/30']

export function LotterySection() {
  const [walletAddress, setWalletAddress] = useState('')
  const [nftId, setNftId] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setVerificationResult(null)

    // Simulate verification (in production, this would call verifier API)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock result
    const success = Math.random() > 0.5
    setVerificationResult({
      success,
      message: success
        ? `Entry confirmed! NFT #${nftId} verified.`
        : `Verification failed. Please ensure you own NFT #${nftId}.`,
    })
    setIsVerifying(false)

    if (success) {
      setWalletAddress('')
      setNftId('')
    }
  }

  return (
    <section className="relative w-full py-24 md:py-32 bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#D4AF37]/5 to-black" />

      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/10 blur-[200px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-4 py-2 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              The Holy Circle
            </span>
          </motion.div>

          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-4xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#D4AF37]/80 to-[#D4AF37]">
              76M QUBIC
            </span>
            <span className="block text-xl md:text-2xl text-white/60 font-semibold mt-2">
              Prize Pool
            </span>
          </motion.div>

          <p className="text-lg text-white/50 max-w-xl mx-auto mb-6">
            The ultimate community lottery for Anna NFT holders
          </p>

          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-6 py-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">
              Coming Soon
            </span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Prize Pool */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="p-6 md:p-8 bg-[#050505] border border-white/[0.04] hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all duration-500">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-6 h-6 text-[#D4AF37]" />
                <h3 className="text-xl font-semibold text-white">Prize Structure</h3>
              </div>
              <div className="space-y-3">
                {PRIZE_STRUCTURE.map((prize, index) => {
                  const Icon = placeIcons[index] || Trophy
                  const color = placeColors[index] || 'text-white'
                  return (
                    <div
                      key={prize.place}
                      className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 bg-white/5 border border-white/[0.06] ${color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {formatBigInt(prize.qubic)} QUBIC
                          </div>
                          <div className="text-sm text-white/50">
                            {prize.percentage}% of pool
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-white/40">
                        {prize.percentage}%
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span className="text-white/70">Total Prize Pool</span>
                  <div className="text-right">
                    <div className="text-[#D4AF37]">
                      {formatBigInt(LOTTERY_CONFIG.prizePool.qubic)} QUBIC
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Entry Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="p-6 md:p-8 bg-[#050505] border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-6">
                <Coins className="w-6 h-6 text-[#D4AF37]" />
                <h3 className="text-xl font-semibold text-white">Enter the Draw</h3>
              </div>

              <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20 mb-6">
                <p className="text-sm text-[#D4AF37]/80">
                  <strong className="text-[#D4AF37]">Requirements:</strong> Own an Anna NFT to enter the draw.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Wallet Address */}
                <div>
                  <label
                    htmlFor="lottery-wallet"
                    className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono block mb-2"
                  >
                    Qubic Wallet Address
                  </label>
                  <input
                    id="lottery-wallet"
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter your Qubic address..."
                    className="w-full px-4 py-3 bg-black border border-white/[0.06] text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:shadow-[0_0_15px_rgba(212,175,55,0.05)] transition-all"
                    required
                    disabled={isVerifying}
                  />
                </div>

                {/* NFT ID */}
                <div>
                  <label
                    htmlFor="lottery-nft-id"
                    className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono block mb-2"
                  >
                    Anna NFT ID
                  </label>
                  <input
                    id="lottery-nft-id"
                    type="number"
                    min="1"
                    max="200"
                    value={nftId}
                    onChange={(e) => setNftId(e.target.value)}
                    placeholder="1 - 200"
                    className="w-full px-4 py-3 bg-black border border-white/[0.06] text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:shadow-[0_0_15px_rgba(212,175,55,0.05)] transition-all"
                    required
                    disabled={isVerifying}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isVerifying || !walletAddress || !nftId}
                  className="w-full py-4 bg-[#D4AF37] text-black font-bold text-lg hover:bg-[#D4AF37]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-black/30 border-t-black" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Enter'
                  )}
                </button>

                {/* Verification Result */}
                {verificationResult && (
                  <div
                    className={`flex items-start gap-3 p-4 ${
                      verificationResult.success
                        ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    {verificationResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <p
                      className={`text-sm ${
                        verificationResult.success ? 'text-[#D4AF37]' : 'text-red-400'
                      }`}
                    >
                      {verificationResult.message}
                    </p>
                  </div>
                )}
              </form>
            </div>

            {/* Additional Info */}
            <div className="p-5 bg-[#050505] border border-white/[0.04]">
              <h4 className="font-semibold text-white mb-4">How it works:</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Each Anna NFT holder gets 1 lottery ticket</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Winners drawn transparently using blockchain randomness</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>5 winners share the QUBIC prize pool</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
