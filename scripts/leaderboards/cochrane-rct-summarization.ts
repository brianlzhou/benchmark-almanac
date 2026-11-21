// The Cochrane benchmark tests generation of conclusions from trial abstracts.
// Table 2 reports test ROUGE-L. Table 3 counts the summaries meeting each manual
// assessment threshold among the 100 reviews scored by the first physician.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2008.11293';
const board: Leaderboard = {
  benchmark: 'cochrane-rct-summarization', feed, url: feed, static: 'paper',
  terms: 'The authors publish the evaluation under the terms linked at https://arxiv.org/abs/2008.11293.',
  stats: {devRougeL:{name:'Development ROUGE-L',unit:'score',better:'higher'},relevanceAbove2:{name:'Relevance above 2',unit:'%',better:'higher'},fluencyAbove3:{name:'Fluency above 3',unit:'%',better:'higher'},factualityAbove3:{name:'Factuality above 3',unit:'%',better:'higher'}},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0]?.slice(4).join('|') === 'ROUGE-L ( dev )|ROUGE-L ( test )');
    const manual = tables.find(t => t[0]?.join('|') === 'System variant|Relevance >2|Fluency >3|Factuality >3');
    if (!main || !manual) throw new Error('Missing Cochrane evaluation columns');
    const clean = (s: string) => s.replace(/\s*\\cdot\s*/g,' × ');
    return checked(main.slice(1).map(c => {
      const model = clean(c[0]);
      const r = manual.find(r => clean(r[0]) === model);
      if (!r) throw new Error('Missing physician assessment for ' + model);
      return {model, score: numberCell(c[5]), metrics: {devRougeL: numberCell(c[4]),
        relevanceAbove2: numberCell(r[1]), fluencyAbove3: numberCell(r[2]), factualityAbove3: numberCell(r[3])}};
    }), 5);
  },
};
export default board;
