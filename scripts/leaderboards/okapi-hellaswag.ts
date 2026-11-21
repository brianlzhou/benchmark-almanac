// Okapi HellaSwag tests multilingual commonsense sentence completion.
// The score is the paper's Average accuracy across the 26 translated languages.
// This importer reads Table 4, including its resource-group averages and final Average row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2307.16039';
const board: Leaderboard = {
  benchmark: 'okapi-hellaswag', static: 'paper', url: FEED, feed: FEED, terms: PAPER_TERMS,
  headline: 'The paper reports an Average accuracy across its 26 translated languages.',
  async fetch() {
    const table = grid(paperTables(await paperHtml(FEED))[3]);
    const header = table[0];
    if (header?.[1] !== 'Language' || header.at(-1) !== 'RLHF') throw new Error('Okapi HellaSwag table changed');
    const average = table.find(row => row[1] === 'Average');
    if (!average) throw new Error('Okapi HellaSwag Average row missing');
    const labels = ['BLOOM 7B', 'BLOOMZ 7B', 'BLOOM 7B SFT', 'BLOOM 7B RLHF'];
    const rows = labels.map((model, i) => ({ model, score: Number(average[i + 2]), metrics: { highResource: Number(table.find(r => r[1] === 'Ave Group' && r[0] === 'High-Resource')?.[i + 2]), mediumResource: Number(table.find(r => r[1] === 'Ave Group' && r[0] === 'Medium-Resource')?.[i + 2]), lowResource: Number(table.find(r => r[1] === 'Ave Group' && r[0] === 'Low-Resource')?.[i + 2]) } }));
    return checked(rows, 4);
  },
};
export default board;
