// ASCEND tests speech transcription in Mandarin-English conversations.
// Table 12 compares three wav2vec 2.0 models on the test set by mixed error rate, counting Chinese characters and English words.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2112.06223';
export default {
  benchmark: 'ascend', url: feed, feed, static: 'paper',
  terms: 'The paper and license are at https://arxiv.org/abs/2112.06223',
  stats:{'Test CER':{name:'Test character error rate',unit:'%',better:'lower'},'Validation MER':{name:'Validation mixed error rate',unit:'%',better:'lower'},'Validation CER':{name:'Validation character error rate',unit:'%',better:'lower'}},
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.join('|') === 'Pre-training language|MER (%)|CER (%)|MER (%)|CER (%)');
    if (!table || table[0].slice(1).join('|') !== 'Validation|Validation|Test|Test') throw new Error('Missing Table 12');
    return checked(table.slice(2).map(([language,vm,vc,tm,tc]) => ({
      model: language + ' pre-trained wav2vec 2.0', score: numberCell(tm),
      metrics: { 'Test CER': numberCell(tc), 'Validation MER': numberCell(vm), 'Validation CER': numberCell(vc) },
    })),3);
  },
} satisfies Leaderboard;
