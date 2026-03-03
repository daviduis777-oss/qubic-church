import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const RESULTS_DIR = path.join(process.cwd(), 'scripts', 'aigarth', 'ane', 'results')

export const dynamic = 'force-dynamic'

// SSE stream that tails a JSONL file
export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file') || 'live_run.jsonl'
  const safeName = path.basename(file)
  const filePath = path.join(RESULTS_DIR, safeName)

  const encoder = new TextEncoder()
  let lastSize = 0
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        lastSize = content.length
        const lines = content.trim().split('\n').filter(l => l.length > 0)
        // Send last 20 lines as initial burst
        const initial = lines.slice(-20)
        for (const line of initial) {
          try {
            const data = JSON.parse(line)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          } catch { /* skip malformed lines */ }
        }
      } catch {
        // File doesn't exist yet, will start polling
      }

      // Poll for new data every 500ms
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval)
          return
        }

        try {
          const stat = await fs.stat(filePath)
          if (stat.size > lastSize) {
            const fd = await fs.open(filePath, 'r')
            const newContent = Buffer.alloc(stat.size - lastSize)
            await fd.read(newContent, 0, stat.size - lastSize, lastSize)
            await fd.close()
            lastSize = stat.size

            const lines = newContent.toString('utf-8').trim().split('\n')
            for (const line of lines) {
              if (line.length === 0) continue
              try {
                const data = JSON.parse(line)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
              } catch { /* skip malformed */ }
            }
          }
        } catch {
          // File may not exist yet or was deleted
        }
      }, 500)

      // Clean up on abort
      request.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
