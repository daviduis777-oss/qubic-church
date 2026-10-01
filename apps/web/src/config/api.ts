/**
 * API Configuration
 * Endpoints and settings for Qubic blockchain APIs
 */

export const QUBIC_RPC_ENDPOINTS = [
  'https://rpc.qubic.org/v1',
  'https://rpc.qubic.li/v1',
  'https://rpc.qubic.network/v1',
] as const

export const QUBICBAY_API = {
  baseUrl: 'https://api.qubicbay.io',
  endpoints: {
    collection: '/collection/anna-aigarth',
    nft: (id: number) => `/nft/anna-${String(id).padStart(3, '0')}`,
    owner: (address: string) => `/owner/${address}/nfts`,
    stats: '/collection/anna-aigarth/stats',
  },
} as const

export const JETSKI_POOL_API = {
  baseUrl: 'https://api.jetski.qubic.li',
  endpoints: {
    stats: '/stats',
    miners: '/miners',
    solutions: '/solutions',
  },
} as const

export const API_CONFIG = {
  cacheTime: {
    epoch: 5000, // 5s
    network: 10000, // 10s
    emission: 30000, // 30s
    community: 30000, // 30s
    nftOwner: 60000, // 1min
    oracle: 15000, // 15s, oracle data refreshes frequently
  },
  rateLimit: {
    maxRequests: 10,
    perMilliseconds: 1000,
  },
  timeout: 10000, // 10s
} as const
