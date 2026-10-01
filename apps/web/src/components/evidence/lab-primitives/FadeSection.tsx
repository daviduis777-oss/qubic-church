'use client'

import {
  LazyMotion,
  domAnimation,
  m,
  type HTMLMotionProps,
} from 'framer-motion'

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
}

export function FadeSection(props: HTMLMotionProps<'section'>) {
  return (
    <LazyMotion features={domAnimation}>
      <m.section {...fadeIn} {...props} />
    </LazyMotion>
  )
}
