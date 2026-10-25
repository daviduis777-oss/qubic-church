import { NextResponse } from 'next/server'
import { getSession } from '@/lib/forum/auth'
export const dynamic = 'force-dynamic'
export async function GET() {
  return NextResponse.json({ user: await getSession(), ready: Boolean(process.env.GITHUB_TOKEN && process.env.FORUM_SECRET) })
}
