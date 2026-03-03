/**
 * Community Giveaway Configuration
 * Total Prize Pool: 676M QUBIC (3 Winners)
 */

export const GIVEAWAY_CONFIG = {
  drawDate: new Date('2027-04-13T00:00:00Z'), // Draw date — The Convergence
  totalTickets: 200, // 1 NFT = 1 entry
  prizePool: {
    qubic: 676_000_000n, // 676M QUBIC
  },
  description:
    'Hold 1 Anna NFT to enter. Win up to 350M QUBIC!',
} as const

export interface Prize {
  place: number
  qubic: bigint
  percentage: number
}

export const PRIZE_STRUCTURE: Prize[] = [
  {
    place: 1,
    qubic: 350_000_000n, // 350M QUBIC
    percentage: 51.8,
  },
  {
    place: 2,
    qubic: 200_000_000n, // 200M QUBIC
    percentage: 29.6,
  },
  {
    place: 3,
    qubic: 126_000_000n, // 126M QUBIC
    percentage: 18.6,
  },
] as const

// Legacy export for backwards compatibility
export const LOTTERY_CONFIG = GIVEAWAY_CONFIG

export type GiveawayStatus = 'pending' | 'entered' | 'winner'

export interface GiveawayEntry {
  nftId: number // 1-200
  qubicAddress: string // User's wallet
  entryDate: Date // When user entered
  status: GiveawayStatus
  place?: number // 1-3 if winner
  prizeQubic?: bigint
}
