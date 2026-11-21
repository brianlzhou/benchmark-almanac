// Earnings-22 tests transcription of accented English earnings calls.
// Rev's transcripts README gives whole-dataset word error rates for two named recognizers.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/revdotcom/speech-datasets/HEAD/earnings22/transcripts/README.md';
const board: Leaderboard = {
  benchmark: 'earnings-22', url: 'https://github.com/revdotcom/speech-datasets/tree/main/earnings22/transcripts', feed,
  terms: 'Rev publishes the results in its speech-datasets repository. https://github.com/revdotcom/speech-datasets',
  async fetch() {
    const section = (await fetchText(feed)).split('## The _Earnings22_ Dataset')[1]?.split('##')[0];
    const table = section?.trim().split('\n').map(line => line.trim().split('|').slice(1,-1));
    if (!table || table.length !== 3 || table[2][0] !== '_Earnings22_' ||
        table[0].length !== table[2].length) throw new Error('Rev Earnings22 table changed');
    return checked(table[0].flatMap((model, i) =>
      !model || /^Provider \d+$/.test(model) ? [] : [{model, score: numberCell(table[2][i])}]), 2);
  },
};
export default board;
