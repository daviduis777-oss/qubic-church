// =============================================================================
// BITCOIN ADDRESS UTILITIES
// Convert public keys to Bitcoin addresses
// =============================================================================

// Base58 alphabet (Bitcoin uses this for addresses)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * SHA256 hash using Web Crypto API
 */
async function sha256(data: Uint8Array): Promise<Uint8Array> {
  // Create a new ArrayBuffer copy to avoid SharedArrayBuffer type issues
  const buffer = new ArrayBuffer(data.length)
  new Uint8Array(buffer).set(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return new Uint8Array(hashBuffer)
}

/**
 * RIPEMD160 implementation (needed for Bitcoin address derivation)
 * This is a simplified implementation for browser use
 */
function ripemd160(message: Uint8Array): Uint8Array {
  // RIPEMD-160 constants
  const K1 = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]
  const K2 = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]

  const R1 = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
    3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
    1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
    4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
  ]

  const R2 = [
    5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
    6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
    15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
    8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
    12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
  ]

  const S1 = [
    11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
    7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
    11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
    11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
    9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
  ]

  const S2 = [
    8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
    9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
    9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
    15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
    8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
  ]

  function f(j: number, x: number, y: number, z: number): number {
    if (j < 16) return x ^ y ^ z
    if (j < 32) return (x & y) | (~x & z)
    if (j < 48) return (x | ~y) ^ z
    if (j < 64) return (x & z) | (y & ~z)
    return x ^ (y | ~z)
  }

  function rotl(x: number, n: number): number {
    return ((x << n) | (x >>> (32 - n))) >>> 0
  }

  // Padding
  const msgLen = message.length
  const bitLen = msgLen * 8
  const padLen = msgLen % 64 < 56 ? 56 - (msgLen % 64) : 120 - (msgLen % 64)
  const padded = new Uint8Array(msgLen + padLen + 8)
  padded.set(message)
  padded[msgLen] = 0x80

  // Length in bits (little-endian)
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, bitLen >>> 0, true)
  view.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true)

  // Initial hash values
  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0

  // Process blocks
  for (let i = 0; i < padded.length; i += 64) {
    const block = new DataView(padded.buffer, i, 64)
    const X: number[] = []
    for (let j = 0; j < 16; j++) {
      X[j] = block.getUint32(j * 4, true)
    }

    let al = h0, bl = h1, cl = h2, dl = h3, el = h4
    let ar = h0, br = h1, cr = h2, dr = h3, er = h4

    for (let j = 0; j < 80; j++) {
      const jDiv16 = Math.floor(j / 16)
      // biome-ignore lint: array indices are guaranteed to be in bounds for j < 80
      let tl = (al + f(j, bl, cl, dl) + (X[R1[j]!] ?? 0) + (K1[jDiv16] ?? 0)) >>> 0
      tl = (rotl(tl, S1[j] ?? 0) + el) >>> 0
      al = el; el = dl; dl = rotl(cl, 10); cl = bl; bl = tl

      // biome-ignore lint: array indices are guaranteed to be in bounds for j < 80
      let tr = (ar + f(79 - j, br, cr, dr) + (X[R2[j]!] ?? 0) + (K2[jDiv16] ?? 0)) >>> 0
      tr = (rotl(tr, S2[j] ?? 0) + er) >>> 0
      ar = er; er = dr; dr = rotl(cr, 10); cr = br; br = tr
    }

    const t = (h1 + cl + dr) >>> 0
    h1 = (h2 + dl + er) >>> 0
    h2 = (h3 + el + ar) >>> 0
    h3 = (h4 + al + br) >>> 0
    h4 = (h0 + bl + cr) >>> 0
    h0 = t
  }

  const result = new Uint8Array(20)
  const resultView = new DataView(result.buffer)
  resultView.setUint32(0, h0, true)
  resultView.setUint32(4, h1, true)
  resultView.setUint32(8, h2, true)
  resultView.setUint32(12, h3, true)
  resultView.setUint32(16, h4, true)

  return result
}

/**
 * Base58 encode with leading zero preservation
 */
function base58Encode(bytes: Uint8Array): string {
  // Count leading zeros
  let leadingZeros = 0
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    leadingZeros++
  }

  // Convert to big integer
  let num = BigInt('0x' + bytesToHex(bytes))
  let result = ''

  while (num > 0) {
    const remainder = num % 58n
    num = num / 58n
    result = BASE58_ALPHABET[Number(remainder)] + result
  }

  // Add leading '1's for each leading zero byte
  return '1'.repeat(leadingZeros) + result
}

/**
 * Compute Hash160 (SHA256 + RIPEMD160) of a public key
 */
export async function hash160(pubkeyHex: string): Promise<string> {
  const pubkeyBytes = hexToBytes(pubkeyHex)
  const sha256Hash = await sha256(pubkeyBytes)
  const ripemd160Hash = ripemd160(sha256Hash)
  return bytesToHex(ripemd160Hash)
}

/**
 * Convert a public key (hex) to a Bitcoin address
 * @param pubkeyHex - The public key in hex format (uncompressed 04... or compressed 02.../03...)
 * @param version - Version byte (0x00 for mainnet P2PKH)
 * @returns Bitcoin address in Base58Check format
 */
export async function pubkeyToAddress(pubkeyHex: string, version: number = 0x00): Promise<string> {
  // Step 1: SHA256 of public key
  const pubkeyBytes = hexToBytes(pubkeyHex)
  const sha256Hash = await sha256(pubkeyBytes)

  // Step 2: RIPEMD160 of SHA256 result
  const hash160Result = ripemd160(sha256Hash)

  // Step 3: Add version byte
  const versionedPayload = new Uint8Array(21)
  versionedPayload[0] = version
  versionedPayload.set(hash160Result, 1)

  // Step 4: Double SHA256 for checksum
  const firstHash = await sha256(versionedPayload)
  const secondHash = await sha256(firstHash)
  const checksum = secondHash.slice(0, 4)

  // Step 5: Append checksum
  const addressBytes = new Uint8Array(25)
  addressBytes.set(versionedPayload)
  addressBytes.set(checksum, 21)

  // Step 6: Base58 encode
  return base58Encode(addressBytes)
}

/**
 * Compress an uncompressed public key (04...) to compressed format (02.../03...)
 */
export function compressPubkey(uncompressedHex: string): string {
  if (!uncompressedHex.startsWith('04') || uncompressedHex.length !== 130) {
    // Already compressed or invalid
    return uncompressedHex
  }

  const x = uncompressedHex.slice(2, 66)
  const y = uncompressedHex.slice(66, 130)

  // If Y is even, prefix is 02, if odd, prefix is 03
  const yLastByte = parseInt(y.slice(-2), 16)
  const prefix = yLastByte % 2 === 0 ? '02' : '03'

  return prefix + x
}

/**
 * Get both compressed and uncompressed addresses from a public key
 */
export async function getAllAddresses(pubkeyHex: string): Promise<{
  uncompressed: string
  compressed: string
  hash160Uncompressed: string
  hash160Compressed: string
}> {
  const compressedPubkey = compressPubkey(pubkeyHex)

  const [uncompressedAddr, compressedAddr, hash160Uncompressed, hash160Compressed] = await Promise.all([
    pubkeyToAddress(pubkeyHex),
    pubkeyToAddress(compressedPubkey),
    hash160(pubkeyHex),
    hash160(compressedPubkey),
  ])

  return {
    uncompressed: uncompressedAddr,
    compressed: compressedAddr,
    hash160Uncompressed,
    hash160Compressed,
  }
}

/**
 * Synchronous version using pre-computed values (for display without async)
 * This is a fallback that truncates the pubkey for display
 */
export function pubkeyToAddressSync(pubkeyHex: string): string {
  // For synchronous display, we'll return a placeholder
  // The real address should be computed async and cached
  return `[Computing from ${pubkeyHex.slice(0, 10)}...]`
}
