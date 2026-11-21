// LegalBench.PT tests Portuguese legal knowledge across 31 fields and six question types.
// Table 2 reports overall accuracy across all questions for eight language models.
// Table 19 supplies the six question-type scores as metrics.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2502.16357';
const board: Leaderboard = {
  benchmark: 'legalbench-pt', url: 'https://github.com/deep-spin/LegalBench.PT', feed, static: 'paper',
  terms: 'The authors publish the paper and dataset under their listed repository and anthology terms.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const overall = tables.find(t => t[0]?.join('|') === 'Fields of Law|GPT- 4o|GPT- 4o-mini|Claude- 3-Opus|Claude- 3.5-Sonnet|Llama- 3.1-8B|Llama- 3.1-70B|Llama- 3.1-405B|Mixtral- 8x7B');
    const types = tables.find(t => t[0]?.join('|') === 'Models|Multiple-choice|Cloze tasks|Case analysis|True/False|Multiple selection|Matching questions');
    if (!overall || !types) throw new Error('Missing LegalBench.PT tables');
    const models = overall[overall.length - 1].slice(1);
    const names = overall[0].slice(1);
    return checked(names.map((model, i) => {
      const metrics: Record<string, number> = {};
      for (const row of overall.slice(1)) {
        if (row[0] === 'Overall') continue;
        metrics[row[0].replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => c?.toUpperCase() ?? '')] = numberCell(row[i + 1]);
      }
      const typeRow = types.find(r => r[0].replace(/[- ]/g, '') === model.replace(/[- ]/g, ''));
      if (!typeRow) throw new Error('Missing LegalBench.PT type row');
      for (let j = 1; j < typeRow.length; j++) metrics['type' + j] = numberCell(typeRow[j]);
      return { model, score: numberCell(models[i]), metrics };
    }), 8);
  },
};
export default board;
