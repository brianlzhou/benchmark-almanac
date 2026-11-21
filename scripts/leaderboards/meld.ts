// MELD tests emotion recognition in multiparty conversations. The makers' updated baseline table gives weighted F1 for seven emotions.
// The second MELD measure is weighted F1 on the three sentiment classes.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { checked, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://github.com/declare-lab/conv-emotion';
const feed = 'https://raw.githubusercontent.com/declare-lab/conv-emotion/master/README.md';
const board: Leaderboard = {
  benchmark: 'meld', url, feed,
  terms: 'The authors release the repository under the MIT License at https://github.com/declare-lab/conv-emotion/blob/master/LICENSE.',
  parts: { sentiment: 'Sentiment (3 classes)', emotion: 'Emotion (7 classes)' },
  async fetch() {
    const t = tables(await fetchText(feed)).map(grid).find(t => t[0]?.[4] === 'MELD' && t[0]?.[5] === 'MELD' &&
      t[1]?.[4] === 'W-Avg F1 (3-cls)' && t[1]?.[5] === 'W-Avg F1 (7-cls)');
    if (!t) throw new Error('Missing MELD weighted F1 columns');
    return checked(t.slice(2).map(row => {
      const emotion = numberCell(row[5]);
      return { model: row[0], score: emotion, metrics: { emotion, sentiment: numberCell(row[4]) } };
    }), 3);
  },
};
export default board;
