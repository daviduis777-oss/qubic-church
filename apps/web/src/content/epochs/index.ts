/**
 * The weekly epoch digests: what happened in Aigarth and Qubic during one epoch (Wednesday 12:00 UTC to the next).
 * Curated by hand, one entry per epoch, newest first. Quotes are verbatim, with the date they were said and where.
 * The live numbers (brains grown, the best brain, stalls) are added on the page from the site's own records.
 */
export type DigestItem = { date: string; text: string; url?: string; source?: string }
export type Quote = { date: string; who: string; text: string; where: string; url?: string }

export type Digest = {
  epoch: number
  /** one sentence: the week in a line */
  line: string
  changes: DigestItem[]
  science: DigestItem[]
  quotes: Quote[]
  next: DigestItem[]
}

export const DIGESTS: Digest[] = [
  {
    epoch: 238,
    line: 'The brains keep fitting the past year, still at a coin on the hours they never saw, ten days before the network gets a live bitcoin price.',
    changes: [
      {
        date: '2026-11-08',
        text: 'Brain Watch opened on this site: the best brain of the epoch re-run with the core’s own rule, reproduced to the exact error. On the day: homework 65.5% on the year it was grown on, exam 48.2% on the hours after it.',
        url: '/bpp9000/brains',
      },
      {
        date: '2026-11-09',
        text: 'Anyone can now run a brain at home: download it, run a 120-line script, get the same exam as the site.',
        url: '/bpp9000/brains#run',
      },
      {
        date: '2026-11-09',
        text: 'The tick sat at 91,110,060 for several hours overnight (seen at 22:59 UTC on 8 November, moving again by 08:04 UTC on 9 November).',
        url: '/status',
      },
    ],
    science: [],
    quotes: [],
    next: [
      { date: '2026-11-11', text: 'Epoch 239 starts at 12:00 UTC.' },
      {
        date: '2026-11-18',
        text: 'Epoch 240: the BPP-9000 task moves from last year’s bitcoin to a live price, read hourly by the computors’ oracle machines. From the epoch after, miners are to qualify by how well their networks predict.',
        url: '/bpp9000',
      },
    ],
  },
  {
    epoch: 237,
    line: 'The science side closed its ARC-AGI-3 run and published every brain it grew.',
    changes: [],
    science: [
      {
        date: '2026-11-02',
        text: 'ARC-AGI-3 on Kaggle: the Qubic Neuraxon team (Vivancos and Sánchez) finished with a personal best of 0.41 on the 0 to 100 scale, from 0.38, on the last day. The final rank waits for the private leaderboard.',
      },
      {
        date: '2026-11-03',
        text: 'Nxon2ArcAGI3Brains: 155,192 evolved MultiNeuraxon 2.0 brains for the 25 public ARC-AGI-3 games, about 100 GB, CC BY-SA 4.0, bred on CPUs without LLMs or GPUs.',
        url: 'https://huggingface.co/datasets/DavidVivancos/Nxon2ArcAGI3Brains',
        source: 'Hugging Face',
      },
    ],
    quotes: [
      {
        date: '2026-11-03',
        who: 'José Sánchez and David Vivancos',
        text: 'As promised we just released @_Qubic_ #OpenScience #Neuraxon For @arcprize #ARCAGI3 dataset of MultiNeuraxon 2.0 evolved brains, 155,192🧠 604,045 Files 100Gb Months evolving and improving over 114+ NAS runs for the 25 Public ArcAGI3 games. #NoLLMs #NoGPU just bio-inspired evolved brains …',
        where: 'X',
      },
    ],
    next: [],
  },
]

export const digestOf = (epoch: number) => DIGESTS.find(d => d.epoch === epoch) ?? null

/** Epoch N runs from Wednesday 12:00 UTC to the next; epoch 238 began on 4 November 2026. */
export function epochWindow(epoch: number) {
  const start = Date.UTC(2026, 10, 4, 12) + (epoch - 238) * 7 * 86_400_000
  return { start, end: start + 7 * 86_400_000 }
}
