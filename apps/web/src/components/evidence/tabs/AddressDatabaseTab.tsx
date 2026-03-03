'use client'

import { Database, Binary } from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy load table components for better performance
const QubicSeedsTable = dynamic(
  () => import('../tables/QubicSeedsTable'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent animate-spin" />
          <span className="text-white/40">Loading Qubic Seeds...</span>
        </div>
      </div>
    ),
  }
)

/**
 * Address Database Tab
 *
 * Displays searchable table for:
 * - Qubic Seeds (55-char private seeds → 60-char public identities)
 */
export default function AddressDatabaseTab() {
  return (
    <div className="w-full min-h-[600px] bg-[#050505] border border-white/[0.04] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#D4AF37]/[0.06] border border-[#D4AF37]/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-[#D4AF37]/70" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/90 tracking-wider">
              Address Database
            </h3>
            <p className="text-sm text-white/40">
              Cryptographic research data from the Bitcoin-Qubic bridge analysis
            </p>
          </div>
        </div>
      </div>

      {/* Qubic Seeds */}
      <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-white/[0.03] border border-white/[0.06] w-fit">
        <Binary className="w-4 h-4 text-[#D4AF37]/70" />
        <span className="text-sm text-white/60">Qubic Seeds</span>
      </div>

      <QubicSeedsTable />
    </div>
  )
}
