/**
 * Anna Matrix Explorer - Engine Module
 * Re-exports all engine components
 */

// Types
export * from './types'

// Store
export { useGameStore } from './store'
export type { GameState } from './types'

// Input
export { inputManager, useInput, calculateJoystickState } from './input'
export type { InputCallback, DirectionCallback, JoystickState } from './input'

// Selectors
export {
  selectPlayer,
  selectPosition,
  selectStats,
  selectCombat,
  selectUI,
  selectSettings,
  selectCurrentZone,
  selectIsInCombat,
  selectIsPaused,
} from './store'

// Audio
export { audioManager, useAudio } from './audio'
export type { SoundEffect, AmbientTrack } from './audio'
