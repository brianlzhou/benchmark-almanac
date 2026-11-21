// SEvenLLM evaluates multilingual understanding and generation in English and Chinese.
// Table 6 reports the average score across the four language and task combinations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2405.03446';
const board: Leaderboard = {
  benchmark: 'sevenllm', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2405.03446',
  stats: { understandingAverage: { name: 'Understanding average', unit: '%', better: 'higher' }, generationAverage: { name: 'Generation average', unit: '%', better: 'higher' } },
  parts: { understandingEnglish: 'Understanding English', generationEnglish: 'Generation English', understandingChinese: 'Understanding Chinese', generationChinese: 'Generation Chinese' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[0] === 'Model' && t[0]?.[9] === 'Avg.');
    if (!table) throw new Error('SEvenLLM results table missing');
    const rows: LeaderboardRow[] = table.slice(1).map(row => {
      if (row.length < 10 || !row.slice(3, 10).every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid SEvenLLM row');
      return { model: row[0], setting: `${row[1]} ${row[2]}`, score: Number(row[9]), metrics: { understandingEnglish: Number(row[3]), generationEnglish: Number(row[4]), understandingChinese: Number(row[5]), generationChinese: Number(row[6]), understandingAverage: Number(row[7]), generationAverage: Number(row[8]) } };
    });
    return checked(rows, 10);
  },
};
export default board;
