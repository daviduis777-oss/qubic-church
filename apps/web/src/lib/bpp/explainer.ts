import { SITE_URL } from '@/lib/books'

/** The BPP-9000 explainer as plain text: for /text/bpp9000.md, llms.txt and the page's structured data. */
export const BPP_URL = `${SITE_URL}/bpp9000`
export const BPP_MD_URL = `${SITE_URL}/text/bpp9000.md`
export const BPP_SUMMARY =
  'BPP-9000 (Bitcoin Price Predictor 9000) is the first product of Aigarth on Qubic: a small ternary neural network grown by Qubic miners to call each hour of bitcoin, up or down. qubic.church/bpp9000 runs the best recent network live in the browser, counts down to the first live call on 18 November 2026, and keeps a journal for participants of the public experiment.'

export const BPP_FAQ: [string, string][] = [
  ['What is BPP-9000?', 'Bitcoin Price Predictor 9000, the first product of Aigarth on Qubic. A small ternary neural network, grown by Qubic miners, that calls the next hour of bitcoin: UP or DOWN at the hourly close.'],
  ['How is it trained?', 'Qubic mining is useful proof of work. Miners mutate tiny networks (32 neurons, each with 3 wires and a table of 27 rules) and score them on a real year of hourly BTC/USDT candles from Binance, about 8,760 hours; the score is the number of hours a network gets wrong. Ant colony mining lets a miner publish only a network that strictly beats the one it grew from, and each miner is ranked by its single best network.'],
  ['Who checks the scores?', 'Every Qubic node recomputes the score with the scorer in qubic/core (score_bpp9000.h). The top 676 miners become the computors that run Qubic. The Jetski ANN Explorer archives and re-verifies every solution, and qubic.church/bpp9000 runs one with the same rule in the browser.'],
  ['Where does live data come from?', 'From epoch 240 (18 November 2026) the Qubic core asks for the BTC price of the past hour; computors fetch the real data, agree on it as a quorum and feed it in. This is the Oracle Machine (oracle interface "Price" in qubic/core).'],
  ['Is the match rate on the page a forecast?', 'No. Until the live feed the network has no input: it is a rhythm fitted to the past year, so its match rate is a fit to history. Only live calls made before the hour closes, checked against the real close, count as forecasts; a coin is right half the time, so the number to watch is how far above 50% the network holds over many hours.'],
  ['What is the public experiment?', 'Come-from-Beyond asked the community to self-organise a group of traders who follow the hourly calls and report results, to make the test statistically significant with many witnesses. Participants join on qubic.church/bpp9000 (Qubic wallet or a name and secret code), set a starting capital and log their trades; BPP-9000 is scored only on its calls against the market, separately from people\'s journals. It is an experiment, not financial advice.'],
]

export function bppMarkdown(): string {
  return [
    '# BPP-9000: how it works',
    '',
    `> ${BPP_SUMMARY}`,
    '',
    `Page: ${BPP_URL}`,
    '',
    '## The flow',
    '',
    'A year of BTC hours (up or down) -> miners grow tiny ternary networks -> the ant colony keeps only better ones -> every node recomputes the score -> from 18 November: the Oracle Machine feeds the live BTC price -> the network calls the next hour, UP or DOWN -> the call is scored against the market.',
    '',
    '## One neuron',
    '',
    'Each tick a neuron reads its 3 wires (each up, down or unknown), looks up one of its 27 rules and turns up (+), down (-) or not sure (?). When the clock neuron fires, the answer neuron names an hour.',
    '',
    ...BPP_FAQ.flatMap(([q, a]) => [`## ${q}`, '', a, '']),
    '## Sources',
    '',
    '- qubic/core scorer: https://github.com/qubic/core/blob/main/src/mining/score_bpp9000.h',
    '- Oracle Machine price interface: https://github.com/qubic/core/blob/main/src/oracle_interfaces/Price.h',
    '- Qubic, ant colony mining: https://qubic.org/blog-detail/qubic-ant-colony-mining-live-epoch-228',
    '- Jetski ANN Explorer: https://annexplorer.jetskipool.ai/',
    `- Code of this page: https://github.com/daviduis777-oss/qubic-church/tree/main/apps/web/src/lib/bpp`,
    '',
    'Experiment. If you trade with real money, the responsibility is yours.',
    '',
  ].join('\n')
}
