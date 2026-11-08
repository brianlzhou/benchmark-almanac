// EnterpriseClawBench. frontisai.github.io/EnterpriseClawBench fills its leaderboard from ecb-data.js, which
// sets window.ECB_LEADERBOARD_DATA to a JSON object: per configuration ("codex/gpt-5.5") the harness, the
// model, completion counts, the primary score (strict failure-zero score, 0 to 1, the board's ranking and
// the number in the paper's figures) and cost in RMB. The primary score is the score, as a percent. Costs
// are in RMB, not US dollars, so they remain explicitly labeled RMB metrics. The median time per task (medianSec, the table's
// Median Time) is kept as metrics.latency in seconds, for the page's "Score vs Runtime" scatter.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const PAGE = 'https://frontisai.github.io/EnterpriseClawBench/';
const FEED = `${PAGE}ecb-data.js`;

interface Data {
  combos: { model?: string; harnessLabel?: string; primaryScore?: number; medianSec?: number | null; costRmb?:number; costPerCompleted?:number }[];
}

const board: Leaderboard = {
  benchmark: 'enterpriseclawbench',
  url: PAGE,
  feed: `${FEED} (combos[].primaryScore)`,
  terms: 'Static data file on the project site (GitHub Pages, no robots.txt rules); the site states no terms.',
  chart: {
    title: 'Score vs Runtime',
    note: 'Each point is one model-harness configuration: the primary score against the median time per task.',
    x: { key: 'latency', label: 'Median time', unit: 's', better: 'lower' },
    y: { key: 'score', label: 'Primary score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const js = await fetchText(FEED);
    const data = jsonAt<Data>(js, js.indexOf('{'));
    const rows: LeaderboardRow[] = [];
    for (const c of data.combos) {
      if (!c.model || typeof c.primaryScore !== 'number') continue;
      rows.push({
        model: c.model,
        harness: c.harnessLabel,
        score: Number((c.primaryScore * 100).toFixed(2)),
        metrics: {...(typeof c.medianSec==='number'&&c.medianSec>0?{latency:Math.round(c.medianSec)}:{}),...(Number.isFinite(c.costRmb)?{'run cost (RMB)':c.costRmb!}:{}),...(Number.isFinite(c.costPerCompleted)?{'cost per completed task (RMB)':c.costPerCompleted!}:{})},
      });
    }
    return rows;
  },
};
export default board;
