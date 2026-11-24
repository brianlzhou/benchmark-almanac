// PhysGym main results from arXiv:2507.15550 HTML Table 1 (NeurIPS 2025 Datasets and Benchmarks).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { text } from '../lib/html.ts';

const FEED = 'https://arxiv.org/html/2507.15550';
const URL = 'https://arxiv.org/abs/2507.15550';

function parseNum(cell: string): number | undefined {
  const m = cell.match(/-?\d+(?:\.\d+)?/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

const board: Leaderboard = {
  benchmark: 'physgym',
  static: 'paper',
  url: URL,
  feed: FEED,
  terms: 'Results are read from the public arXiv HTML paper (arXiv:2507.15550, Table 1).',
  headline: 'Success rate across 97 interactive physics discovery environments under four controlled prior-knowledge levels (L1 full context through L4 anonymized variables).',
  stats: {
    experiments: { name: 'Average experiments', unit: 'count', better: 'lower', note: 'Mean number of experiments run on successful tasks.' },
    tests: { name: 'Average tests', unit: 'count', better: 'lower', note: 'Mean number of tests run on successful tasks.' },
    turns: { name: 'Average turns', unit: 'count', better: 'lower', note: 'Mean number of interaction turns on successful tasks.' },
    uniqueHypotheses: { name: 'Unique hypotheses', unit: 'count', note: 'Mean unique hypotheses proposed on successful tasks.' },
    totalHypotheses: { name: 'Total hypotheses', unit: 'count', note: 'Mean total hypotheses proposed on successful tasks.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await paperHtml(FEED);
    const figures = [...html.matchAll(/<figure[^>]*class="[^"]*ltx_table[^"]*"[^>]*>[\s\S]*?<\/figure>/gi)].map((m) => m[0]);
    const mainFig = figures.find((f) => /Results overview of LLMs by Prior Level/i.test(f) || (/Experiments/i.test(f) && /Total Hyps/i.test(f)));
    if (!mainFig) throw new Error('PhysGym Table 1 not found in arXiv HTML');

    const rows: LeaderboardRow[] = [];
    let currentModel = '';

    for (const tr of mainFig.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => text(c[1]));
      if (cells.length < 7) continue;

      let offset = 0;
      if (cells.length >= 8) {
        if (/^Model$/i.test(cells[0])) continue;
        currentModel = cells[0].trim();
        offset = 1;
      }

      const mode = cells[offset]?.trim();
      if (!currentModel || !/^L[1-4]$/.test(mode ?? '')) continue;

      const score = parseNum(cells[offset + 1]);
      if (score === undefined) continue;

      const metrics: Record<string, number> = {};
      const experiments = parseNum(cells[offset + 2]);
      const tests = parseNum(cells[offset + 3]);
      const turns = parseNum(cells[offset + 4]);
      const uniqueHypotheses = parseNum(cells[offset + 5]);
      const totalHypotheses = parseNum(cells[offset + 6]);
      if (experiments !== undefined) metrics.experiments = experiments;
      if (tests !== undefined) metrics.tests = tests;
      if (turns !== undefined) metrics.turns = turns;
      if (uniqueHypotheses !== undefined) metrics.uniqueHypotheses = uniqueHypotheses;
      if (totalHypotheses !== undefined) metrics.totalHypotheses = totalHypotheses;

      rows.push({
        model: currentModel,
        score,
        setting: `Prior level ${mode}`,
        metrics,
      });
    }

    if (rows.length < 20) {
      throw new Error(`Expected at least 20 rows in PhysGym Table 1, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
