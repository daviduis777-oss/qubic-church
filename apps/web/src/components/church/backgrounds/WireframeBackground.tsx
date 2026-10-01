'use client'

/**
 * WireframeBackground - Fixed Three.js wireframe landscape behind all content
 * Reuses the existing WireframeLandscape component at reduced settings for performance.
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { WireframeLandscape } from '../hero/WireframeLandscape'

export function WireframeBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.4) 75%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.4) 75%, transparent 100%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 4, 12], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <WireframeLandscape
            segments={30}
            amplitude={2}
            opacity={0.2}
            speed={0.06}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
