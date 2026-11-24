// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 4 evaluates exact answer-set matches on 1,800 ambiguous and 1,800 non-ambiguous questions.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2511.01323';
const keys = ['nonAmbiguousPrecision','nonAmbiguousRecall','nonAmbiguous','ambiguousPrecision','ambiguousRecall','ambiguous'];
const board: Leaderboard = {
  benchmark: 'deepambigqa', static: 'paper', url, feed: url,
  terms: 'The authors publish Table 4 under the license linked at https://arxiv.org/abs/2511.01323.',
  headline: 'The headline is the plain mean of exact-match rates for ambiguous and non-ambiguous questions.',
  aliases: {'DS-R1-distill-1.5B':'deepseek-r1-distill-qwen-1-5b','DS-R1-distill-7B':'deepseek-r1-distill-qwen-7b'},
  parts: {nonAmbiguous:'Non-ambiguous questions', ambiguous:'Ambiguous questions'},
  stats: Object.fromEntries(['Non-ambiguous precision','Non-ambiguous recall','Ambiguous precision','Ambiguous recall']
    .map((name,i) => [[keys[0],keys[1],keys[3],keys[4]][i], {name,unit:'%',better:'higher' as const}])),
  async fetch() {
    const t = paperTables(await paperHtml(url)).map(grid).find(t => t[0]?.[1] === 'Non-ambig. Question'
      && t[0]?.[4] === 'Ambig. Question' && t[1]?.join('|') === 'Model|P|R|EM|P|R|EM' && /^0\.\d+$/.test(t[2]?.[1]));
    if (!t) throw new Error('Table 4 columns missing');
    return checked(t.slice(2).map(([model,...cells]) => {
      const metrics = Object.fromEntries(keys.map((k,i) => [k,100*numberCell(cells[i])]));
      return {model, metrics, score:(metrics.nonAmbiguous+metrics.ambiguous)/2};
    }),10);
  },
};
export default board;
