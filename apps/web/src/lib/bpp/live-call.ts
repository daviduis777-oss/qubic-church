import 'server-only'
import type { LiveCall } from './record'

/**
 * The network's live call for the hour starting at `hour` (unix seconds): the one input the record needs.
 *
 * Until epoch 240 there is none. The scorer in qubic/core (score_bpp9000.h, main of 4 Nov 2026) still runs
 * the network as a sequence generator over last year's candles: it reads no live input, so it makes no call
 * about a real, still-open hour. The live feed (the price oracle feeding the past hour in, the network
 * calling the next) is set for epoch 240, 18 November 2026, and is not in the core's code yet.
 *
 * When that code is published this function reads the call the way the core makes it, from the network or
 * from where computors publish it, and the record starts on its own. Until then it answers null, so the
 * record stays empty rather than recording a call the network did not make.
 */
export async function liveCall(_hour: number): Promise<LiveCall | null> {
  return null
}
