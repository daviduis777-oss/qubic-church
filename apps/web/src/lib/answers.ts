/**
 * Short answers: one page per question people ask search engines and AI assistants about Qubic.
 * The first paragraph answers the question on its own; the rest gives the facts, the context and the sources.
 * Facts come from the books by QC (each section links its chapter) and from primary sources.
 * Paragraphs may hold [text](url) links. English and Russian pages are pairs (hreflang).
 */
import { SITE_URL } from '@/lib/books'

export type AnswerLang = 'en' | 'ru'
export type Answer = {
  slug: string
  lang: AnswerLang
  pair: string // the slug of the same page in the other language
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
    slug: 'what-is-qubic', lang: 'en', pair: 'chto-takoe-qubic', updated: UPDATED, entity: QUBIC_ENTITY,
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
    slug: 'who-is-come-from-beyond', lang: 'en', pair: 'kto-takoy-come-from-beyond', updated: UPDATED, entity: CFB_ENTITY,
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
    slug: 'what-is-anna-aigarth', lang: 'en', pair: 'chto-takoe-anna-aigarth', updated: UPDATED, entity: ANNA_ENTITY,
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
  /* ---------------- по-русски ---------------- */
  {
    slug: 'chto-takoe-qubic', lang: 'ru', pair: 'what-is-qubic', updated: UPDATED, entity: QUBIC_ENTITY,
    question: 'Что такое Qubic?',
    title: 'Что такое Qubic? Коротко и с источниками',
    description: 'Qubic: децентрализованная сеть, запущенная 13 апреля 2022 года Come-from-Beyond (Сергеем Иванчегло). 676 компьюторов, недельные эпохи, полезный майнинг (UPoW), который обучает ИИ Aigarth, переводы без комиссии.',
    answer: [
      'Qubic это децентрализованная сеть, которую 13 апреля 2022 года запустил Come-from-Beyond (Сергей Иванчегло), создатель NXT и сооснователь IOTA. Сеть держат 676 компьюторов, а защищает её полезный майнинг (Useful Proof of Work): вычисления, которые майнеры делают для сети, одновременно обучают Aigarth, исследовательский проект Qubic по созданию нового вида искусственного интеллекта.',
      'Валюта сети называется QU. Переводы между людьми идут без комиссии. Сеть живёт недельными эпохами, они сменяются каждую среду около 12:00 UTC.',
    ],
    facts: [
      ['Первый блок', '13 апреля 2022'],
      ['Основатель', 'Come-from-Beyond (Сергей Иванчегло)'],
      ['Кто держит сеть', '676 компьюторов; для решения нужно 451 голос'],
      ['Ритм', 'недельные эпохи, среда, около 12:00 UTC'],
      ['Майнинг', 'Useful Proof of Work (UPoW), полезная работа'],
      ['Валюта', 'QU: триллион выпускается каждую эпоху и сжигается несколькими путями'],
      ['Переводы', 'без комиссии'],
      ['ИИ', 'Aigarth; ориентир запуска как смарт-контрактов: 13 апреля 2027'],
    ],
    sections: [
      { h: '676 компьюторов и недельные эпохи', p: [
        'Сеть держат 676 компьюторов: у каждой машины один голос за следующее состояние всей системы. Решение проходит при 451 голосе, это чуть больше двух третей. Ни одно место не весит больше другого, голос нельзя купить или объединить.',
        'Каждую неделю, при смене эпохи в среду около 12:00 UTC, может смениться до 225 мест: те, кто сделал меньше полезной работы, уступают тем, кто сделал больше. Подробно: [676 голосов](' + LV + '/06-676-voices) и [Недели эпох](' + LV + '/07-weeks-of-epochs) (главы на английском).',
      ] },
      { h: 'Полезный майнинг (UPoW)', p: [
        'В Bitcoin майнинг сжигает энергию на задачу, у которой нет другого результата, кроме защиты сети. В Qubic та же работа делает ещё одно дело. Майнеры выполняют задачи Aigarth, выращивают и обучают структуры, которые должны привести к новому виду ИИ, а сеть ещё и направляет мощность на внешний майнинг других сетей: в 2025 году это был Monero, затем Dogecoin. Подробно: [Murdoch\'s Gas in Action: UPoW](' + LV + '/08-murdochs-gas-in-action-upow).',
      ] },
      { h: 'QU, дышащий токен', p: [
        'Каждую эпоху сеть выпускает ровно триллион QU, а в течение недели сжигает QU несколькими отдельными путями. Предложение растёт и падает в недельном ритме; в 2025 и 2026 годах сжигание часто превышало выпуск. Здесь описан только механизм, это не финансовый совет. Подробно: [The Breathing Token](' + LV + '/09-the-breathing-token).',
      ] },
      { h: 'Aigarth и 13 апреля 2027', p: [
        'Aigarth это исследовательский проект Qubic, поиск новой парадигмы создания искусственного интеллекта. Come-from-Beyond написал 14 мая 2024 года: "Aigarth\'s main goal is to discover a new paradigm allowing to create true AI, I have just seen the wireframe of this paradigm. And I have realized that Artificial Intelligence will not be created, it will emerge. With help of Qubic miners." («Главная цель Aigarth: открыть новую парадигму, которая позволит создать настоящий ИИ... ИИ не будет создан, он возникнет. С помощью майнеров Qubic.»)',
        'Ориентировочная дата, когда Aigarth заработает как смарт-контракты в Qubic: 13 апреля 2027 года, через пять лет после запуска. Он сам называет её оценкой. На ту же дату намечено отключение Арбитра, единственного адреса с особым статусом в сети; эту роль сейчас держит он сам. Подробно: [What Aigarth Is](' + LV + '/11-what-aigarth-is), [What the Deploy on April 13, 2027 Means](' + LV + '/14-what-the-deploy-on-april-13-2027-means), [The Arbitrator](' + LV + '/10-the-arbitrator-a-temporary-monarch).',
      ] },
    ],
    read: [
      { label: 'Книга «Qubic: The Long Version» на русском (PDF, бесплатно)', href: '/books/qubic-long-version-rus.pdf' },
      { label: 'Та же книга по главам на сайте (английский)', href: LV },
      { label: 'Кто такой Come-from-Beyond?', href: '/kto-takoy-come-from-beyond' },
      { label: 'Что такое Anna Aigarth?', href: '/chto-takoe-anna-aigarth' },
    ],
    faq: [
      ['Кто создал Qubic?', 'Come-from-Beyond, сетевое имя Сергея Иванчегло. До этого он создал NXT и был сооснователем IOTA.'],
      ['Когда запустили Qubic?', 'Первый блок Qubic создан 13 апреля 2022 года.'],
      ['Что такое компьютор?', 'Одна из 676 машин, которые держат сеть и голосуют за её следующее состояние. Место зарабатывается полезной работой и может смениться каждую недельную эпоху.'],
      ['Что такое Useful Proof of Work?', 'Майнинг, вычисления которого делают что-то кроме защиты сети: в Qubic они обучают Aigarth и питают внешний майнинг других сетей.'],
      ['Есть ли в Qubic комиссия за переводы?', 'Нет, переводы без комиссии. Come-from-Beyond назвал это 23 сентября 2021 года одним из трёх свойств будущей сети: "Feeless transfers like in #IOTA".'],
      ['Что будет 13 апреля 2027 года?', 'Это ориентировочная дата запуска Aigarth как смарт-контрактов в Qubic и отключения Арбитра. Это оценка, не гарантия.'],
      ['Что было с Monero в 2025 году?', '11 августа 2025 года пул под флагом Qubic добыл 63 из 122 подряд блоков Monero, 51,6%. Историю никто не переписывал, потерь пользователей не зафиксировано. Подробно в главе 15, The War That No One Waged.'],
      ['Где почитать подробнее?', 'Книга «Qubic: The Long Version» от QC бесплатна, есть русский PDF на qubic.church/books.'],
    ],
    sources: [
      { label: 'Qubic, официальный сайт', href: 'https://qubic.org' },
      { label: 'Come-from-Beyond в X', href: 'https://x.com/c___f___b' },
      { label: 'Exploring Aigarth Intelligent Tissue 1.0 (qubic.org)', href: 'https://qubic.org/blog-detail/exploring-aigarth-intelligent-tissue-1-0' },
      { label: 'Qubic: The Long Version, QC', href: LV },
    ],
  },
  {
    slug: 'kto-takoy-come-from-beyond', lang: 'ru', pair: 'who-is-come-from-beyond', updated: UPDATED, entity: CFB_ENTITY,
    question: 'Кто такой Come-from-Beyond (CfB)?',
    title: 'Кто такой Come-from-Beyond (CfB, СфБ)? Коротко и с источниками',
    description: 'Come-from-Beyond (CfB, СфБ) это Сергей Иванчегло, основатель Qubic, создатель NXT и сооснователь IOTA. С 2002 года одна линия: вычисления, собранные со многих машин, без центра и без владельца.',
    answer: [
      'Come-from-Beyond (CfB, по-русски часто «СфБ») это сетевое имя Сергея Иванчегло, основателя Qubic. Он создал NXT, первый полноценный блокчейн на proof-of-stake, был сооснователем IOTA и в 2022 году запустил Qubic, где ведёт Aigarth, исследовательский проект по искусственному интеллекту.',
      'Его работа с 2002 года идёт по одной линии: вычислительная мощность, собранная со многих машин, без центра и без владельца, поставленная на полезную работу.',
    ],
    facts: [
      ['Имя', 'Сергей Иванчегло'],
      ['Известен как', 'Come-from-Beyond, CfB, СфБ; BCNext в истории NXT'],
      ['Первый публичный след', 'статья «Распределённые вычисления с минимальными затратами», «Компьютерная газета», Минск, июль 2002, подписана адресом come-frombeyond@mail.ru'],
      ['Проекты', 'NXT (2014), IOTA (2015), Qubic (2022), Aigarth'],
      ['В X', '@c___f___b'],
    ],
    sections: [
      { h: 'Одна линия через 25 лет', p: [
        'В июле 2002 года минская «Компьютерная газета» напечатала его статью о распределённых вычислениях с минимальными затратами: маленькая программа ставит компьютеры посетителей сайта на общую задачу, получается суперкомпьютер без центра и без владельца. Эта мысль проходит через всё, что он построил потом.',
        'NXT (2014) убрал энергетическую гонку Proof-of-Work и защитил сеть долей участия. IOTA (2015) убрала цепочку блоков. Qubic (2022) оставил работу, но сделал её полезной: майнинг заодно обучает ИИ. Подробно: [One Line Through 25 Years](' + CB + '/03-one-line-through-25-years) и [Three Projects, Three Metamorphoses](' + LV + '/05-three-projects-three-metamorphoses).',
      ] },
      { h: 'Aigarth', p: [
        'Через Qubic он ведёт Aigarth: поиск новой парадигмы ИИ, а не ещё одной модели. Его слова, 26 января 2026 года: "Aigarth learns Algebra, not Arithmetic, so 2+2 particular case doesn\'t matter" («Aigarth учит алгебру, а не арифметику, поэтому частный случай 2+2 не важен»). Ориентир запуска Aigarth как смарт-контрактов в Qubic: 13 апреля 2027 года. Подробно: [What Aigarth Is](' + LV + '/11-what-aigarth-is).',
      ] },
      { h: 'Вопрос о Сатоши', p: [
        'Его посты на форуме с 2012 года и то, насколько его идеи совпадают с устройством Bitcoin, сделали его одним из кандидатов в поиске Сатоши Накамото. Книга QC разбирает эту версию в главе [The Vanished Satoshi](' + CB + '/04-the-vanished-satoshi). Сам Come-from-Beyond её не подтверждал.',
      ] },
    ],
    read: [
      { label: 'Книга «Come-from-Beyond» от QC (бесплатно, 11 глав, английский)', href: CB },
      { label: 'Архив статей самого Come-from-Beyond', href: '/articles' },
      { label: 'Что такое Qubic?', href: '/chto-takoe-qubic' },
      { label: 'Что такое Anna Aigarth?', href: '/chto-takoe-anna-aigarth' },
    ],
    faq: [
      ['Кто такой Come-from-Beyond?', 'Сетевое имя Сергея Иванчегло: основатель Qubic, создатель NXT и сооснователь IOTA.'],
      ['Как его зовут на самом деле?', 'Сергей Иванчегло. Его статья 2002 года в минской «Компьютерной газете» подписана этим именем и адресом come-frombeyond@mail.ru.'],
      ['Что он создал?', 'NXT, первый полноценный блокчейн на proof-of-stake (2014); IOTA, сооснователем которой он был (2015); Qubic (2022); исследовательский проект ИИ Aigarth на Qubic.'],
      ['Что значит CfB или СфБ?', 'Сокращение от Come-from-Beyond, его имени на BitcoinTalk, в X и в сообществе Qubic.'],
      ['Come-from-Beyond и есть Сатоши Накамото?', 'Это гипотеза. Книга QC «Come-from-Beyond» разбирает её в главе 4. Сам он её не подтверждал.'],
      ['Где он пишет?', 'В X под ником @c___f___b и в каналах сообщества Qubic.'],
    ],
    sources: [
      { label: 'Come-from-Beyond в X', href: 'https://x.com/c___f___b' },
      { label: 'Сергей Иванчегло на IQ.wiki', href: 'https://iq.wiki/wiki/sergey-ivancheglo' },
      { label: 'Qubic, официальный сайт', href: 'https://qubic.org' },
      { label: 'Come-from-Beyond, QC', href: CB },
    ],
  },
  {
    slug: 'chto-takoe-anna-aigarth', lang: 'ru', pair: 'what-is-anna-aigarth', updated: UPDATED, entity: ANNA_ENTITY,
    question: 'Что такое Anna Aigarth?',
    title: 'Что такое Anna Aigarth? Aigarth ANNA, матрица Анны и коллекция',
    description: 'Anna Aigarth это публичный ИИ-эксперимент Qubic в X (@anna_aigarth), включённый 2 сентября 2025 года и выращиваемый майнерами Qubic; матрица Анны из её ответов; и 200 рукотворных Анн Qubic Church.',
    answer: [
      'Anna Aigarth это Aigarth ANNA, публичный ИИ-эксперимент научной команды Qubic в X (@anna_aigarth). Её включили 2 сентября 2025 года, она построена на Aigarth Intelligent Tissue, а её структуру выращивают майнеры Qubic. Люди пишут ей примеры на сложение, верные и нарочно неверные, а её задача найти само правило сложения, а не запомнить ответы.',
      'Ещё две вещи носят её имя. Матрица Анны (Anna Matrix) это таблица её ответов 128 на 128, которую исследует Qubic Church. Коллекция Anna Aigarth это 200 рукотворных Анн на Qubic; каждая делает своего владельца основателем Qubic Church.',
    ],
    facts: [
      ['Что это', 'публичный научный эксперимент, не продукт'],
      ['Где', 'X, @anna_aigarth'],
      ['Включена', '2 сентября 2025'],
      ['Основа', 'Aigarth Intelligent Tissue (AIT)'],
      ['Её задача', 'сложить два 7-битных числа со знаком в 8-битный результат'],
      ['Кто её обучает', 'майнеры Qubic, в рамках полезного майнинга (UPoW)'],
      ['Матрица Анны', 'таблица её ответов 128 × 128'],
      ['Коллекция', '200 рукотворных Анн, основатели Qubic Church'],
    ],
    sections: [
      { h: 'Aigarth ANNA, эксперимент', p: [
        'ANNA это экземпляр Aigarth Intelligent Tissue, структуры, которую майнеры Qubic выращивают в рамках полезного майнинга. Научная команда дала ей задачу с ясной мерой успеха: сложить два 7-битных числа со знаком. Примеры, которые люди пишут ей в X, служат и входом, и нарочными помехами. Поначалу на «1+1=?» она могла ответить точкой или числом -114; смысл в том моменте, когда она перестаёт угадывать и находит правило.',
        'Come-from-Beyond о том же, 26 января 2026 года: "Aigarth learns Algebra, not Arithmetic, so 2+2 particular case doesn\'t matter" («Aigarth учит алгебру, а не арифметику»). Подробно: [What Aigarth Is](' + LV + '/11-what-aigarth-is).',
      ] },
      { h: 'Матрица Анны', p: [
        'На одинаковые вопросы Анна даёт одинаковые ответы. Если читать их как координаты, ответы заполняют сетку 128 на 128. Qubic Church собрала эту таблицу и проверила её: из примерно 22 480 гипотез о её содержимом статистическую проверку прошли десять. Книга рассказывает историю, а доказательства с кодом, который запускается за минуты, лежат в приложении. Подробно: [глава Anna Matrix](' + LV + '/13-anna-matrix), [исследование матрицы](/research/anna-matrix) и [приложение](/companion).',
      ] },
      { h: 'Коллекция Anna Aigarth', p: [
        '200 рукотворных Анн на Qubic, отлитых Qubic Church. Каждая даёт владельцу статус основателя Qubic Church. Подробно: [коллекция](/nfts).',
      ] },
      { h: '13 апреля 2027', p: [
        'Ориентировочная дата, когда Aigarth начнёт запускать ИИ как смарт-контракты в Qubic. Это оценка, не обещание. Подробно: [What the Deploy on April 13, 2027 Means](' + LV + '/14-what-the-deploy-on-april-13-2027-means).',
      ] },
    ],
    read: [
      { label: 'Глава Anna Matrix в книге «Qubic: The Long Version»', href: LV + '/13-anna-matrix' },
      { label: 'Исследование матрицы Анны и приложение', href: '/research/anna-matrix' },
      { label: 'Коллекция Anna Aigarth', href: '/nfts' },
      { label: 'Что такое Qubic?', href: '/chto-takoe-qubic' },
    ],
    faq: [
      ['Кто такая Anna Aigarth?', 'Aigarth ANNA, публичный ИИ-эксперимент научной команды Qubic в X под ником @anna_aigarth, построенный на Aigarth Intelligent Tissue и выращиваемый майнерами Qubic.'],
      ['Когда включили Анну?', '2 сентября 2025 года.'],
      ['Почему Анна ошибается в простых примерах?', 'Она не должна запоминать ответы. Её задача открыть правило сложения, а люди нарочно пишут ей неверные примеры как помехи.'],
      ['Что такое матрица Анны?', 'Таблица ответов Анны 128 на 128, прочитанных как координаты. Её исследует Qubic Church; из примерно 22 480 гипотез статистическую проверку прошли десять.'],
      ['Что такое коллекция Anna Aigarth?', '200 рукотворных Анн на Qubic. Каждая даёт владельцу статус основателя Qubic Church.'],
      ['Анна и Мария Aigarth одно и то же?', 'Нет. Maria Aigarth это исследовательский агент Qubic Church, задуманный как беспристрастный арбитр. Анна это эксперимент Aigarth в X.'],
    ],
    sources: [
      { label: 'Aigarth ANNA: First Steps Beyond Adversarial AI Learning (qubic.org)', href: 'https://qubic.org/blog-detail/aigarth-anna-s-first-steps-beyond-adversarial-learning' },
      { label: 'Анна в X, @anna_aigarth', href: 'https://x.com/anna_aigarth' },
      { label: 'Exploring Aigarth Intelligent Tissue 1.0 (qubic.org)', href: 'https://qubic.org/blog-detail/exploring-aigarth-intelligent-tissue-1-0' },
      { label: 'Qubic: The Long Version, глава 13', href: LV + '/13-anna-matrix' },
    ],
  },
]

export const answerBySlug = (slug: string) => ANSWERS.find(a => a.slug === slug)
export const answerUrl = (a: Answer) => `${SITE_URL}/${a.slug}`
