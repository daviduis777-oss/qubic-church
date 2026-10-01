'use client'

import { MotionConfig } from 'framer-motion'

/**
 * Site-wide: framer-motion follows the OS "reduce motion" setting
 * (transform animations are skipped, opacity fades remain).
 */
export function ReducedMotionConfig({
  children,
}: {
  children: React.ReactNode
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
