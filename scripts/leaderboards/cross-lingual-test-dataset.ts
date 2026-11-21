// The Cross-lingual Test Dataset measures image retrieval recall across 11 languages.
// The source reports no overall score. The headline is the plain mean of the 11 language scores, computed here.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2012.05107';
const board: Leaderboard = {
  benchmark: 'cross-lingual-test-dataset', static: 'paper',
  url: 'https://arxiv.org/abs/2012.05107', feed: FEED,
  terms: 'The authors publish the paper under the arXiv terms of use. https://arxiv.org/abs/2012.05107',
  headline: 'The source reports no overall score, so this is the plain mean of its 11 language Recall@10 scores.',
  parts: Object.fromEntries(['en', 'de', 'fr', 'it', 'es', 'ru', 'ja', 'zh', 'pl', 'tr', 'ko'].map((name) => [name, { name: name.toUpperCase(), group: 'Language' }])),
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find((t) => t[0]?.[0] === 'Model' && t[0]?.[1] === 'en');
    if (!table) throw new Error('XTD10 results table missing');
    const keys = table[0].slice(1);
    const rows = table.slice(1).map((row) => {
      const values = row.slice(1).map(Number);
      return { model: row[0], score: values.reduce((a, b) => a + b, 0) / values.length, metrics: Object.fromEntries(keys.map((key, i) => [key, values[i]])), flag: 'computed-mean' } as LeaderboardRow;
    });
    return checked(rows, 4);
  },
};
export default board;
