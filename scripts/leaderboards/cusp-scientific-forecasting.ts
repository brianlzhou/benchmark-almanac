// CUSP tests forecasts of scientific results. The authors' Table 1 model-panel CSV
// reports accuracy, correlation, and rubric scores. Binary balanced accuracy comes first.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/SeanWu25/cusp-scientific-foresight/HEAD/results/A1_2_task_correlation/model_task_performance_table1panel.csv';
const board: Leaderboard = {
  benchmark: 'cusp-scientific-forecasting', url: 'https://github.com/SeanWu25/cusp-scientific-foresight', feed,
  terms: 'MIT license at https://github.com/SeanWu25/cusp-scientific-foresight/blob/HEAD/LICENSE.',
  aliases: {'Claude S4.5':'claude-sonnet-4-5'},
  headline: 'The authors report no overall score. The headline is binary balanced accuracy, the first metric in their results file.',
  parts: {binary:'Binary balanced accuracy', mcc:{name:'Binary MCC',unit:'score'}, raw:'Binary merged accuracy',
    mcq:'MCQ accuracy', frq:{name:'FRQ score',unit:'score',note:'Judge score from 0 to 10.'},
    dateScore:{name:'Date score',unit:'score',note:'Date prediction score from 0 to 1.'}},
  stats:{binaryItems:{name:'Binary items',unit:'count'},mcqItems:{name:'Multiple-choice questions',unit:'count'},frqItems:{name:'Free-response questions',unit:'count'},dateItems:{name:'Date items',unit:'count'}},
  async fetch() {
    const rows = parseCsv(await fetchText(feed)).map(row => {
      const value = (key: string) => {
        if (!row[key]?.trim() || !Number.isFinite(Number(row[key]))) throw new Error('Invalid CUSP column ' + key);
        return Number(row[key]);
      };
      if (!row.model) throw new Error('Missing CUSP model');
      const binary = value('binary_balanced_acc') * 100;
      return {model: row.model, setting: value('n_events') + ' events', score: binary,
        metrics: {binary, mcc:value('binary_mcc'), raw:value('binary_merged_acc_raw')*100,
          mcq:value('mcq_acc')*100, frq:value('frq_score_0to10'), dateScore:value('date_score'),
          binaryItems:value('n_binary_items'),mcqItems:value('n_mcq'),frqItems:value('n_frq'),dateItems:value('n_date')}};
    });
    return checked(rows, 9);
  },
};
export default board;
