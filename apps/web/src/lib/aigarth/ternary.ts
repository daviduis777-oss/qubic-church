/**
 * TERNARY ENCODING MODULE
 *
 * EXACT TypeScript implementation of Qubic Core (score_common.h).
 *
 * Key insight: Binary 0 -> -1, Binary 1 -> +1
 * This creates ternary states: -1 (FALSE), 0 (UNKNOWN), +1 (TRUE)
 */

import type { TernaryState, StateDistribution } from './types'

/**
 * Clamp value to ternary range [-1, 0, +1].
 *
 * This is the fundamental operation that converts weighted sums
 * to ternary neuron states.
 */
export function ternaryClamp(value: number): TernaryState {
  if (value > 0) return 1
  if (value < 0) return -1
  return 0
}

/**
 * Convert number to ternary bits.
 *
 * EXACT implementation from Qubic Core score_common.h:
 * - Binary bit 0 -> -1 (FALSE)
 * - Binary bit 1 -> +1 (TRUE)
 *
 * @param number - Integer to convert
 * @param bitCount - Number of bits to extract
 * @returns Array of ternary values (-1 or +1)
 *
 * @example
 * toTernaryBits(5, 4) // 5 = 0101 in binary
 * // Returns [1, -1, 1, -1] (LSB first)
 */
export function toTernaryBits(num: number, bitCount: number): TernaryState[] {
  const bits: TernaryState[] = []
  for (let i = 0; i < bitCount; i++) {
    const bitValue = (num >> i) & 1
    // Key transformation: 0 -> -1, 1 -> +1
    bits.push(bitValue === 0 ? -1 : 1)
  }
  return bits
}

/**
 * Convert ternary bits back to integer.
 *
 * Based on extractLastOutput from Qubic Core:
 * - Positive values -> 1
 * - Non-positive values -> 0
 */
export function fromTernaryBits(bits: TernaryState[]): number {
  let result = 0
  for (let i = 0; i < bits.length; i++) {
    // Positive -> 1, otherwise -> 0
    const bit = bits[i] ?? 0
    if (bit > 0) {
      result |= 1 << i
    }
  }
  return result
}

/**
 * Convert bytes to ternary bits.
 * Each byte produces 8 ternary values.
 */
export function bytesToTernary(data: Uint8Array): TernaryState[] {
  const result: TernaryState[] = []
  for (const byte of data) {
    result.push(...toTernaryBits(byte, 8))
  }
  return result
}

/**
 * Convert text to ternary bits.
 * UTF-8 encodes the text, then converts to ternary.
 *
 * @param text - Text to convert
 * @param maxBytes - Maximum bytes to use (default 64 = 512 ternary bits)
 */
export function textToTernary(text: string, maxBytes: number = 64): TernaryState[] {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text).slice(0, maxBytes)

  const result = bytesToTernary(bytes)

  // Pad to fixed size
  const targetSize = maxBytes * 8
  while (result.length < targetSize) {
    result.push(-1) // Pad with -1 (like binary 0)
  }

  return result.slice(0, targetSize)
}

/**
 * Convert hex string to ternary bits.
 * Handles both with and without '0x' prefix.
 */
export function hexToTernary(hexString: string): TernaryState[] {
  // Remove 0x prefix if present
  let cleanHex = hexString.toLowerCase().replace('0x', '')

  // Pad to even length
  if (cleanHex.length % 2 !== 0) {
    cleanHex = '0' + cleanHex
  }

  // Convert to bytes
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const hex = cleanHex.substr(i * 2, 2)
    bytes[i] = hex ? parseInt(hex, 16) : 0
  }

  return bytesToTernary(bytes)
}

/**
 * Compute total energy of ternary states.
 * Energy is simply the sum of all states.
 */
export function computeEnergy(states: TernaryState[]): number {
  return states.reduce((sum: number, s: TernaryState) => sum + s, 0 as number)
}

/**
 * Compute distribution of ternary states.
 */
export function computeDistribution(states: TernaryState[]): StateDistribution {
  return {
    positive: states.filter((s) => s > 0).length,
    neutral: states.filter((s) => s === 0).length,
    negative: states.filter((s) => s < 0).length,
  }
}

/**
 * Generate SHA-256 hash of text (browser-compatible).
 */
export async function sha256(text: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hashBuffer)
}

/**
 * Get energy label for display.
 */
export function getEnergyLabel(energy: number): string {
  if (energy > 50) return 'EXTREMELY POSITIVE'
  if (energy > 20) return 'POSITIVE'
  if (energy > 0) return 'SLIGHTLY POSITIVE'
  if (energy === 0) return 'NEUTRAL'
  if (energy > -20) return 'SLIGHTLY NEGATIVE'
  if (energy > -50) return 'NEGATIVE'
  return 'EXTREMELY NEGATIVE'
}

/**
 * Create ASCII visualization of state vector.
 */
export function visualizeStates(states: TernaryState[], width: number = 64): string {
  return states
    .slice(0, width)
    .map((s) => (s > 0 ? '\u2588' : s < 0 ? '\u2591' : '\u2592'))
    .join('')
}
