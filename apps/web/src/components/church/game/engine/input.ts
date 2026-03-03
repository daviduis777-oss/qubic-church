/**
 * Anna Matrix Explorer - Input System
 * Unified input handling for keyboard, touch, and gamepad
 */

import type { InputAction, Position } from './types'

// ============================================
// KEY MAPPINGS
// ============================================

const KEY_MAPPINGS: Record<string, InputAction> = {
  // Movement - WASD
  w: 'move-up',
  a: 'move-left',
  s: 'move-down',
  d: 'move-right',

  // Movement - Arrows
  arrowup: 'move-up',
  arrowdown: 'move-down',
  arrowleft: 'move-left',
  arrowright: 'move-right',

  // Actions
  e: 'interact',
  space: 'scan',

  // Menus
  escape: 'menu',
  i: 'inventory',
  m: 'map',
  q: 'cancel',
}

// ============================================
// INPUT MANAGER
// ============================================

export type InputCallback = (action: InputAction) => void
export type DirectionCallback = (direction: 'up' | 'down' | 'left' | 'right') => void

interface InputManagerConfig {
  holdToMoveDelay: number // ms between repeated moves when holding
  joystickDeadzone: number // 0-1, threshold for joystick activation
  vibrationEnabled: boolean
}

const defaultConfig: InputManagerConfig = {
  holdToMoveDelay: 80,
  joystickDeadzone: 0.2,
  vibrationEnabled: true,
}

class InputManager {
  private config: InputManagerConfig
  private activeKeys: Set<string> = new Set()
  private callbacks: Map<InputAction, Set<InputCallback>> = new Map()
  private directionCallbacks: Set<DirectionCallback> = new Set()
  private moveInterval: NodeJS.Timeout | null = null
  private lastMoveTime: number = 0
  private joystickDirection: { x: number; y: number } | null = null
  private touchStartPosition: Position | null = null
  private initialized: boolean = false

  constructor(config: Partial<InputManagerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // ========== Initialization ==========

  initialize(): void {
    if (this.initialized) return

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    // Prevent default for game keys
    window.addEventListener('keydown', this.preventDefaultForGameKeys)

    // Gamepad
    window.addEventListener('gamepadconnected', this.handleGamepadConnected)
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected)

    this.initialized = true
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('keydown', this.preventDefaultForGameKeys)
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected)
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected)

    if (this.moveInterval) {
      clearInterval(this.moveInterval)
      this.moveInterval = null
    }

    this.activeKeys.clear()
    this.callbacks.clear()
    this.directionCallbacks.clear()
    this.initialized = false
  }

  // ========== Configuration ==========

  updateConfig(config: Partial<InputManagerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // ========== Event Subscription ==========

  onAction(action: InputAction, callback: InputCallback): () => void {
    if (!this.callbacks.has(action)) {
      this.callbacks.set(action, new Set())
    }
    this.callbacks.get(action)!.add(callback)

    return () => {
      this.callbacks.get(action)?.delete(callback)
    }
  }

  onDirection(callback: DirectionCallback): () => void {
    this.directionCallbacks.add(callback)
    return () => {
      this.directionCallbacks.delete(callback)
    }
  }

  // ========== Keyboard Handling ==========

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase()

    if (this.activeKeys.has(key)) return
    this.activeKeys.add(key)

    const action = KEY_MAPPINGS[key]
    if (action) {
      this.triggerAction(action)

      // Start hold-to-move for movement keys
      if (action.startsWith('move-')) {
        this.startHoldToMove()
      }
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase()
    this.activeKeys.delete(key)

    // Stop hold-to-move if no movement keys are held
    if (!this.isAnyMovementKeyHeld()) {
      this.stopHoldToMove()
    }
  }

  private preventDefaultForGameKeys = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase()
    if (KEY_MAPPINGS[key]) {
      e.preventDefault()
    }
  }

  // ========== Hold-to-Move ==========

  private isAnyMovementKeyHeld(): boolean {
    return (
      this.activeKeys.has('w') ||
      this.activeKeys.has('a') ||
      this.activeKeys.has('s') ||
      this.activeKeys.has('d') ||
      this.activeKeys.has('arrowup') ||
      this.activeKeys.has('arrowdown') ||
      this.activeKeys.has('arrowleft') ||
      this.activeKeys.has('arrowright')
    )
  }

  private startHoldToMove(): void {
    if (this.moveInterval) return

    this.moveInterval = setInterval(() => {
      this.processHeldMovement()
    }, this.config.holdToMoveDelay)
  }

  private stopHoldToMove(): void {
    if (this.moveInterval) {
      clearInterval(this.moveInterval)
      this.moveInterval = null
    }
  }

  private processHeldMovement(): void {
    const now = Date.now()
    if (now - this.lastMoveTime < this.config.holdToMoveDelay) return

    // Process in priority order: up > down > left > right
    if (this.activeKeys.has('w') || this.activeKeys.has('arrowup')) {
      this.triggerDirection('up')
    } else if (this.activeKeys.has('s') || this.activeKeys.has('arrowdown')) {
      this.triggerDirection('down')
    } else if (this.activeKeys.has('a') || this.activeKeys.has('arrowleft')) {
      this.triggerDirection('left')
    } else if (this.activeKeys.has('d') || this.activeKeys.has('arrowright')) {
      this.triggerDirection('right')
    }

    this.lastMoveTime = now
  }

  // ========== Touch/Joystick Handling ==========

  handleJoystickInput(x: number, y: number): void {
    const deadzone = this.config.joystickDeadzone
    const magnitude = Math.sqrt(x * x + y * y)

    if (magnitude < deadzone) {
      this.joystickDirection = null
      this.stopHoldToMove()
      return
    }

    this.joystickDirection = { x, y }

    // Convert to direction
    const angle = Math.atan2(y, x) * (180 / Math.PI)

    if (angle > -45 && angle <= 45) {
      this.triggerDirection('right')
    } else if (angle > 45 && angle <= 135) {
      this.triggerDirection('down')
    } else if (angle > 135 || angle <= -135) {
      this.triggerDirection('left')
    } else {
      this.triggerDirection('up')
    }

    // Start continuous movement
    if (!this.moveInterval) {
      this.startHoldToMove()
    }
  }

  handleJoystickRelease(): void {
    this.joystickDirection = null
    this.stopHoldToMove()
  }

  handleTap(position: Position): void {
    // Tap could be used for scan or interact
    this.triggerAction('scan')
  }

  // ========== Gamepad Handling ==========

  private handleGamepadConnected = (e: GamepadEvent): void => {
    this.startGamepadPolling()
  }

  private handleGamepadDisconnected = (e: GamepadEvent): void => {
  }

  private gamepadPollInterval: NodeJS.Timeout | null = null

  private startGamepadPolling(): void {
    if (this.gamepadPollInterval) return

    this.gamepadPollInterval = setInterval(() => {
      this.pollGamepad()
    }, 16) // ~60fps
  }

  private pollGamepad(): void {
    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[0]

    if (!gamepad) return

    // Left stick
    const lx = gamepad.axes[0] ?? 0
    const ly = gamepad.axes[1] ?? 0

    if (Math.abs(lx) > this.config.joystickDeadzone || Math.abs(ly) > this.config.joystickDeadzone) {
      this.handleJoystickInput(lx, ly)
    } else if (this.joystickDirection) {
      this.handleJoystickRelease()
    }

    // D-Pad
    if (gamepad.buttons[12]?.pressed) this.triggerDirection('up')
    if (gamepad.buttons[13]?.pressed) this.triggerDirection('down')
    if (gamepad.buttons[14]?.pressed) this.triggerDirection('left')
    if (gamepad.buttons[15]?.pressed) this.triggerDirection('right')

    // A button = interact
    if (gamepad.buttons[0]?.pressed) this.triggerAction('interact')
    // B button = cancel
    if (gamepad.buttons[1]?.pressed) this.triggerAction('cancel')
    // X button = scan
    if (gamepad.buttons[2]?.pressed) this.triggerAction('scan')
    // Start = menu
    if (gamepad.buttons[9]?.pressed) this.triggerAction('menu')
  }

  // ========== Action Triggering ==========

  private triggerAction(action: InputAction): void {
    this.callbacks.get(action)?.forEach((cb) => cb(action))
  }

  private triggerDirection(direction: 'up' | 'down' | 'left' | 'right'): void {
    this.directionCallbacks.forEach((cb) => cb(direction))
  }

  // ========== Vibration ==========

  vibrate(pattern: number | number[]): void {
    if (!this.config.vibrationEnabled) return

    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }

    // Try gamepad vibration
    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[0]
    if (gamepad?.vibrationActuator) {
      const duration = Array.isArray(pattern) ? pattern[0] : pattern
      gamepad.vibrationActuator.playEffect('dual-rumble', {
        duration,
        strongMagnitude: 0.5,
        weakMagnitude: 0.5,
      })
    }
  }

  // ========== State Queries ==========

  isKeyHeld(key: string): boolean {
    return this.activeKeys.has(key.toLowerCase())
  }

  getJoystickDirection(): { x: number; y: number } | null {
    return this.joystickDirection
  }

  isMoving(): boolean {
    return this.isAnyMovementKeyHeld() || this.joystickDirection !== null
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const inputManager = new InputManager()

// ============================================
// REACT HOOK
// ============================================

import { useEffect, useRef } from 'react'

export function useInput(
  onDirection: DirectionCallback,
  onAction?: (action: InputAction) => void
): void {
  const directionRef = useRef(onDirection)
  const actionRef = useRef(onAction)

  // Keep refs updated
  directionRef.current = onDirection
  actionRef.current = onAction

  useEffect(() => {
    inputManager.initialize()

    const unsubDirection = inputManager.onDirection((dir) => {
      directionRef.current(dir)
    })

    const unsubActions: (() => void)[] = []
    if (actionRef.current) {
      const actions: InputAction[] = ['scan', 'interact', 'menu', 'inventory', 'map', 'cancel']
      actions.forEach((action) => {
        const unsub = inputManager.onAction(action, (a) => {
          actionRef.current?.(a)
        })
        unsubActions.push(unsub)
      })
    }

    return () => {
      unsubDirection()
      unsubActions.forEach((unsub) => unsub())
    }
  }, [])
}

// ============================================
// VIRTUAL JOYSTICK COMPONENT HELPERS
// ============================================

export interface JoystickState {
  active: boolean
  x: number // -1 to 1
  y: number // -1 to 1
  angle: number // degrees
  distance: number // 0 to 1
}

export function calculateJoystickState(
  touchX: number,
  touchY: number,
  centerX: number,
  centerY: number,
  radius: number
): JoystickState {
  const dx = touchX - centerX
  const dy = touchY - centerY
  const distance = Math.min(Math.sqrt(dx * dx + dy * dy) / radius, 1)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return {
    active: distance > 0.1,
    x: (dx / radius) * Math.min(distance, 1),
    y: (dy / radius) * Math.min(distance, 1),
    angle,
    distance,
  }
}
