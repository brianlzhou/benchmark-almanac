// FQuAD 1.1 tests French extractive question answering. Tables 9 and 10 of the revised paper
// report test F1 and exact match for models trained on each dataset version.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2002.06071v2';
const board: Leaderboard = {
  benchmark: 'fquad-1-1', static: 'paper', url: feed + '#S7.T9', feed,
  terms: 'The authors publish the revised paper under CC BY 4.0.',
  async fetch() {
    const data = tables(await fetchText(feed)).filter(t => t[0]?.[1]?.text === 'FQuAD1.1-test' && t[1]?.[0]?.text === 'Model');
    if (data.length !== 2) throw new Error('Expected both FQuAD 1.1 test tables');
    return data.flatMap((table, i) => {
      if (table[1].map(c => c.text).join('|') !== 'Model|F1|EM|F1|EM' || table.length < (i === 0 ? 10 : 8)) throw new Error('FQuAD test columns or rows missing');
      return table.slice(2).filter(r => r[0].text !== 'Human Perf.').map(r => {
        const [score, exactMatch, devF1, devExactMatch] = r.slice(1).map(c => Number(c.text));
        if (r.length !== 5 || r.some(c => !c.text) || ![score, exactMatch, devF1, devExactMatch].every(Number.isFinite)) throw new Error('Invalid FQuAD result');
        return { model: r[0].text, setting: i === 0 ? 'FQuAD1.1-train' : 'FQuAD1.0-train', score, metrics: { exactMatch, devF1, devExactMatch } };
      });
    });
  },
};
export default board;
