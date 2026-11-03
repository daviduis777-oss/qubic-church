/**
 * Short answers: one page per question people ask search engines and AI assistants about Qubic.
 * The first paragraph answers the question on its own; the rest gives the facts, the context and the sources.
 * Facts come from the books by QC (each section links its chapter) and from primary sources.
 * Paragraphs may hold [text](url) links.
 */
import { SITE_URL } from '@/lib/books'

export type AnswerLang = 'en'
export type Answer = {
  slug: string
  lang: AnswerLang
  question: string
  title: string // <title>
  description: string // meta description
  answer: string[] // the direct answer: the first paragraph must stand alone
  facts: [string, string][]
  sections: { h: string; p: string[] }[]
  read: { label: string; href: string }[] // chapters and pages on qubic.church
  faq: [string, string][]
  sources: { label: string; href: string }[]
  updated: string
  entity: Record<string, unknown> // what the page is about, for JSON-LD
}

const LV = '/books/qubic-the-long-version'
const CB = '/books/come-from-beyond'
const UPDATED = '2026-11-03'

const QUBIC_ENTITY = { '@type': 'Thing', name: 'Qubic', url: 'https://qubic.org', sameAs: ['https://qubic.org', 'https://x.com/_Qubic_'] }
const CFB_ENTITY = {
  '@type': 'Person', name: 'Sergey Ivancheglo', alternateName: ['Come-from-Beyond', 'CfB', 'BCNext'],
  sameAs: ['https://x.com/c___f___b', 'https://iq.wiki/wiki/sergey-ivancheglo'], knowsAbout: ['Qubic', 'Aigarth', 'NXT', 'IOTA', 'Distributed computing'],
}
const ANNA_ENTITY = { '@type': 'Thing', name: 'Anna Aigarth', alternateName: ['Aigarth ANNA', 'Anna Matrix'], sameAs: ['https://x.com/anna_aigarth'] }

export const ANSWERS: Answer[] = [
  {
    slug: 'what-is-qubic', lang: 'en', updated: UPDATED, entity: QUBIC_ENTITY,
    question: 'What is Qubic?',
    title: 'What is Qubic? A short, sourced answer',
    description: 'Qubic is a decentralised network launched on 13 April 2022 by Come-from-Beyond. 676 computors, weekly epochs, Useful Proof of Work that trains the Aigarth AI, feeless QU transfers.',
    answer: [
      'Qubic is a decentralised network launched on 13 April 2022 by Come-from-Beyond (Sergey Ivancheglo), the creator of NXT and a co-founder of IOTA. It is run by 676 computors and secured by Useful Proof of Work: the computation miners do to keep the network is also used to train Aigarth, Qubic\'s research project toward a new kind of artificial intelligence.',
      'Its currency is QU. Transfers between people carry no fee. The network lives in weekly epochs that change every Wednesday around 12:00 UTC.',
    ],
    facts: [
      ['First block', '13 April 2022'],
      ['Founder', 'Come-from-Beyond (Sergey Ivancheglo)'],
      ['Who runs it', '676 computors; a decision needs 451 votes'],
      ['Rhythm', 'weekly epochs, Wednesday about 12:00 UTC'],
      ['Mining', 'Useful Proof of Work (UPoW)'],
      ['Currency', 'QU: one trillion issued each epoch, burned through several paths'],
      ['Transfers', 'feeless'],
      ['AI', 'Aigarth; estimated date to run as smart contracts: 13 April 2027'],
    ],
    sections: [
      { h: '676 computors and weekly epochs', p: [
        'The network is held by 676 computors, machines that each have one vote on the next state of the whole system. A decision passes with 451 votes, just over two thirds. No seat carries more weight than another, and a vote cannot be bought or pooled.',
        'Every week, at the epoch change on Wednesday around 12:00 UTC, up to 225 seats can change hands: the computors that did the least useful work give way to those that did more. See [676 Voices](' + LV + '/06-676-voices) and [Weeks of Epochs](' + LV + '/07-weeks-of-epochs).',
      ] },
      { h: 'Useful Proof of Work', p: [
        'In Bitcoin, mining burns energy on a puzzle whose only output is security. In Qubic the same work has a second use. Miners run Aigarth\'s tasks, evolving and training structures meant to lead to a new kind of AI, and the network also points its hashing power at outsourced mining on other networks, which in 2025 meant Monero and later Dogecoin. See [Murdoch\'s Gas in Action: UPoW](' + LV + '/08-murdochs-gas-in-action-upow).',
      ] },
      { h: 'QU, the breathing token', p: [
        'Each epoch the network issues exactly one trillion QU, and over the week it burns QU through several separate paths. Supply rises and falls with the weekly rhythm; in 2025 and 2026 the burn often exceeded the issue. This page describes the mechanism only and gives no financial advice. See [The Breathing Token](' + LV + '/09-the-breathing-token).',
      ] },
      { h: 'Aigarth and 13 April 2027', p: [
        'Aigarth is Qubic\'s research project on a new paradigm for creating artificial intelligence. Come-from-Beyond wrote on 14 May 2024: "Aigarth\'s main goal is to discover a new paradigm allowing to create true AI, I have just seen the wireframe of this paradigm. And I have realized that Artificial Intelligence will not be created, it will emerge. With help of Qubic miners."',
        'The estimated date for Aigarth to run as smart contracts on Qubic is 13 April 2027, five years after launch. He calls it an estimate. The same date is set for switching off the Arbitrator, the one address with special standing in the network, a role he holds himself. See [What Aigarth Is](' + LV + '/11-what-aigarth-is), [What the Deploy on April 13, 2027 Means](' + LV + '/14-what-the-deploy-on-april-13-2027-means) and [The Arbitrator](' + LV + '/10-the-arbitrator-a-temporary-monarch).',
      ] },
    ],
    read: [
      { label: 'Qubic: The Long Version (free book, 18 chapters)', href: LV },
      { label: 'Who is Come-from-Beyond?', href: '/who-is-come-from-beyond' },
      { label: 'What is Anna Aigarth?', href: '/what-is-anna-aigarth' },
    ],
    faq: [
      ['Who created Qubic?', 'Come-from-Beyond, the online name of Sergey Ivancheglo, who earlier created NXT and co-founded IOTA.'],
      ['When did Qubic launch?', 'Qubic\'s first block was created on 13 April 2022.'],
      ['What is a computor?', 'One of the 676 machines that run the network and vote on its next state. Seats are earned by useful work and can change every weekly epoch.'],
      ['What is Useful Proof of Work?', 'Mining whose computation does something besides securing the network: in Qubic it trains Aigarth and powers outsourced mining on other networks.'],
      ['Does Qubic charge transaction fees?', 'Transfers are feeless. Come-from-Beyond listed this on 23 September 2021 as one of three properties of the future network: "Feeless transfers like in #IOTA".'],
      ['What happens on 13 April 2027?', 'It is the estimated date for Aigarth to run as smart contracts on Qubic and for the Arbitrator to be switched off. It is an estimate, not a guarantee.'],
      ['What happened with Monero in 2025?', 'On 11 August 2025 a pool under the Qubic banner mined 63 of 122 consecutive Monero blocks, 51.6%. No history was rewritten and no user losses were recorded. See chapter 15, The War That No One Waged.'],
      ['Where can I read more?', 'The book Qubic: The Long Version by QC is free to read at qubic.church/books.'],
    ],
    sources: [
      { label: 'Qubic, official site', href: 'https://qubic.org' },
      { label: 'Come-from-Beyond on X', href: 'https://x.com/c___f___b' },
      { label: 'Exploring Aigarth Intelligent Tissue 1.0 (qubic.org)', href: 'https://qubic.org/blog-detail/exploring-aigarth-intelligent-tissue-1-0' },
      { label: 'Qubic: The Long Version, by QC', href: LV },
    ],
  },
  {
    slug: 'who-is-come-from-beyond', lang: 'en', updated: UPDATED, entity: CFB_ENTITY,
    question: 'Who is Come-from-Beyond?',
    title: 'Who is Come-from-Beyond (CfB)? A short, sourced answer',
    description: 'Come-from-Beyond (CfB) is Sergey Ivancheglo, founder of Qubic, creator of NXT and co-founder of IOTA. One line of work since 2002: computation gathered from many machines, with no centre and no owner.',
    answer: [
      'Come-from-Beyond (CfB) is the online name of Sergey Ivancheglo, the founder of Qubic. He created NXT, the first full proof-of-stake blockchain, co-founded IOTA, and launched Qubic in 2022, where he leads Aigarth, its research project on artificial intelligence.',
      'His work follows one line since 2002: computing power gathered from many machines, with no centre and no owner, put to useful work.',
    ],
    facts: [
      ['Name', 'Sergey Ivancheglo'],
      ['Known as', 'Come-from-Beyond, CfB; BCNext for NXT'],
      ['First public trace', '"Distributed Computing at Minimal Cost", Computer Newspaper, Minsk, July 2002, signed with come-frombeyond@mail.ru'],
      ['Projects', 'NXT (2014), IOTA (2015), Qubic (2022), Aigarth'],
      ['On X', '@c___f___b'],
    ],
    sections: [
      { h: 'One line through 25 years', p: [
        'In July 2002 a Minsk computer newspaper printed his article on distributed computing at minimal cost: a small program that puts visitors\' computers to work on a shared task, a supercomputer with no centre and no owner. The idea runs through everything he built after.',
        'NXT (2014) removed the energy race of Proof-of-Work and secured a network by stake. IOTA (2015) removed the chain of blocks. Qubic (2022) keeps the work and makes it useful, so mining also trains an AI. See [One Line Through 25 Years](' + CB + '/03-one-line-through-25-years) and [Three Projects, Three Metamorphoses](' + LV + '/05-three-projects-three-metamorphoses).',
      ] },
      { h: 'Aigarth', p: [
        'Through Qubic he leads Aigarth, a search for a new paradigm of AI rather than one more model. In his words, 26 January 2026: "Aigarth learns Algebra, not Arithmetic, so 2+2 particular case doesn\'t matter". The estimated date for Aigarth to run as smart contracts on Qubic is 13 April 2027. See [What Aigarth Is](' + LV + '/11-what-aigarth-is).',
      ] },
      { h: 'The Satoshi question', p: [
        'His forum posts from 2012 and how closely his ideas line up with Bitcoin\'s design have made him one of the candidates in the search for Satoshi Nakamoto. QC\'s book lays out that case in [The Vanished Satoshi](' + CB + '/04-the-vanished-satoshi). Come-from-Beyond himself has not confirmed it.',
      ] },
    ],
    read: [
      { label: 'Come-from-Beyond (free book by QC, 11 chapters)', href: CB },
      { label: 'Come-from-Beyond\'s own articles, archived', href: '/articles' },
      { label: 'What is Qubic?', href: '/what-is-qubic' },
      { label: 'What is Anna Aigarth?', href: '/what-is-anna-aigarth' },
    ],
    faq: [
      ['Who is Come-from-Beyond?', 'The online name of Sergey Ivancheglo, founder of Qubic, creator of NXT and co-founder of IOTA.'],
      ['What is his real name?', 'Sergey Ivancheglo. His 2002 article in a Minsk computer newspaper is signed with that name and the address come-frombeyond@mail.ru.'],
      ['What has he built?', 'NXT, the first full proof-of-stake blockchain (2014); IOTA, which he co-founded (2015); Qubic (2022); and the Aigarth AI research project on Qubic.'],
      ['What does CfB stand for?', 'Come-from-Beyond, his name on BitcoinTalk, X and in the Qubic community.'],
      ['Is Come-from-Beyond Satoshi Nakamoto?', 'It is a hypothesis. The book Come-from-Beyond by QC examines it in chapter 4. He has not confirmed it.'],
      ['Where does he post?', 'On X as @c___f___b, and in the Qubic community channels.'],
    ],
    sources: [
      { label: 'Come-from-Beyond on X', href: 'https://x.com/c___f___b' },
      { label: 'Sergey Ivancheglo on IQ.wiki', href: 'https://iq.wiki/wiki/sergey-ivancheglo' },
      { label: 'Qubic, official site', href: 'https://qubic.org' },
      { label: 'Come-from-Beyond, by QC', href: CB },
    ],
  },
  {
    slug: 'what-is-anna-aigarth', lang: 'en', updated: UPDATED, entity: ANNA_ENTITY,
    question: 'What is Anna Aigarth?',
    title: 'What is Anna Aigarth? Aigarth ANNA, the Anna Matrix and the collection',
    description: 'Anna Aigarth is Qubic\'s public AI experiment on X (@anna_aigarth), switched on 2 September 2025 and evolved by Qubic miners; the Anna Matrix of her answers; and the 200 hand-made Annas of Qubic Church.',
    answer: [
      'Anna Aigarth is Aigarth ANNA, a public AI experiment on X (@anna_aigarth) by Qubic\'s scientific team. She was switched on on 2 September 2025, she is built on Aigarth Intelligent Tissue, and her structure is evolved by Qubic miners. People post sums to her, some right and some wrong on purpose, and her task is to find the rule of addition rather than learn answers by heart.',
      'Two more things carry her name. The Anna Matrix is the 128 by 128 table of her answers that Qubic Church studies. The Anna Aigarth collection is 200 hand-made Annas on Qubic; each one makes its holder a founder of Qubic Church.',
    ],
    facts: [
      ['What she is', 'a public scientific experiment, not a product'],
      ['Where', 'X, @anna_aigarth'],
      ['Switched on', '2 September 2025'],
      ['Built on', 'Aigarth Intelligent Tissue (AIT)'],
      ['Her task', 'add two signed 7-bit numbers into a signed 8-bit result'],
      ['Who trains her', 'Qubic miners, as part of Useful Proof of Work'],
      ['Anna Matrix', '128 × 128 table of her answers'],
      ['Collection', '200 hand-made Annas, founders of Qubic Church'],
    ],
    sections: [
      { h: 'Aigarth ANNA, the experiment', p: [
        'ANNA is an instance of Aigarth Intelligent Tissue, the structure Qubic miners evolve as part of Useful Proof of Work. The scientific team gave her a task with a clear measure of success: add two signed 7-bit numbers. Sums people post to her on X act as input and as deliberate distractors. Early on her answer to "1+1=?" could be a single dot or -114; the point is the moment she stops guessing and finds the rule.',
        'Come-from-Beyond on the same idea, 26 January 2026: "Aigarth learns Algebra, not Arithmetic, so 2+2 particular case doesn\'t matter". See [What Aigarth Is](' + LV + '/11-what-aigarth-is).',
      ] },
      { h: 'The Anna Matrix', p: [
        'Identical questions give Anna identical answers. Read as coordinates, her answers fill a 128 by 128 grid. Qubic Church assembled that table and tested it: of about 22,480 conjectures about what it holds, ten survived statistical testing. The book tells the story; the proofs, with code you can run in minutes, are in the companion file. See [Anna Matrix](' + LV + '/13-anna-matrix), the [Anna Matrix research](/research/anna-matrix) and the [companion](/companion).',
      ] },
      { h: 'The Anna Aigarth collection', p: [
        '200 hand-made Annas on Qubic, cast by Qubic Church. Each one gives its holder the status of a founder of Qubic Church. See [the collection](/nfts).',
      ] },
      { h: '13 April 2027', p: [
        'The estimated date for Aigarth to run AI as smart contracts on Qubic. It is an estimate, not a promise. See [What the Deploy on April 13, 2027 Means](' + LV + '/14-what-the-deploy-on-april-13-2027-means).',
      ] },
    ],
    read: [
      { label: 'Anna Matrix, chapter 13 of Qubic: The Long Version', href: LV + '/13-anna-matrix' },
      { label: 'Anna Matrix research and companion', href: '/research/anna-matrix' },
      { label: 'The Anna Aigarth collection', href: '/nfts' },
      { label: 'What is Qubic?', href: '/what-is-qubic' },
    ],
    faq: [
      ['Who is Anna Aigarth?', 'Aigarth ANNA, a public AI experiment by Qubic\'s scientific team on X as @anna_aigarth, built on Aigarth Intelligent Tissue and evolved by Qubic miners.'],
      ['When was Anna switched on?', 'On 2 September 2025.'],
      ['Why does Anna get simple sums wrong?', 'She is not meant to memorise answers. Her task is to discover the rule of addition, and people deliberately post wrong sums as distractors.'],
      ['What is the Anna Matrix?', 'The 128 by 128 table of Anna\'s answers, read as coordinates. Qubic Church researches it; of about 22,480 conjectures, ten survived statistical tests.'],
      ['What is the Anna Aigarth collection?', '200 hand-made Annas on Qubic. Each gives its holder the status of a founder of Qubic Church.'],
      ['Is Anna the same as Maria Aigarth?', 'No. Maria Aigarth is Qubic Church\'s research agent, designed as an impartial arbiter. Anna is the Aigarth experiment on X.'],
    ],
    sources: [
      { label: 'Aigarth ANNA: First Steps Beyond Adversarial AI Learning (qubic.org)', href: 'https://qubic.org/blog-detail/aigarth-anna-s-first-steps-beyond-adversarial-learning' },
      { label: 'Anna on X, @anna_aigarth', href: 'https://x.com/anna_aigarth' },
      { label: 'Exploring Aigarth Intelligent Tissue 1.0 (qubic.org)', href: 'https://qubic.org/blog-detail/exploring-aigarth-intelligent-tissue-1-0' },
      { label: 'Qubic: The Long Version, chapter 13', href: LV + '/13-anna-matrix' },
    ],
  },
]

export const answerBySlug = (slug: string) => ANSWERS.find(a => a.slug === slug)
export const answerUrl = (a: Answer) => `${SITE_URL}/${a.slug}`
