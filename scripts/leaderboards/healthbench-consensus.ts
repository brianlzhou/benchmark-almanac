// HealthBench Consensus measures how often responses meet criteria agreed on by physicians. Table 8 reports the overall rate and each criterion as fractions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2505.08775';

const board: Leaderboard = {
  benchmark: 'healthbench-consensus', static: 'paper',
  url: 'https://arxiv.org/abs/2505.08775',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.slice(0, 3).join('|') === 'Theme|Consensus Category|Consensus Criterion' && t[1]?.[0] === 'Overall score');
    if (!table || table.length < 39 || table[0].length < 12) throw new Error('HealthBench Consensus table is incomplete');
    const pct = (s: string) => {
      if (!/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(s)) throw new Error(`Invalid HealthBench fraction: ${s}`);
      return Math.round(Number(s) * 10000) / 100;
    };
    const rows: LeaderboardRow[] = table[0].slice(3).map((model, i) => ({
      model, score: pct(table[1][i + 3]), metrics: {},
    }));
    board.parts = {};
    let theme = '', category = '';
    for (const [nextTheme, nextCategory, criterion, ...scores] of table.slice(2)) {
      theme = nextTheme || theme;
      category = nextCategory || category;
      const name = category + ' / ' + criterion;
      const key = [theme, category, criterion].join(' ').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (!criterion || board.parts[key] || scores.length !== rows.length) throw new Error('Invalid HealthBench criterion');
      board.parts[key] = { name, group: theme };
      rows.forEach((row, i) => { row.metrics![key] = pct(scores[i]); });
    }
    return rows;
  },
};
export default board;
