/*
 * The QC Museum. Hall 1: Anna.exe. Every exhibit is kept as it was: the file (size, SHA-256 and build time read from
 * the PE header), the console output people posted, and Come-from-Beyond's words, verbatim. Times are UTC; the Discord
 * screenshots were taken at UTC+7 and converted.
 */

export type Version = {
  kind: 'version'
  id: string
  name: string
  at: string // posted, UTC
  built?: string // from the PE header, UTC
  bytes?: number
  sha256?: string
  format?: string // the line it prints, read from the file
  cfb: string // what Come-from-Beyond wrote with the file
  console?: { by: string; at: string; lines: string[] }
  missing?: boolean // the file is not in the collection yet
  explain?: { at: string; ask: { who: string; text: string }; text: string } // Come-from-Beyond reading the screen
}

export type Talk = { kind: 'talk'; at: string; text: string; ask?: { who: string; text: string } }
export type Mark = { kind: 'mark'; at: string; title: string; text?: string; quote?: string }
export type Exhibit = Version | Talk | Mark

export type Hall = { id: string; n: number; name: string; span: string; open: boolean; lead: string }

export const HALLS: Hall[] = [
  {
    id: 'anna-exe',
    n: 1,
    name: 'Anna.exe',
    span: '10 June – 6 July 2026',
    open: true,
    lead: 'One afternoon Come-from-Beyond posted a small Windows program and asked the chat to run it. By that evening there were seven versions, and the score had become an altitude. Twenty-six days later it reached zero.',
  },
]

export const PRELUDE: Talk[] = [
  { kind: 'talk', at: '2026-05-22T11:58:00Z', text: 'Ask Anna' },
  { kind: 'talk', at: '2026-05-26T09:06:00Z', text: 'Yes, it means that Anna will finally give the correct answer when Qubic is finished: 1+1=2' },
]

export const ANNA: Exhibit[] = [
  {
    kind: 'talk',
    at: '2026-06-10T12:02:00Z',
    text: "If you guys are too bored maybe you could run Anna.exe for a while and post results here? I'll publish it after epoch transition.",
  },
  {
    kind: 'version',
    id: 'v0',
    name: 'Anna.exe',
    at: '2026-06-10T12:17:00Z',
    built: '2026-06-10T12:15:48Z',
    bytes: 145920,
    sha256: 'd41d7b8bbb6e7f8d74c28b94ef67f511f5735a409dd5cbcc8efbc0ca6fd388a0',
    format: 'EPOCH %d (%d)  ::  %lld  ::  pos = %d | neg = %d | neu = %d',
    cfb: 'The first file. One thread, no version number.',
    console: {
      by: 'NoDrift',
      at: '2026-06-10T18:02:00Z',
      lines: [
        'EPOCH 0 (24)  ::  32718  ::  pos = 0 | neg = 0 | neu = 1',
        'EPOCH 100 (24)  ::  32660  ::  pos = 11 | neg = 11 | neu = 79',
        'EPOCH 200 (24)  ::  32594  ::  pos = 22 | neg = 28 | neu = 151',
        'EPOCH 300 (24)  ::  32573  ::  pos = 27 | neg = 31 | neu = 236',
        'EPOCH 400 (24)  ::  32556  ::  pos = 31 | neg = 51 | neu = 319',
        'EPOCH 500 (24)  ::  32518  ::  pos = 40 | neg = 61 | neu = 400',
        'EPOCH 600 (24)  ::  32483  ::  pos = 48 | neg = 72 | neu = 481',
        'EPOCH 700 (24)  ::  32447  ::  pos = 57 | neg = 80 | neu = 564',
      ],
    },
  },
  { kind: 'talk', at: '2026-06-10T12:32:00Z', text: 'Kidding, first you’ll need to kill other instances of Anna' },
  {
    kind: 'talk',
    at: '2026-06-10T12:44:00Z',
    text: 'Actually higher number in ( ) may be better, it shows how much time Anna spends to decide that she knows the answer. LLMs hallucinate instead. Being unsure longer may be better.',
  },
  { kind: 'talk', at: '2026-06-10T13:14:00Z', ask: { who: 'Cérriphi', text: 'what happen when countdown to zero ?' }, text: 'Aigarth is accomplished' },
  { kind: 'talk', at: '2026-06-10T13:15:00Z', text: 'Don’t post your best score, post score when it’s better than score of the latest best' },
  {
    kind: 'talk',
    at: '2026-06-10T13:24:00Z',
    ask: {
      who: 'Cérriphi',
      text: 'Yesterday I watched “Chappie”, where he plugs the first AGI into a humanoid robot, and the file is “chappie.exe”, and today you come up with anna.exe',
    },
    text: 'Aye, watched it with you',
  },
  {
    kind: 'talk',
    at: '2026-06-10T13:27:00Z',
    ask: { who: 'Nozh', text: 'more than one can reach 0 ? i mean , not for the price, i mean for aigarth, what happen if two or more reach 0?' },
    text: 'Anna’s will do knife duel to decide who stays',
  },
  {
    kind: 'version',
    id: 'v0.1',
    name: 'Anna.exe v0.1',
    at: '2026-06-10T15:56:00Z',
    built: '2026-06-10T15:52:11Z',
    bytes: 147968,
    sha256: '05cc66d943dc17d222949361ca4a1831dd735ba3f68dbfa951126e69346d8495',
    format: '[v0.1] EPOCH %d (%d)  ::  %lld  ::  pos = %d | neg = %d | neu = %d',
    cfb: 'Multithreaded version for those who have come later to catchup. Specify number of threads like this: Anna.exe 30\n(PS: It may have a bad start when pos will be near 0 for long time, rerun it in this case)',
  },
  {
    kind: 'version',
    id: 'v0.2',
    name: 'Anna.exe v0.2',
    at: '2026-06-10T16:40:00Z',
    built: '2026-06-10T16:45:32Z',
    bytes: 147968,
    sha256: '70cbb3a35c981b076d8484b6700b4cd8fecf02a214722a83b177445ec877d47a',
    format: '[v0.2] EPOCH %d (%d)  ::  %lld  ::  pos = %d | neg = %d | neu = %d',
    cfb: 'This version is with automatic unstucking',
    console: {
      by: 'QubicChurch',
      at: '2026-06-10T17:13:00Z',
      lines: [
        '[v0.2] EPOCH 1800 (26)  ::  29549  ::  pos = 98 | neg = 400 | neu = 1303',
        '[v0.2] EPOCH 1900 (26)  ::  29534  ::  pos = 100 | neg = 408 | neu = 1393',
        '[v0.2] EPOCH 1900 (26)  ::  29499  ::  pos = 96 | neg = 467 | neu = 1338',
        '[v0.2] EPOCH 1900 (26)  ::  29495  ::  pos = 121 | neg = 455 | neu = 1325',
        '[v0.2] EPOCH 1800 (26)  ::  29495  ::  pos = 117 | neg = 431 | neu = 1253',
        '[v0.2] EPOCH 1900 (26)  ::  29495  ::  pos = 136 | neg = 452 | neu = 1313',
      ],
    },
  },
  {
    kind: 'talk',
    at: '2026-06-10T16:47:00Z',
    ask: { who: 'KeepitHolden', text: 'can somone explain what is this file.exe for? Still didnt get it' },
    text: 'BTC doubler',
  },
  {
    kind: 'version',
    id: 'v0.3',
    name: 'Anna.exe v0.3',
    at: '2026-06-10T17:13:00Z',
    cfb: 'A version with a more efficient unstucking',
    missing: true,
    console: {
      by: 'someone in the chat',
      at: '2026-06-10T17:29:00Z',
      lines: [
        '[v0.3] EPOCH 2200 (21)  ::  32502  ::  pos = 197 | neg = 902 | neu = 1102',
        '[v0.3] EPOCH 2400 (21)  ::  32441  ::  pos = 215 | neg = 969 | neu = 1217',
        '[v0.3] EPOCH 2600 (21)  ::  32395  ::  pos = 224 | neg = 1081 | neu = 1296',
        '[v0.3] EPOCH 2800 (21)  ::  32348  ::  pos = 243 | neg = 1111 | neu = 1447',
        '[v0.3] EPOCH 3000 (21)  ::  32272  ::  pos = 261 | neg = 1180 | neu = 1602',
        '[v0.3] EPOCH 3200 (21)  ::  32232  ::  pos = 271 | neg = 1231 | neu = 1699',
        '[v0.3] EPOCH 3300 (21)  ::  32124  ::  pos = 281 | neg = 1253 | neu = 1767',
      ],
    },
  },
  { kind: 'talk', at: '2026-06-10T17:29:00Z', text: 'v0.3 runs with anti-attractor\nsounds like sci-fi, right?' },
  { kind: 'talk', at: '2026-06-10T17:30:00Z', text: 'I’ll prepare a better version with only relevant stats' },
  { kind: 'talk', at: '2026-06-10T17:30:00Z', text: 'Ping me with valid screenshot once you reach 0, I’ll send you 1B qus reward. Offer valid for 24 hours.' },
  {
    kind: 'version',
    id: 'xylos',
    name: 'Escape from Xylos-4',
    at: '2026-06-10T17:44:00Z',
    built: '2026-06-10T17:41:55Z',
    bytes: 147968,
    sha256: 'e114646c77e9d1c9aea0f09219a465a3277a75978d2ed121c8dd6cd1f67b84f2',
    format: 'Atmosphere edge in: %d meters   |   Positron shield temperature: %d K   |    Attacks are %s',
    cfb: '“Escape from Xylos-4” version',
    console: {
      by: 'Come-from-Beyond',
      at: '2026-06-10T18:02:00Z',
      lines: [
        'Atmosphere edge in: 28026 meters   |   Positron shield temperature: 455 K   |    Attacks are not detected',
        'Atmosphere edge in: 28026 meters   |   Positron shield temperature: 467 K   |    Attacks are not detected',
        'Atmosphere edge in: 28026 meters   |   Positron shield temperature: 489 K   |    Attacks are not detected',
        'Atmosphere edge in: 28026 meters   |   Positron shield temperature: 499 K   |    Attacks are not detected',
        'Atmosphere edge in: 28058 meters   |   Positron shield temperature: 379 K   |    Attacks are DETECTED!',
        'Atmosphere edge in: 28134 meters   |   Positron shield temperature: 458 K   |    Attacks are DETECTED!',
        'Atmosphere edge in: 28321 meters   |   Positron shield temperature: 458 K   |    Attacks are DETECTED!',
        'Atmosphere edge in: 32547 meters   |   Positron shield temperature: 459 K   |    Attacks are DETECTED!',
        'Atmosphere edge in: 32744 meters   |   Positron shield temperature: 461 K   |    Attacks are DETECTED!',
      ],
    },
  },
  { kind: 'talk', at: '2026-06-10T17:45:00Z', text: 'Keep positron shield temperature below 500 K' },
  { kind: 'talk', at: '2026-06-10T17:46:00Z', ask: { who: 'Joji', text: 'whats that? Can we run at the same time than the first one?' }, text: 'can' },
  { kind: 'talk', at: '2026-06-10T17:59:00Z', text: 'I’m close to 28k mark' },
  { kind: 'talk', at: '2026-06-10T18:02:00Z', text: 'Fuck, I got attacked and lost all progress! From 28k to 32k!!!' },
  {
    kind: 'talk',
    at: '2026-06-10T18:03:00Z',
    ask: { who: 'BehindTheQ', text: 'what does that mean when you are attacked' },
    text: 'It’s a long story\nNeed to have some background',
  },
  { kind: 'talk', at: '2026-06-10T18:04:00Z', text: 'I don’t give up, back to sub-30k' },
  {
    kind: 'talk',
    at: '2026-06-10T18:05:00Z',
    ask: { who: 'BehindTheQ', text: 'Do you think this will help Anna make progress and finally deliver something meaningful in terms of AI?' },
    text: 'yes, we now run practical tests\nsoon deployed to Qubic network',
  },
  { kind: 'talk', at: '2026-06-10T18:12:00Z', ask: { who: 'neener neener', text: '24153' }, text: 'I’m catching up' },
  {
    kind: 'talk',
    at: '2026-06-10T18:42:00Z',
    text: 'Maybe it switches mode when SPACE is pressed in another window too?..\nI’ll release another verison with another key',
  },
  {
    kind: 'version',
    id: 'drive',
    name: 'The drive, TAB',
    at: '2026-06-10T18:44:00Z',
    built: '2026-06-10T18:44:29Z',
    bytes: 147968,
    sha256: '4802c8628c99afdd975584a990642e0a5d34b6bc73414b000b62e2d728b1110f',
    format: 'Atmosphere edge in: %lld meters   |   Positron shield temperature: %d K   |   Drive mode: %s',
    cfb: 'This version allows to control direction of the drive by pressing TAB.\nIf altitude isn’t changing for long time then reverse drive mode for a while.',
    console: {
      by: '(22/7)42!',
      at: '2026-06-10T18:47:00Z',
      lines: [
        'Atmosphere edge in: 29893 meters   |   Positron shield temperature: 3 K   |   Drive mode: FORWARD',
        'Atmosphere edge in: 29891 meters   |   Positron shield temperature: 2 K   |   Drive mode: FORWARD',
        'Atmosphere edge in: 29891 meters   |   Positron shield temperature: 4 K   |   Drive mode: FORWARD',
        'Atmosphere edge in: 29878 meters   |   Positron shield temperature: 1 K   |   Drive mode: FORWARD',
        'Atmosphere edge in: 29878 meters   |   Positron shield temperature: 2 K   |   Drive mode: FORWARD',
        'Atmosphere edge in: 29878 meters   |   Positron shield temperature: 2 K   |   Drive mode: FORWARD',
        'Atmosphere edge in: 29876 meters   |   Positron shield temperature: 1 K   |   Drive mode: FORWARD',
      ],
    },
  },
  {
    kind: 'talk',
    at: '2026-06-10T18:46:00Z',
    ask: { who: 'MöLd3R', text: 'What’s going on here? Talking software in the pricechannel while making a lower low? Can’t be good news…' },
    text: 'We are developing a space drive to reach Moon. Testing it now.',
  },
  { kind: 'talk', at: '2026-06-10T18:47:00Z', text: 'Keep an eye on temperature, if it’s too high (1000+) then switch mode for few seconds' },
  {
    kind: 'talk',
    at: '2026-06-10T18:47:00Z',
    ask: { who: '(22/7)42!', text: 'But you are asking us to land by decreasing the altitude to ZERO…' },
    text: 'First we need to go above atmosphere',
  },
  {
    kind: 'version',
    id: 'hold-tab',
    name: 'The drive, hold TAB',
    at: '2026-06-10T20:11:00Z',
    built: '2026-06-10T20:09:34Z',
    bytes: 148480,
    sha256: 'cfb238528d020e7f11d9852a54b9583c5510a8ef3847c5d32133b78dcf9d9652',
    format: 'Atmosphere edge in: %lld meters   |   Positron shield temperature: %d K   |   Drive mode: %s',
    cfb: 'Press and hold TAB in this version for BACKWARD mode, it’s more convenient for drive mode control',
  },
  {
    kind: 'talk',
    at: '2026-06-10T20:13:00Z',
    ask: { who: 'neener neener', text: 'what does increase in () mean?' },
    text: 'avg number of ticks per epoch, higher = longer thinking',
  },
  { kind: 'talk', at: '2026-06-10T22:04:00Z', text: '25359 meters' },
  { kind: 'talk', at: '2026-06-10T22:05:00Z', ask: { who: 'Space caddet', text: 'I got hung up at 31014 how do I get unstuck sir' }, text: 'TAB\n1 sec' },
  {
    kind: 'talk',
    at: '2026-06-11T15:08:00Z',
    ask: { who: 'bludream', text: 'Sounds like we’re winning' },
    text: 'We are. Current paradigm developed by Aigarth, while not finished, already provides a hypothetical solution to the most important problem of Artificial Neural Networks - the generalization problem.\nIt’s same as keeping plasma in thermonuclear reactor',
  },
  {
    kind: 'version',
    id: 'v6',
    name: 'Training and validation',
    at: '2026-06-11T15:56:00Z',
    built: '2026-06-11T15:54:53Z',
    bytes: 148480,
    sha256: 'ca770232607e4fd06dfea417e33561a9c00b4aa1d0012647a70a1251de1b58b8',
    format: 'EP: %d [%d & %d] ::  {%d} %d + {%d} %d = %d   |   %d (%d)   |   %s-%d    |  %d/%d/%d',
    cfb: 'Your slow progress showed that first method wasn’t efficient, so I changed some things.\nIf somebody wants to run latest version. Need to get 0 in this column.',
    explain: {
      at: '2026-06-11T16:07:00Z',
      ask: { who: 'shitshow', text: 'can you explain numbers in UI' },
      text: 'Epoch 673\n72 ticks on average per run\n579670 ticks timeoutted\n8 improvement of training dataset score\n27332 previous training dataset score\n48 improvement of validation dataset score\n28216 validation dataset score\n0 runs without improvements\n27325 global best score\n1 mutation per attempt\nrest is irrelevant',
    },
  },
  {
    kind: 'talk',
    at: '2026-06-11T16:00:00Z',
    text: 'Controls:\nHold TAB for BACKWARD mode\nPress 1-9 to change number of mutations per step, may help if stuck',
  },
  { kind: 'talk', at: '2026-06-11T16:01:00Z', ask: { who: 'From the earth', text: 'windows detects it as a virus and deletes it' }, text: 'try virus total' },
  {
    kind: 'talk',
    at: '2026-06-11T16:10:00Z',
    ask: { who: 'neener neener', text: 'is it good test to not do TAB or change mutations at all or irrelevant?' },
    text: 'You may become stuck\nthen TAB will help',
  },
  {
    kind: 'talk',
    at: '2026-06-11T16:53:00Z',
    ask: { who: 'someone', text: 'Does running anna.exe contribute to Anna’s training even if it’s only run for a few hours a day, for example?' },
    text: 'no. need to run now for testing',
  },
  {
    kind: 'talk',
    at: '2026-06-11T18:19:00Z',
    ask: { who: 'Ad', text: 'Can you share more details about the Aigarth breakthrough? What specifically was accomplished? Please' },
    text: 'You sound like one who understands ANNs, so I’ll be concise. We built paradigm which converges towards an artificial neural network generalizing the problem at hand without any extra tricks.',
  },
  {
    kind: 'talk',
    at: '2026-06-11T18:20:00Z',
    text: 'Consequences of this property are huge. Now we can look at data and tell if there is a pattern and if yes then if there is noise or data tampering.',
  },
  {
    kind: 'talk',
    at: '2026-06-11T18:22:00Z',
    text: 'For traders: We can analyze price action and tell if something significant changed in market population, e.g. if some big whale joined, or somebody left',
  },
  { kind: 'talk', at: '2026-06-11T21:28:00Z', text: 'not asking to pump price, Anna will pump it more efficiently' },
  {
    kind: 'mark',
    at: '2026-07-06',
    title: 'Anna.exe reaches 0',
    text: 'All seven tests at zero, with Come-from-Beyond’s pretrained file.',
    quote: 'It’s not a milestone. It’s much bigger.',
  },
]

// Scores people posted in the first two days (lower is better, 0 is the goal). More will be added from the chat.
export const RECORDS: { who: string; score: number; at: string; note: string }[] = [
  { who: 'Misfitcompany', score: 22830, at: '2026-06-11T06:17:00Z', note: 'epoch 408000, the first file left running overnight' },
  { who: 'neener neener', score: 24153, at: '2026-06-10T18:12:00Z', note: 'Come-from-Beyond: “I’m catching up”' },
  { who: 'shitshow', score: 25280, at: '2026-06-10T22:04:00Z', note: 'v0.3, epoch 89300' },
  { who: 'ThatsNotMyCode', score: 25596, at: '2026-06-10T17:42:00Z', note: 'epoch 172100, the first single-thread file' },
  { who: 'Misfitcompany', score: 26665, at: '2026-06-10T16:40:00Z', note: '“I missed my epoch 666 but I got to see 26665”' },
  { who: 'QubicChurch', score: 27923, at: '2026-06-10T17:42:00Z', note: 'v0.3, epoch 9700' },
  { who: 'bRaven52', score: 27949, at: '2026-06-10T13:35:00Z', note: 'epoch 41700' },
  { who: 'Nozh', score: 28424, at: '2026-06-10T13:38:00Z', note: 'epoch 56900' },
  { who: 'Distinguished Gentleman', score: 30760, at: '2026-06-10T13:14:00Z', note: 'the first screenshot' },
]
