// InFoBench measures the share of decomposed instruction requirements satisfied. Tables 5 and 8 report overall rates under two judges.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2401.03601';

const board: Leaderboard = {
  benchmark: 'infobench', static: 'paper',
  url: 'https://arxiv.org/abs/2401.03601',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"gpt-4-1106-preview": "gpt-4-turbo-nov-2023", "gpt-3.5-turbo-1106": "gpt-3-5-turbo-nov-2023", "gemini-pro": "gemini-1-0-pro", "Llama-2-70b-chat": "llama-2-70b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const rows: LeaderboardRow[] = [];
    board.parts = { easy: 'Easy Set', hard: 'Hard Set' };
    for (const [heading, judge] of [['Model Name', 'gpt-4-0314'], ['Model', 'gpt-4-1106-preview']]) {
      const table = tables.find(t => t[0]?.join('|') === heading + '|Easy Set|Hard Set|Overall');
      if (!table || table.length < 7) throw new Error('Missing InFoBench judge comparison');
      for (const [model, easy, hard, overall] of table.slice(1)) {
        if ([easy, hard, overall].some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid InFoBench DRFR');
        rows.push({ model, setting: 'Judge: ' + judge, score: Number(overall), metrics: { easy: Number(easy), hard: Number(hard) } });
      }
    }
    return rows;
  },
};
export default board;
