// OpenFrontiers-Bench tests whether agents can rediscover mathematical conjectures from public sources.
// The paper reports no overall score, so the headline is the plain mean of clean pass rates in conditions A, B and C.
// This importer reads Table 3, Results on the 40 solved items of HQ-50, from the paper HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2610.37739';
const fraction = (value: string) => {
  const m = value.match(/^(\d+)\/(\d+)/);
  if (!m) throw new Error(`Invalid OpenFrontiers-Bench fraction: ${value}`);
  return { count: Number(m[1]), total: Number(m[2]), rate: Number(m[1]) / Number(m[2]) * 100 };
};
const board: Leaderboard = {
  benchmark: 'openfrontiers-bench', static: 'paper', url: FEED, feed: FEED, terms: PAPER_TERMS,
  headline: 'The paper reports no overall score, so this is the plain mean of clean pass rates in conditions A, B and C.',
  parts: { A: 'A: closed-book', B: 'B: frozen retrieval', C: 'C: live web' },
  stats: { aAll: { name: 'A items solved', unit: 'count' }, aClean: { name: 'A clean pass rate', unit: '%', better: 'higher' }, bAll: { name: 'B items solved', unit: 'count' }, bClean: { name: 'B clean pass rate', unit: '%', better: 'higher' }, cAll: { name: 'C items solved', unit: 'count' }, cClean: { name: 'C clean pass rate', unit: '%', better: 'higher' } },
  async fetch() {
    const table = grid(paperTables(await paperHtml(FEED))[2]);
    if (table[0]?.[0] !== '' || table[0]?.[2] !== 'A: closed-book') throw new Error('OpenFrontiers-Bench results table changed');
    let setting = '';
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(3)) {
      if (/protocol/.test(row[0] ?? '')) { setting = row[0]; continue; }
      if (!row[0] || row[0] === 'Model') continue;
      const a = fraction(row[3]), b = fraction(row[5]), c = fraction(row[7]);
      rows.push({ model: row[0], setting, score: Number(((a.rate + b.rate + c.rate) / 3).toFixed(4)), metrics: { aAll: Number(row[2]), aClean: a.rate, bAll: Number(row[4]), bClean: b.rate, cAll: Number(row[6]), cClean: c.rate } });
    }
    return checked(rows, 10);
  },
};
export default board;
