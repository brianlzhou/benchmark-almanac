// SmartPlay evaluates language-model agents across seven games and planning settings.
// The source has no overall score, so the headline is the plain mean of its seven game scores.
// This importer reads Table 2 of the benchmark paper and keeps each game score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2310.01557';
const games = ['bandit', 'rps', 'hanoi', 'messengerL1', 'messengerL2', 'crafter', 'minecraft'];

const board: Leaderboard = {
  benchmark: 'smartplay', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  headline: 'The paper reports no overall score, so this is the plain mean of its seven game scores.',
  parts: Object.fromEntries(games.map((name) => [name, { name, group: 'Game', unit: 'score' }])),
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables.find((rows) => rows[0]?.[0] === 'LLM' && rows[0]?.length === 8 && rows.some((row) => row[0] === 'GPT-4-0613'));
    if (!table) throw new Error('SmartPlay Table 2 missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[0];
      if (!model || model === 'Human Baseline') continue;
      const scores = cells.slice(1).map(Number);
      if (scores.length !== 7 || scores.some((score) => !Number.isFinite(score))) throw new Error(`SmartPlay invalid row: ${model}`);
      rows.push({ model, score: scores.reduce((sum, value) => sum + value, 0) / scores.length, metrics: Object.fromEntries(games.map((game, index) => [game, scores[index]])) });
    }
    return checked(rows, 8);
  },
};

export default board;
