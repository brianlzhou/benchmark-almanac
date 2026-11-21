// Zhipu tested web-assisted information seeking. Table 9 of the ChatGLM report publishes browser accuracy in percent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2406.12793';

const board: Leaderboard = {
  benchmark: 'all-tools-information-seeking-zai', static: 'paper',
  url: 'https://arxiv.org/abs/2406.12793',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.includes('GLM-4 All Tools') && t[0]?.includes('GPT-4'));
    const values = table?.find(r => r[0] === 'Browser' && r[1] === 'Information Seeking');
    if (!table || !values || values.length !== table[0].length || values.length < 4) throw new Error('Missing Information Seeking scores');
    return values.slice(2).map((v, i) => {
      if (!/^\d+(?:\.\d+)?$/.test(v)) throw new Error('Invalid browser accuracy');
      return { model: table[0][i+2], setting: table[1][i+2], harness: 'Browser', score: Number(v) };
    });
  },
};
export default board;
