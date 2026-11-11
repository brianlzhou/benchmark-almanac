// DuetBench Diagnosis: Decagon contributes the native Diagnosis Elo to Fireworks SII.
// This is the Diagnosis board, not the suite's editing/simulation pass rates or a computed SII index.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = 'https://fireworks.ai/specialized-intelligence-index/api/index.json';
type Metric = {value:number|null; unit:string};
const board: Leaderboard = {
  benchmark: 'duetbench', url: 'https://fireworks.ai/specialized-intelligence-index/benchmarks/customer-support/duetbench-diagnosis', feed: FEED,
  terms: 'Fireworks terms restrict automated extraction. Benchmark Almanac credits Decagon and Fireworks and links the published source.',
  aliases: {'Claude 5 Sonnet':'claude-sonnet-5'},
  async fetch() {
    const d = await fetchJson<{benchmarks:{id:string; results:{model:string; provider:string; metrics:Record<string,Metric>}[]}[]}>(FEED);
    const t = d.benchmarks.find(b => b.id === 'customer-support/duetbench-diagnosis');
    if (!t) throw new Error('DuetBench Diagnosis board missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.results) {
      const score = r.metrics.elo?.value;
      if (typeof score !== 'number' || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      for (const [k,v] of Object.entries(r.metrics)) if (k !== 'score' && typeof v.value === 'number') metrics[k] = v.value;
      rows.push({model:r.model, score, setting:r.provider.split('·').slice(1).join('·').trim() || undefined, cost:r.metrics.cost_per_task?.value ?? undefined, tokens:r.metrics.outputTokens?.value ?? undefined, metrics});
    }
    if (!rows.length) throw new Error('DuetBench Diagnosis scores missing');
    return rows;
  },
};
export default board;
