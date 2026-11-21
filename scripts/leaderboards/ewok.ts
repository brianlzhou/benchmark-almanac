// EWoK measures whether a language model chooses the statement consistent with a given context.
// Tables 2 and 4 give mean accuracy for two-shot prompting and log-probability scoring.
// Table 4 also reports the observed range across five dataset versions.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2405.09605';
const percent = (cell: string) => Number((100 * numberCell(cell)).toFixed(2));
const board: Leaderboard = {
  benchmark: 'ewok',
  static: 'paper',
  url: feed,
  feed,
  terms: 'Public paper tables credited to the EWoK authors. Dataset terms at https://github.com/ewok-core/ewok-paper/blob/main/TERMS_OF_USE.txt.',
  aliases: {
    'GPT-4 Turbo (2024-04-09)': 'gpt-4-turbo-apr-2024',
    'Claude 3.5 Sonnet (2024-06-20)': 'claude-3-5-sonnet',
    'Qwen2 Instruct (72B)': 'qwen2-72b',
    'Claude 3 Opus (2024-02-29)': 'claude-3-opus',
    'GPT-4o (2024-05-13)': 'gpt-4o-may-2024',
    'GPT-4o mini (2024-07-18)': 'gpt-4o-mini',
    'Claude 3 Sonnet (2024-02-29)': 'claude-3-sonnet',
    'Claude 3 Haiku (2024-03-07)': 'claude-3-haiku',
    'Claude 3.5 Haiku (2024-10-22)': 'claude-3-5-haiku',
    gpt2_xl: 'gpt-2-1-5b',
    'gemma_1.1_2b': 'gemma-1-1-2b-it',
    'gemma_1.1_7b': 'gemma-1-1-7b-it',
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const prompt = tables.find(t => t[0].join('|') === 'Model|Mean Accuracy');
    const log = tables.find(t => t[0].join('|') === 'Model|Mean LogProbs Accuracy|Range');
    if (!prompt || !log) throw new Error('Missing EWoK mean accuracy tables');
    return [
      ...checked(prompt.slice(1).map(([model, value]) => ({
        model, score: percent(value), setting: 'Two-shot binary choice',
      })), 15),
      ...checked(log.slice(1).filter(([model]) => model !== 'human').map(([model, value, range]) => {
        const [min, max] = range.split('-').map(percent);
        if (!Number.isFinite(max)) throw new Error('Missing EWoK accuracy range');
        return { model, score: percent(value), setting: 'Log probabilities', trials: 5, low: min, high: max };
      }), 21),
    ];
  },
};
export default board;
