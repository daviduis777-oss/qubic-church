import { NextResponse } from 'next/server'
import { makeNonce } from '@/lib/forum/auth'

export const dynamic = 'force-dynamic'
export function GET() {
  const { nonce, token, message } = makeNonce()
  return NextResponse.json({ nonce, token, message })
}
