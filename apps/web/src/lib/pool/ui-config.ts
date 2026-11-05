/**
 * UI-only settings for the pool page and Maria: thresholds, links and placeholders that shape what the
 * screens show. Pool facts from the partner stay in config.ts. No secrets: this ships to the browser.
 *
 * Lines marked TODO(Bob) are placeholders until the partner confirms them. A null value is shown as
 * "details coming soon"; never fill one with a guess.
 */

export const PAYOUT_TERMS = {
  /** TODO(Bob): how rewards are split between miners (for example PPS, PPS+ or PPLNS), as the partner states it. */
  method: null as string | null,
  /** TODO(Bob): the minimum payout, with its unit (for example "100,000 QUBIC"), as the partner states it. */
  minimum: null as string | null,
  /** What the page shows while a value above is null. */
  pending: 'Details coming soon.',
}

export const STATS = {
  /**
   * Miner statistics ("Who mines with what", "What it delivers") appear only from this many saved rigs
   * that are not our own test runs. Below it the page says so and lists our test runs as test runs.
   */
  minRealRigs: 10,
}

/**
 * Where a share card points. While the pool page is a private preview (POOL_PUBLIC off), /pool is a 404
 * for everyone else, so cards point to the public field guide instead. shareLink() in share.ts picks one.
 */
export const SHARE = {
  publicUrl: 'https://qubic.church/pool',
  previewUrl: 'https://qubic.church/mine-qubic',
  /** X web intent: opens a prefilled post in a new tab. */
  xIntent: 'https://x.com/intent/post',
}

/** The expanded "wide" view of the app is offered from this viewport width. */
export const WIDE_MIN_PX = 1280

/** Halo frame rate: idle is throttled to save battery; thinking and the verdict run at full rate. */
export const HALO_FPS = { idle: 24, active: 60 }

/** Where a renter reads the full checklist on the public site. */
export const RENTAL_GUIDE = { href: '/mine-qubic#where', label: 'Rental checklist' }
