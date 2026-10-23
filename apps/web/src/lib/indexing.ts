/**
 * Search and AI crawlers are allowed on the production deployment (qubic.church),
 * never on Vercel preview builds. NEXT_PUBLIC_INDEXING=1 forces it on (local checks),
 * NEXT_PUBLIC_INDEXING=0 forces it off.
 */
export const INDEXING =
  process.env.NEXT_PUBLIC_INDEXING === '1' ||
  (process.env.NEXT_PUBLIC_INDEXING !== '0' && process.env.VERCEL_ENV === 'production')

export const SITE_DESCRIPTION =
  'Independent research on Qubic, Aigarth and Come-from-Beyond: two free books by QC, an open research log with primary sources and a public corrections page.'
