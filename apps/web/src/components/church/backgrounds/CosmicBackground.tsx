'use client'

/**
 * CosmicBackground - Pure black background with minimal star field
 * No warm colors, no brown tints. Pure black + white stars + subtle gold hints.
 */

import { useEffect, useRef, memo } from 'react'
import dynamic from 'next/dynamic'

const WireframeBackground = dynamic(
  () => import('./WireframeBackground').then((mod) => ({ default: mod.WireframeBackground })),
  { ssr: false }
)

interface CosmicBackgroundProps {
  intensity?: 'low' | 'medium' | 'high'
  showStars?: boolean
  showPerspectiveGrid?: boolean
  showWireframe?: boolean
  className?: string
}

interface ColoredStar {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  color: number[]
  twinklePhase: number
}

// Star colors - pure white/cool tones only, no warm amber
const STAR_COLORS = [
  [255, 255, 255],   // white
  [255, 255, 255],   // white
  [255, 255, 255],   // white
  [240, 240, 255],   // cool white
  [220, 220, 240],   // blue-white
  [200, 200, 220],   // steel
]

// Animated star field - pure white stars, no warm tints
const StarField = memo(function StarField({ intensity }: { intensity: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0

    const resizeCanvas = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const starCount = intensity === 'high' ? 200 : intensity === 'medium' ? 120 : 60
    const stars: ColoredStar[] = []

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.2,
        opacity: Math.random() * 0.6 + 0.1,
        speed: Math.random() * 0.5 + 0.1,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]!,
        twinklePhase: Math.random() * Math.PI * 2,
      })
    }

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      const time = Date.now() * 0.001

      for (const star of stars) {
        const twinkle = Math.sin(time * star.speed + star.twinklePhase) * 0.4 + 0.6
        const alpha = star.opacity * twinkle
        const [r, g, b] = star.color

        // Draw glow for brighter stars
        if (star.size > 1.2 && alpha > 0.4) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.05})`
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.fill()

        // Slow drift
        star.y += star.speed * 0.06
        if (star.y > height) {
          star.y = 0
          star.x = Math.random() * width
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.4 }}
    />
  )
})

// 3D Perspective Grid - pure white lines, no color
const GRID_KEYFRAMES = `
@keyframes grid-drift {
  0% { background-position: 0px 0px, 0px 0px; }
  100% { background-position: 0px 60px, 60px 0px; }
}
`

const PerspectiveGrid = memo(function PerspectiveGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <style>{GRID_KEYFRAMES}</style>

      {/* Bottom grid - floor perspective */}
      <div
        className="absolute left-[-50%] right-[-50%] bottom-[-10%] h-[60%]"
        style={{
          perspective: '800px',
          perspectiveOrigin: '50% 0%',
        }}
      >
        <div
          className="w-full h-full"
          style={{
            transform: 'rotateX(65deg)',
            transformOrigin: '50% 0%',
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            animation: 'grid-drift 12s linear infinite',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.4) 50%, transparent 100%), linear-gradient(to right, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%)',
            maskComposite: 'intersect',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.5) 50%, transparent 100%), linear-gradient(to right, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%)',
            WebkitMaskComposite: 'source-in',
          }}
        />
      </div>
    </div>
  )
})

export function CosmicBackground({
  intensity = 'medium',
  showStars = true,
  showPerspectiveGrid = false,
  showWireframe = false,
  className = '',
}: CosmicBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Pure black base */}
      <div className="absolute inset-0 bg-black" />

      {/* 3D Three.js wireframe landscape */}
      {showWireframe && <WireframeBackground />}

      {/* CSS Perspective grid (fallback) */}
      {showPerspectiveGrid && !showWireframe && <PerspectiveGrid />}

      {/* Star field */}
      {showStars && <StarField intensity={intensity} />}

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] pointer-events-none" />
    </div>
  )
}

export default CosmicBackground
