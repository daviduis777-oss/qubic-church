import { getSession } from '@/lib/forum/auth'
import { accessOf } from '@/lib/w4w/access'
import { GAME_HTML } from '@/lib/w4w/game-html'

export const dynamic = 'force-dynamic'

/** The game itself, only for people let into Aigarth. Everyone else goes back to the W4W page. */
export async function GET(req: Request) {
  const acc = await accessOf(await getSession())
  if (!acc.player) return Response.redirect(new URL('/w4w', req.url), 302)
  return new Response(GAME_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
