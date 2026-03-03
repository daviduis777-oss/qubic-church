/**
 * Bitcoin Address Derivation from Public Key
 *
 * Converts uncompressed ECDSA public keys (65 bytes, starting with 04)
 * to P2PKH Bitcoin addresses (starting with 1).
 *
 * Process: SHA256 → RIPEMD160 → Version Byte → Checksum → Base58
 */

import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import bs58check from 'bs58check'

/**
 * Derives a P2PKH Bitcoin address from an uncompressed public key.
 *
 * @param pubkeyHex - 66-character hex string starting with "04" (uncompressed pubkey)
 * @returns P2PKH Bitcoin address starting with "1"
 *
 * @example
 * // Block 73 public key → known Patoshi address
 * pubkeyToAddress("041ff327e119b244f3c6140c13f94fdde6432fa02aebaac4a263859615080d0096a43d447affc1572e3391d762de5aa8aa650cda877b3bf42ecd157cfe49ad838a")
 * // Returns: "1Ky8dP7oR1cBeg1MzkrgHAeHAHyn92DCar"
 */
export function pubkeyToAddress(pubkeyHex: string): string {
  // Validate input
  if (!pubkeyHex || pubkeyHex.length < 66) {
    return 'Invalid pubkey'
  }

  // Handle both with and without "04" prefix
  const cleanPubkey = pubkeyHex.startsWith('04') ? pubkeyHex : `04${pubkeyHex}`

  try {
    // Step 1: Convert hex to bytes
    const pubkeyBytes = hexToBytes(cleanPubkey)

    // Step 2: SHA256 hash
    const sha256Hash = sha256(pubkeyBytes)

    // Step 3: RIPEMD160 hash (creates 20-byte hash160)
    const hash160 = ripemd160(sha256Hash)

    // Step 4: Add version byte (0x00 for mainnet P2PKH)
    const versionedPayload = new Uint8Array(21)
    versionedPayload[0] = 0x00 // Mainnet version byte
    versionedPayload.set(hash160, 1)

    // Step 5: Base58Check encode (includes checksum)
    const address = bs58check.encode(versionedPayload)

    return address
  } catch {
    return 'Error deriving address'
  }
}

/**
 * Converts a hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Cache for derived addresses to avoid recalculating
 */
const addressCache = new Map<string, string>()

/**
 * Cached version of pubkeyToAddress for better performance with large datasets
 */
export function pubkeyToAddressCached(pubkeyHex: string): string {
  const cached = addressCache.get(pubkeyHex)
  if (cached) return cached

  const address = pubkeyToAddress(pubkeyHex)
  addressCache.set(pubkeyHex, address)
  return address
}

/**
 * Validates if a string is a valid Bitcoin address format
 */
export function isValidBitcoinAddress(address: string): boolean {
  // P2PKH addresses start with 1 and are 25-34 characters
  if (address.startsWith('1') && address.length >= 25 && address.length <= 34) {
    return true
  }
  // P2SH addresses start with 3
  if (address.startsWith('3') && address.length >= 25 && address.length <= 34) {
    return true
  }
  // Bech32 addresses start with bc1
  if (address.startsWith('bc1') && address.length >= 42 && address.length <= 62) {
    return true
  }
  return false
}

/**
 * Returns the hash160 (RIPEMD160(SHA256(pubkey))) for a public key
 * Useful for comparing addresses without full derivation
 */
export function pubkeyToHash160(pubkeyHex: string): string {
  if (!pubkeyHex || pubkeyHex.length < 66) {
    return ''
  }

  const cleanPubkey = pubkeyHex.startsWith('04') ? pubkeyHex : `04${pubkeyHex}`

  try {
    const pubkeyBytes = hexToBytes(cleanPubkey)
    const sha256Hash = sha256(pubkeyBytes)
    const hash160 = ripemd160(sha256Hash)
    return bytesToHex(hash160)
  } catch {
    return ''
  }
}

/**
 * Converts Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
