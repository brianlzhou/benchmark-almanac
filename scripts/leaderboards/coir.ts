// CoIR tests retrieval of programming-related text and code. The official board ranks
// models by the published Avg across ten datasets and gives model size in millions.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://archersama.github.io/coir/';
const datasets = ['Apps', 'CosQA', 'Synthetic Text2sql', 'CodeSearchNet', 'CodeSearchNet-CCR', 'CodeTrans-Contest',
  'CodeTrans-DL', 'StackOverFlow QA', 'CodeFeedBack-ST', 'CodeFeedBack-MT'];
const board: Leaderboard = {
  benchmark: 'coir', url: feed, feed,
  terms: 'The CoIR team publishes these results and links each model at https://archersama.github.io/coir/.',
  parts: Object.fromEntries(datasets.map(d => [d,d])),
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') ===
      ['Rank','Model','Model Size (Million Parameters)',...datasets,'Avg'].join('|'));
    if (!t) throw new Error('Missing CoIR board columns');
    return checked(t.slice(1).map(row => {
      const c = row.map(cell => cell.text);
      return {model: c[1], score: numberCell(c[13]), params: c[2] === '-' ? undefined : numberCell(c[2])/1000,
        metrics: Object.fromEntries(datasets.map((d,i) => [d,numberCell(c[i+3])]))};
    }), 13);
  },
};
export default board;
