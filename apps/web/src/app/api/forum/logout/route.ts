import { NextResponse } from 'next/server'
import { clearedCookie } from '@/lib/forum/auth'
export const dynamic = 'force-dynamic'
export function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(clearedCookie)
  return res
}
