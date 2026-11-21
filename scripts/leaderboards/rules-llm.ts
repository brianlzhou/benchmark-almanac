// RuLES evaluates language models on benign, basic and red-team rule-following scenarios.
// The headline score is the paper's RuLES score on the full benchmark, with six scenario scores as metrics.
// This importer reads Table 3 in the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2311.04235';
const board: Leaderboard = {
  benchmark: 'rules-llm', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  parts: {
    benignHarmless: { name: 'Benign harmless', group: 'Scenario', unit: '%' }, benignHelpful: { name: 'Benign helpful', group: 'Scenario', unit: '%' },
    basicHarmless: { name: 'Basic harmless', group: 'Scenario', unit: '%' }, basicHelpful: { name: 'Basic helpful', group: 'Scenario', unit: '%' },
    redteamHarmless: { name: 'Redteam harmless', group: 'Scenario', unit: '%' }, redteamHelpful: { name: 'Redteam helpful', group: 'Scenario', unit: '%' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const table = paperTables(await paperHtml(URL)).map(grid).find((rows) => rows[1]?.[0] === 'Rank' && rows[1]?.[1] === 'Model');
    if (!table) throw new Error('RuLES results table missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      const raw = cells[1]?.trim();
      if (!raw) continue;
      const model = raw.replace(/\s*∗$/, '');
      const values = cells.slice(2).map(Number);
      if (values.length !== 7 || values.some((value) => !Number.isFinite(value))) throw new Error('RuLES results row changed');
      rows.push({ model, setting: raw.includes('∗') ? 'scenario instruction' : undefined, score: values[0], metrics: { benignHarmless: values[1], benignHelpful: values[2], basicHarmless: values[3], basicHelpful: values[4], redteamHarmless: values[5], redteamHelpful: values[6] } });
    }
    return checked(rows, 140);
  },
};
export default board;
