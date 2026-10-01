import type { NextRequest } from 'next/server'
import proxyImpl from '@/lib/opendocs/proxy'

export default function proxy(request: NextRequest) {
  return proxyImpl(request)
}

export const config = {
  matcher: [
    '/((?!api/|_next/|_proxy/|_vercel|_static|favicon.ico|sitemap.xml|blog.xml|blog.json|robots.txt|.*\\..*).*)',
    '/([\\w-]+)?/(docs|blog)/(.+)',
  ],
}
