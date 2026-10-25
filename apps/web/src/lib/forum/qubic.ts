import 'server-only'
import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper'
import cryptoMod from '@qubic-lib/qubic-ts-library/dist/crypto'

/**
 * Verify a qubic_sign result from the Qubic wallet (WalletConnect).
 * The wallet signs K12(utf8("Qubic Signed Message:\n" + message)) with SchnorrQ
 * and returns the 64-byte signature in base64.
 */
const PREFIX = 'Qubic Signed Message:\n'

type Crypto = { schnorrq: { verify: (pk: Uint8Array, digest: Uint8Array, sig: Uint8Array) => number }; K12: (input: Uint8Array, out: Uint8Array, len: number) => void }
const cryptoPromise = ((cryptoMod as unknown as { default?: Promise<Crypto> }).default ?? (cryptoMod as unknown as Promise<Crypto>)) as Promise<Crypto>

export async function verifyQubicSignature(identity: string, message: string, signatureB64: string): Promise<boolean> {
  try {
    const { schnorrq, K12 } = await cryptoPromise
    const helper = new QubicHelper()
    const pk = helper.getIdentityBytes(identity)
    if (!pk || pk.length !== 32) return false
    const bytes = new TextEncoder().encode(PREFIX + message)
    const digest = new Uint8Array(32)
    K12(bytes, digest, 32)
    const sig = new Uint8Array(Buffer.from(signatureB64, 'base64'))
    if (sig.length !== 64) return false
    return schnorrq.verify(pk, digest, sig) === 1
  } catch {
    return false
  }
}
