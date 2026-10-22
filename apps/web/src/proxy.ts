import type { NextRequest } from 'next/server'
import proxyImpl from '@/lib/opendocs/proxy'

const SITE = (process.env.NEXT_PUBLIC_APP_URL || 'https://qubic.church').replace(/\/$/, '')

export default async function proxy(request: NextRequest) {
  const res = await proxyImpl(request)
  // One canonical URL per page, sent as an HTTP header for every route:
  // locale prefixes (/en, /pt) point at the unprefixed English page.
  if (res.status < 300) {
    const path = request.nextUrl.pathname.replace(/^\/(en|pt)(?=\/|$)/, '') || '/'
    res.headers.set('Link', `<${SITE}${path}>; rel="canonical"`)
  }
  return res
}

export const config = {
  matcher: [
    '/((?!api/|_next/|_proxy/|_vercel|_static|favicon.ico|sitemap.xml|blog.xml|blog.json|robots.txt|.*\\..*).*)',
    '/([\\w-]+)?/(docs|blog)/(.+)',
  ],
}
