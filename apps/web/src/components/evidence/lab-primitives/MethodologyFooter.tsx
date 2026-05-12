'use client'

import Link from 'next/link'

export interface MethodologyFooterProps {
 /** e.g. "Methodology · Phase D + Phase E" */
 label: string
 /** Optional CTA link to the full paper */
 paperHref?: string
 paperLabel?: string
}

export function MethodologyFooter({
 label,
 paperHref,
 paperLabel = 'Read the full research paper →',
}: MethodologyFooterProps) {
 return (
 <div className="px-4 sm:px-6 lg:px-8 py-4 border-x border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
 <div className="text-[10px] text-white/30 font-mono tracking-wider">{label}</div>
 {paperHref && (
 <Link
 href={paperHref}
 className="text-[10px] text-[#D4AF37]/40 hover:text-[#D4AF37]/80 font-mono transition-colors"
 >
 {paperLabel}
 </Link>
 )}
 </div>
 )
}
