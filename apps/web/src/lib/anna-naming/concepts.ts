/**
 * Concept naming: deterministic mapping from numerical concept IDs to
 * Pair-A+/A-...H+/H- + S1/S2/S3 labels. Single source of truth.
 *
 * Pairing rule: a concept's antipode (from concepts.json `is_antipode_of`)
 * partners with it; the lower-ID concept gets the `+` polarity, the higher
 * gets `-`. Singletons (no antipode) get S1/S2/S3 in concept_id order.
 *
 * Pair letters are assigned in cluster_size descending order across pair
 * groups (largest pair = A, next = B, ...). This matches the natural
 * ordering already used in concepts.json (sorted by cluster_size desc).
 */

export interface RawConcept {
  concept_id: number
  cluster_size: number
  is_antipode_of: number | null
}

export interface ConceptName {
  conceptId: number
  pairLabel: string
  polarity: '+' | '-' | null
  display: string
  fullDisplay: string
  isAntipodal: boolean
  partnerLabel: string | null
  partnerConceptId: number | null
}

const PAIR_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

export function buildConceptNamingMap(
  concepts: ReadonlyArray<RawConcept>,
): Map<number, ConceptName> {
  const map = new Map<number, ConceptName>()

  const seenAsPair = new Set<number>()
  const pairs: Array<[RawConcept, RawConcept]> = []
  for (const c of concepts) {
    if (seenAsPair.has(c.concept_id)) continue
    if (c.is_antipode_of === null) continue
    const partner = concepts.find((p) => p.concept_id === c.is_antipode_of)
    if (!partner) continue
    if (partner.is_antipode_of !== c.concept_id) continue
    const lo = c.concept_id < partner.concept_id ? c : partner
    const hi = lo === c ? partner : c
    pairs.push([lo, hi])
    seenAsPair.add(lo.concept_id)
    seenAsPair.add(hi.concept_id)
  }

  pairs.sort(
    (p, q) =>
      q[0].cluster_size + q[1].cluster_size - (p[0].cluster_size + p[1].cluster_size),
  )

  pairs.forEach(([lo, hi], idx) => {
    const letter = PAIR_LETTERS[idx]
    if (!letter) {
      throw new Error(
        `Too many antipodal pairs (${pairs.length}); naming scheme supports up to ${PAIR_LETTERS.length}.`,
      )
    }
    map.set(lo.concept_id, {
      conceptId: lo.concept_id,
      pairLabel: letter,
      polarity: '+',
      display: `Pair ${letter}+`,
      fullDisplay: `Pair ${letter}+ · #${lo.concept_id} · cluster ${lo.cluster_size}`,
      isAntipodal: true,
      partnerLabel: `${letter}-`,
      partnerConceptId: hi.concept_id,
    })
    map.set(hi.concept_id, {
      conceptId: hi.concept_id,
      pairLabel: letter,
      polarity: '-',
      display: `Pair ${letter}-`,
      fullDisplay: `Pair ${letter}- · #${hi.concept_id} · cluster ${hi.cluster_size}`,
      isAntipodal: true,
      partnerLabel: `${letter}+`,
      partnerConceptId: lo.concept_id,
    })
  })

  const singletons = concepts.filter((c) => !seenAsPair.has(c.concept_id))
  singletons.sort((a, b) => a.concept_id - b.concept_id)
  singletons.forEach((s, idx) => {
    const label = `S${idx + 1}`
    map.set(s.concept_id, {
      conceptId: s.concept_id,
      pairLabel: label,
      polarity: null,
      display: label,
      fullDisplay: `${label} · #${s.concept_id} · cluster ${s.cluster_size}`,
      isAntipodal: false,
      partnerLabel: null,
      partnerConceptId: null,
    })
  })

  return map
}
