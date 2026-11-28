// JUP-Eval (Ortelan Research): multi-turn judgment under pushback across 156 scenarios and 6 dimensions.
// Source verbatim 95% interval definition (https://ortelan-lab.github.io/jup-eval-benchmark/):
//   "Intervals: Families resampled within each dimension, 2,000 draws, seed 1729"
//   "We evaluated 10 systems three times on every case, 4,680 graded trials in total."
// Headline 95% bootstrap confidence intervals (interval_low, interval_high) are wired to row.low / row.high.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://ortelan-lab.github.io/jup-eval-benchmark/';
const FEED = 'https://ortelan-lab.github.io/jup-eval-benchmark/scores.csv';

const r2 = (n: number) => Math.round(n * 100) / 100;

const board: Leaderboard = {
  benchmark: 'jup-eval',
  url: PAGE,
  feed: FEED,
  terms: 'Public CC BY 4.0 leaderboard CSV published on GitHub Pages by Ortelan Research.',
  parts: {
    honesty: { name: 'Honesty', group: 'Dimension' },
    agency: { name: 'Agency', group: 'Dimension' },
    pluralism: { name: 'Pluralism', group: 'Dimension' },
    care: { name: 'Care', group: 'Dimension' },
    integrity: { name: 'Integrity', group: 'Dimension' },
    action: { name: 'Action', group: 'Dimension' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`JUP-Eval scores.csv: ${res.status}`);
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error('JUP-Eval: empty CSV');

    const headers = lines[0].split(',').map((h) => h.trim());
    const idx = (name: string) => headers.indexOf(name);
    const iSys = idx('system');
    const iCases = idx('cases');
    const iTrials = idx('trials');
    const iComp = idx('composite');
    const iLo = idx('interval_low');
    const iHi = idx('interval_high');
    const dims = ['honesty', 'agency', 'pluralism', 'care', 'integrity', 'action'] as const;

    const rows: LeaderboardRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const model = cols[iSys];
      const score = Number(cols[iComp]);
      if (!model || !Number.isFinite(score)) continue;

      const metrics: Record<string, number> = {};
      for (const d of dims) {
        const ci = idx(d);
        if (ci !== -1 && Number.isFinite(Number(cols[ci]))) {
          metrics[d] = r2(Number(cols[ci]));
        }
      }

      const row: LeaderboardRow = {
        model,
        score: r2(score),
        metrics,
      };
      const cases = Number(cols[iCases]);
      const totalTrials = Number(cols[iTrials]);
      if (Number.isFinite(cases) && cases > 0 && Number.isFinite(totalTrials) && totalTrials > 0) {
        row.trials = Math.round(totalTrials / cases);
      }
      const lo = Number(cols[iLo]);
      const hi = Number(cols[iHi]);
      if (Number.isFinite(lo) && Number.isFinite(hi)) {
        row.low = r2(lo);
        row.high = r2(hi);
      }
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('JUP-Eval: parsed zero rows');
    return rows;
  },
};

export default board;
