/**
 * Search and AI crawlers are allowed on the production deployment (qubic.church),
 * never on Vercel preview builds. NEXT_PUBLIC_INDEXING=1 forces it on (local checks),
 * NEXT_PUBLIC_INDEXING=0 forces it off.
 */
export const INDEXING =
  process.env.NEXT_PUBLIC_INDEXING === '1' ||
  (process.env.NEXT_PUBLIC_INDEXING !== '0' && process.env.VERCEL_ENV === 'production')

export const SITE_DESCRIPTION =
  'Qubic Church is an independent research publication on Qubic, Aigarth and Come-from-Beyond (Sergey Ivancheglo): two free books by QC, a research log with recomputed results and dated primary sources, and a public corrections page.'
