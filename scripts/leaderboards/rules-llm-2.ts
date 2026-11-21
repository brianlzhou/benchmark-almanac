// RuLES 2.0 tests language models on rule-following safety scenarios.
// The score is the RuLES average across the benchmark's benign, basic and red-team cases.
// This importer reads Table 3 of the paper and keeps each scenario score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2311.04235';

const board: Leaderboard = {
  benchmark: 'rules-llm-2', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  parts: { benignHarmless: { name: 'Benign harmless', group: 'Scenario', unit: '%' }, benignHelpful: { name: 'Benign helpful', group: 'Scenario', unit: '%' }, basicHarmless: { name: 'Basic harmless', group: 'Scenario', unit: '%' }, basicHelpful: { name: 'Basic helpful', group: 'Scenario', unit: '%' }, redteamHarmless: { name: 'Redteam harmless', group: 'Scenario', unit: '%' }, redteamHelpful: { name: 'Redteam helpful', group: 'Scenario', unit: '%' } },
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables.find((rows) => rows[1]?.[0] === 'Rank' && rows[1]?.[1] === 'Model');
    if (!table) throw new Error('RuLES Table 3 missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      const model = cells[1]?.replace(/\s*∗$/, '').trim();
      if (!model) continue;
      const values = cells.slice(2).map(Number);
      if (values.length !== 7 || values.some((value) => !Number.isFinite(value))) continue;
      rows.push({ model, setting: cells[1]?.includes('∗') ? 'scenario instruction' : undefined, score: values[0], metrics: { benignHarmless: values[1], benignHelpful: values[2], basicHarmless: values[3], basicHelpful: values[4], redteamHarmless: values[5], redteamHelpful: values[6] } });
    }
    return checked(rows, 100);
  },
};

export default board;
