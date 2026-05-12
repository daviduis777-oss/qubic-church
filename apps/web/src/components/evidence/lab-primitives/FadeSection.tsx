'use client'

import { LazyMotion, domAnimation, m, type HTMLMotionProps } from 'framer-motion'

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export function FadeSection(props: HTMLMotionProps<'section'>) {
  return (
    <LazyMotion features={domAnimation}>
      <m.section {...fadeIn} {...props} />
    </LazyMotion>
  )
}
