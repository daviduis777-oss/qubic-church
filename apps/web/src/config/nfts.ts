/**
 * NFT Collection Configuration
 * Anna Aigarth NFT collection (200 total)
 */

export type NFTRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface NFTPosition {
  x: number // 0-1 (viewport percentage)
  y: number // 0-1 (viewport percentage)
  z?: number // depth (optional for 3D)
}

export interface ResearchConnection {
  title: string
  slug: string // Archive page path
  teaser: string
}

export interface NFTAttributes {
  background?: string
  pose?: string
  accessory?: string
}

export interface NFT {
  id: number // 1-200
  name: string // "Anna #001"
  title: string // "The First Light"
  description: string // Lore text
  image: string // "/images/nfts/anna-001.png"
  owner: string | null // Qubic address or null
  qubicBayLink: string // QubicBay marketplace link
  rarity: NFTRarity

  // Star Map Position
  position: NFTPosition

  // Research Connection
  researchConnection?: ResearchConnection

  // Metadata
  attributes?: NFTAttributes
}

/**
 * Generate NFT collection data
 * In production, this would come from a database or API
 * For now, we'll generate placeholder data
 */
function generateNFTCollection(): NFT[] {
  const nfts: NFT[] = []

  for (let i = 1; i <= 200; i++) {
    // Distribute stars across viewport
    // Using golden ratio spiral for aesthetic distribution
    const angle = i * 137.5 * (Math.PI / 180) // Golden angle
    const radius = Math.sqrt(i) / Math.sqrt(200) // Normalize to 0-1
    const x = 0.5 + radius * Math.cos(angle) * 0.45 // Keep within bounds
    const y = 0.5 + radius * Math.sin(angle) * 0.45

    // Determine rarity based on NFT ID
    let rarity: NFTRarity
    if (i <= 10) rarity = 'legendary'
    else if (i <= 50) rarity = 'epic'
    else if (i <= 120) rarity = 'rare'
    else rarity = 'common'

    // Create research connection for select NFTs
    const researchConnection = getResearchConnection(i)

    nfts.push({
      id: i,
      name: `Anna #${String(i).padStart(3, '0')}`,
      title: getNFTTitle(i),
      description: getNFTDescription(i),
      image: `/images/nfts/anna-${String(i).padStart(3, '0')}.webp`,
      owner: null, // To be populated from QubicBay API
      qubicBayLink: `https://qubicbay.io/collections/7#anna-${String(i).padStart(3, '0')}`,
      rarity,
      position: { x, y, z: Math.random() * 0.3 }, // Add depth for 3D effect
      researchConnection,
    })
  }

  return nfts
}

/**
 * Get NFT title based on ID and role
 */
function getNFTTitle(id: number): string {
  if (id === 1) return 'The First Light'
  if (id === 42) return 'The Genesis Seeker'
  if (id === 89) return 'The Bridge Builder'
  if (id === 156) return 'The Visionary'
  if (id === 200) return 'The Final Awakening'

  // Generate title based on role
  if (id <= 50) return `The Researcher #${id}`
  if (id <= 100) return `The Detective #${id}`
  if (id <= 150) return `The Mathematician #${id}`
  return `The Visionary #${id}`
}

/**
 * Get NFT description based on ID
 */
function getNFTDescription(id: number): string {
  const templates = [
    'A guardian of hidden knowledge, preparing humanity for the convergence.',
    'One of 200 unique Anna variants, each holding a piece of the puzzle.',
    'A marker of the community research into the Anna Matrix.',
    'Bearer of ancient wisdom, encoded in the blockchain forever.',
    'A digital sentinel watching over the path to enlightenment.',
  ]

  const index = id % templates.length
  return templates[index] ?? templates[0] ?? 'A unique Anna NFT'
}

/**
 * Get research connection for specific NFTs
 * Links high-value NFTs to important research findings
 */
function getResearchConnection(id: number): ResearchConnection | undefined {
  const connections: Record<number, ResearchConnection> = {
    1: {
      title: 'Matrix Symmetry',
      slug: '/docs/03-results/01-matrix-symmetry',
      teaser: 'The exact complement rule in the Anna Matrix',
    },
    42: {
      title: 'Genesis Block Numerical Analysis',
      slug: '/docs/03-results/05-genesis-block-analysis',
      teaser: 'What the numbers in the first block do and do not show',
    },
    200: {
      title: 'Corrections, September 2026',
      slug: '/docs/03-results/35-corrections-september-2026',
      teaser: 'Which earlier claims were withdrawn, and why',
    },
  }

  return connections[id]
}

/**
 * NFT Collection Export
 */
export const NFT_COLLECTION: NFT[] = generateNFTCollection()

/**
 * Get NFT by ID
 */
export function getNFTById(id: number): NFT | undefined {
  return NFT_COLLECTION.find((nft) => nft.id === id)
}

/**
 * Get NFTs by rarity
 */
export function getNFTsByRarity(rarity: NFTRarity): NFT[] {
  return NFT_COLLECTION.filter((nft) => nft.rarity === rarity)
}

/**
 * Get NFTs with research connections
 */
export function getNFTsWithResearchConnections(): NFT[] {
  return NFT_COLLECTION.filter((nft) => nft.researchConnection !== undefined)
}
