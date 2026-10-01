/**
 * Anna Matrix Explorer - Audio System
 * Web Audio API based sound management
 */

// ============================================
// AUDIO TYPES
// ============================================

export type SoundEffect =
  | 'move'
  | 'scan'
  | 'discover'
  | 'discover-rare'
  | 'interact'
  | 'menu-open'
  | 'menu-close'
  | 'button-click'
  | 'level-up'
  | 'quest-complete'
  | 'error'
  | 'combat-start'
  | 'combat-hit'
  | 'combat-miss'
  | 'combat-victory'

export type AmbientTrack = 'genesis' | 'exploration' | 'combat' | 'deep-network' | 'menu'

interface AudioConfig {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  ambientVolume: number
  muted: boolean
}

// ============================================
// SOUND SYNTHESIZER
// ============================================

/**
 * Generates simple sound effects using Web Audio API
 * No external audio files needed
 */
class SoundSynthesizer {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      } catch {
        console.warn('Web Audio API not supported')
        return null
      }
    }

    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }

    return this.ctx
  }

  /**
   * Play a simple beep/tone
   */
  playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3): void {
    const ctx = this.getContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }

  /**
   * Play a frequency sweep (rising or falling)
   */
  playSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3
  ): void {
    const ctx = this.getContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }

  /**
   * Play noise burst (white noise for impacts/hits)
   */
  playNoise(duration: number, volume = 0.2): void {
    const ctx = this.getContext()
    if (!ctx) return

    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2000, ctx.currentTime)

    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    source.start(ctx.currentTime)
    source.stop(ctx.currentTime + duration)
  }

  /**
   * Play a chord (multiple frequencies)
   */
  playChord(frequencies: number[], duration: number, type: OscillatorType = 'sine', volume = 0.2): void {
    const volumePerNote = volume / frequencies.length
    frequencies.forEach((freq) => {
      this.playTone(freq, duration, type, volumePerNote)
    })
  }

  destroy(): void {
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}

// ============================================
// AUDIO MANAGER
// ============================================

class AudioManager {
  private config: AudioConfig = {
    masterVolume: 0.7,
    sfxVolume: 1.0,
    musicVolume: 0.5,
    ambientVolume: 0.3,
    muted: false,
  }

  private synth = new SoundSynthesizer()
  private initialized = false

  // ========== Initialization ==========

  initialize(): void {
    if (this.initialized) return

    // Load saved settings
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('anna-matrix-audio')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          this.config = { ...this.config, ...parsed }
        } catch {
          // Ignore parse errors
        }
      }
    }

    this.initialized = true
  }

  destroy(): void {
    this.synth.destroy()
    this.initialized = false
  }

  // ========== Configuration ==========

  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume))
    this.saveConfig()
  }

  setSfxVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume))
    this.saveConfig()
  }

  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume))
    this.saveConfig()
  }

  setAmbientVolume(volume: number): void {
    this.config.ambientVolume = Math.max(0, Math.min(1, volume))
    this.saveConfig()
  }

  setMuted(muted: boolean): void {
    this.config.muted = muted
    this.saveConfig()
  }

  toggleMute(): boolean {
    this.config.muted = !this.config.muted
    this.saveConfig()
    return this.config.muted
  }

  getConfig(): Readonly<AudioConfig> {
    return { ...this.config }
  }

  private saveConfig(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('anna-matrix-audio', JSON.stringify(this.config))
    }
  }

  private getEffectiveVolume(type: 'sfx' | 'music' | 'ambient'): number {
    if (this.config.muted) return 0

    const typeVolume =
      type === 'sfx'
        ? this.config.sfxVolume
        : type === 'music'
          ? this.config.musicVolume
          : this.config.ambientVolume

    return this.config.masterVolume * typeVolume
  }

  // ========== Sound Effects ==========

  playSfx(effect: SoundEffect): void {
    if (!this.initialized) this.initialize()

    const volume = this.getEffectiveVolume('sfx')
    if (volume === 0) return

    switch (effect) {
      case 'move':
        // Soft blip for movement
        this.synth.playTone(220, 0.05, 'sine', volume * 0.3)
        break

      case 'scan':
        // Scanning sweep sound
        this.synth.playSweep(400, 800, 0.3, 'sine', volume * 0.4)
        break

      case 'discover':
        // Discovery chime (rising)
        this.synth.playSweep(400, 800, 0.15, 'sine', volume * 0.5)
        setTimeout(() => {
          this.synth.playTone(1000, 0.2, 'sine', volume * 0.4)
        }, 100)
        break

      case 'discover-rare':
        // Rare discovery fanfare
        this.synth.playChord([523, 659, 784], 0.2, 'sine', volume * 0.5)
        setTimeout(() => {
          this.synth.playChord([587, 740, 880], 0.3, 'sine', volume * 0.5)
        }, 200)
        setTimeout(() => {
          this.synth.playChord([659, 831, 988], 0.4, 'sine', volume * 0.6)
        }, 400)
        break

      case 'interact':
        // Interaction click
        this.synth.playTone(600, 0.08, 'square', volume * 0.3)
        break

      case 'menu-open':
        // Menu open whoosh
        this.synth.playSweep(200, 600, 0.15, 'sine', volume * 0.4)
        break

      case 'menu-close':
        // Menu close whoosh
        this.synth.playSweep(600, 200, 0.15, 'sine', volume * 0.4)
        break

      case 'button-click':
        // Simple click
        this.synth.playTone(800, 0.05, 'square', volume * 0.2)
        break

      case 'level-up':
        // Level up fanfare
        const notes = [523, 659, 784, 1047]
        notes.forEach((freq, i) => {
          setTimeout(() => {
            this.synth.playTone(freq, 0.15, 'sine', volume * 0.5)
          }, i * 100)
        })
        break

      case 'quest-complete':
        // Quest complete jingle
        this.synth.playChord([392, 494, 587], 0.15, 'sine', volume * 0.4)
        setTimeout(() => {
          this.synth.playChord([523, 659, 784], 0.3, 'sine', volume * 0.5)
        }, 150)
        break

      case 'error':
        // Error buzz
        this.synth.playTone(200, 0.15, 'sawtooth', volume * 0.3)
        setTimeout(() => {
          this.synth.playTone(150, 0.2, 'sawtooth', volume * 0.3)
        }, 100)
        break

      case 'combat-start':
        // Combat alert
        this.synth.playTone(440, 0.1, 'square', volume * 0.4)
        setTimeout(() => {
          this.synth.playTone(550, 0.1, 'square', volume * 0.4)
        }, 100)
        setTimeout(() => {
          this.synth.playTone(660, 0.15, 'square', volume * 0.5)
        }, 200)
        break

      case 'combat-hit':
        // Hit impact
        this.synth.playNoise(0.1, volume * 0.4)
        this.synth.playTone(150, 0.1, 'sine', volume * 0.3)
        break

      case 'combat-miss':
        // Miss whoosh
        this.synth.playSweep(400, 200, 0.15, 'sine', volume * 0.2)
        break

      case 'combat-victory':
        // Victory fanfare
        const victoryNotes = [
          [523, 659, 784],
          [587, 740, 880],
          [659, 831, 988],
          [784, 988, 1175],
        ]
        victoryNotes.forEach((chord, i) => {
          setTimeout(() => {
            this.synth.playChord(chord, 0.25, 'sine', volume * 0.4)
          }, i * 200)
        })
        break
    }
  }

  // ========== Quick Access Methods ==========

  move(): void {
    this.playSfx('move')
  }

  scan(): void {
    this.playSfx('scan')
  }

  discover(rare = false): void {
    this.playSfx(rare ? 'discover-rare' : 'discover')
  }

  interact(): void {
    this.playSfx('interact')
  }

  click(): void {
    this.playSfx('button-click')
  }

  error(): void {
    this.playSfx('error')
  }

  levelUp(): void {
    this.playSfx('level-up')
  }

  questComplete(): void {
    this.playSfx('quest-complete')
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const audioManager = new AudioManager()

// ============================================
// REACT HOOK
// ============================================

import { useEffect, useCallback } from 'react'

export function useAudio() {
  useEffect(() => {
    audioManager.initialize()
    return () => {
      // Don't destroy on unmount to allow sounds to continue
    }
  }, [])

  const play = useCallback((effect: SoundEffect) => {
    audioManager.playSfx(effect)
  }, [])

  const setVolume = useCallback((type: 'master' | 'sfx' | 'music' | 'ambient', volume: number) => {
    switch (type) {
      case 'master':
        audioManager.setMasterVolume(volume)
        break
      case 'sfx':
        audioManager.setSfxVolume(volume)
        break
      case 'music':
        audioManager.setMusicVolume(volume)
        break
      case 'ambient':
        audioManager.setAmbientVolume(volume)
        break
    }
  }, [])

  const toggleMute = useCallback(() => {
    return audioManager.toggleMute()
  }, [])

  return {
    play,
    setVolume,
    toggleMute,
    config: audioManager.getConfig(),
    // Quick access
    move: audioManager.move.bind(audioManager),
    scan: audioManager.scan.bind(audioManager),
    discover: audioManager.discover.bind(audioManager),
    interact: audioManager.interact.bind(audioManager),
    click: audioManager.click.bind(audioManager),
    error: audioManager.error.bind(audioManager),
    levelUp: audioManager.levelUp.bind(audioManager),
    questComplete: audioManager.questComplete.bind(audioManager),
  }
}
