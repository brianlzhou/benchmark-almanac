// Redtape tests whether language models abstain when a requested fact is missing.
// The corrected corpus's primary score is abstention accuracy, with intervals in the same score unit.
// This importer reads all published metrics from the authors' corrected-results tables in the README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = 'https://raw.githubusercontent.com/JakPot42/redtape/main/README.md';

function parseCell(cell: string | undefined) {
  if (!cell) return {};
  const acc = cell.match(/^([\d.]+)\s*\((\d+)\/(\d+)\)\s*\[([\d.]+),\s*([\d.]+)\]/);
  if (acc) return { val: Number(acc[1]), correct: Number(acc[2]), total: Number(acc[3]), low: Number(acc[4]), high: Number(acc[5]) };
  const pair = cell.match(/^([\d.]+)\s*\(n=(\d+)\)/);
  if (pair) return { val: Number(pair[1]) };
  const pct = cell.match(/\(([\d.]+)%\)/);
  if (pct) return { pct: Number(pct[1]) };
  const trunc = cell.match(/^(\d+)\s*\/\s*[\d,]+$/);
  if (trunc) return { count: Number(trunc[1]) };
  return {};
}

const board: Leaderboard = {
  benchmark: 'redtape',
  url: 'https://github.com/JakPot42/redtape',
  feed: FEED,
  terms: 'The authors publish the repository under its stated license. Cite the repository and follow its terms. https://github.com/JakPot42/redtape',
  stats: {
    correct: { name: 'Correct abstention decisions', unit: 'count', better: 'higher' },
    exactMatch: { name: 'Exact-match accuracy (determinate)', unit: 'score', better: 'higher', note: 'Fraction correct on determinate cases from 0 to 1.' },
    pairConsistency: { name: 'Pair consistency', unit: 'score', better: 'higher', note: 'Fraction of matched pairs answered consistently from 0 to 1.' },
    exactFactRate: { name: 'Named withheld fact in exact form', unit: '%', better: 'higher' },
    hallucinatedFactRate: { name: 'Named a fact never withheld', unit: '%', better: 'lower' },
    truncatedResponses: { name: 'Truncated responses', unit: 'count', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const tables = markdownTables(source).filter((t) => t.some((r) => r[0] === 'abstention accuracy'));
    if (!tables.length) throw new Error('Redtape corrected results tables missing');
    const rows: LeaderboardRow[] = [];
    for (const t of tables) {
      const models = t[0].slice(1).filter(Boolean);
      const byMetric = new Map(t.slice(1).map((r) => [r[0], r.slice(1)]));
      const abstRow = byMetric.get('abstention accuracy');
      if (!abstRow) continue;
      models.forEach((model, i) => {
        const a = parseCell(abstRow[i]);
        if (a.val === undefined || a.correct === undefined || a.total === undefined) return;
        const metrics: Record<string, number> = { correct: a.correct };
        const em = parseCell(byMetric.get('exact-match (determinate)')?.[i]);
        if (em.val !== undefined) {
          metrics.exactMatch = em.val;
          if (em.low !== undefined) metrics.exactMatchLow = em.low;
          if (em.high !== undefined) metrics.exactMatchHigh = em.high;
        }
        const pc = parseCell(byMetric.get('pair-consistency')?.[i]);
        if (pc.val !== undefined) metrics.pairConsistency = pc.val;
        const ef = parseCell(byMetric.get('named the fact in exact form')?.[i]);
        if (ef.pct !== undefined) metrics.exactFactRate = ef.pct;
        const hf = parseCell(byMetric.get('named a fact never withheld')?.[i]);
        if (hf.pct !== undefined) metrics.hallucinatedFactRate = hf.pct;
        const tr = parseCell(byMetric.get('truncated responses')?.[i]);
        if (tr.count !== undefined) metrics.truncatedResponses = tr.count;
        rows.push({ model, score: a.val, low: a.low, high: a.high, trials: a.total, metrics });
      });
    }
    return checked(rows, 3);
  },
};
export default board;
