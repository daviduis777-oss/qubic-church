'use client'

import { useEffect, useRef } from 'react'
import { extend, useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import * as THREE from 'three'

extend({ EffectComposer, RenderPass, UnrealBloomPass, ShaderPass })

interface PostProcessingEffectsProps {
  bloomStrength?: number
  bloomRadius?: number
  bloomThreshold?: number
}

export function PostProcessingEffects({
  bloomStrength = 1.5,
  bloomRadius = 0.4,
  bloomThreshold = 0.2,
}: PostProcessingEffectsProps) {
  const { gl, scene, camera, size } = useThree()
  const composerRef = useRef<EffectComposer | null>(null)

  useEffect(() => {
    const composer = new EffectComposer(gl)
    composer.setSize(size.width, size.height)

    // Render pass
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // Bloom pass for glowing effects
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      bloomStrength,
      bloomRadius,
      bloomThreshold
    )
    composer.addPass(bloomPass)

    // FXAA pass for anti-aliasing
    const fxaaPass = new ShaderPass(FXAAShader)
    fxaaPass.material!.uniforms['resolution']!.value.set(1 / size.width, 1 / size.height)
    composer.addPass(fxaaPass)

    composerRef.current = composer

    return () => {
      composer.dispose()
    }
  }, [gl, scene, camera, size, bloomStrength, bloomRadius, bloomThreshold])

  useFrame(() => {
    if (composerRef.current) {
      composerRef.current.render()
    }
  }, 1)

  return null
}
