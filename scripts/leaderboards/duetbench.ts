// DuetBench Diagnosis: Decagon contributes the native Diagnosis Elo to Fireworks SII.
// This is the Diagnosis board, not the suite's editing/simulation pass rates or a computed SII index.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = 'https://fireworks.ai/specialized-intelligence-index/api/index.json';
type Metric = {value:number|null; unit:string};
const board: Leaderboard = {
  benchmark: 'duetbench', parts: {
  taskOutcome: { name: 'Task outcome', group: 'Dimension' },
  investigation: { name: 'Investigation', group: 'Dimension' },
  toolUse: { name: 'Tool use', group: 'Dimension' },
  communication: { name: 'Communication', group: 'Dimension' },
}, url: 'https://fireworks.ai/specialized-intelligence-index/benchmarks/customer-support/duetbench-diagnosis', feed: FEED,
  terms: 'Fireworks terms restrict automated extraction. Benchmark Almanac credits Decagon and Fireworks and links the published source.',
  aliases: {'Claude 5 Sonnet':'claude-sonnet-5'},
  chart: { title: 'DuetBench Diagnosis Elo versus cost', x: { key: 'cost', label: 'Model cost per task', unit: '$', better: 'lower' }, y: { key: 'score', label: 'Diagnosis Elo', unit: 'elo', better: 'higher' } },
  async fetch() {
    const d = await fetchJson<{benchmarks:{id:string; results:{model:string; provider:string; raw?:{ci?:{lo:number;hi:number}}; metrics:Record<string,Metric>}[]}[]}>(FEED);
    const t = d.benchmarks.find(b => b.id === 'customer-support/duetbench-diagnosis');
    if (!t) throw new Error('DuetBench Diagnosis board missing');
    const skip = new Set(['score', 'elo', 'cost_per_task', 'duration_per_task', 'outputTokens', 'cachedInput', 'stalenessDays']);
    const rows: LeaderboardRow[] = [];
    for (const r of t.results) {
      const score = r.metrics.elo?.value;
      if (typeof score !== 'number' || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      for (const [k,v] of Object.entries(r.metrics)) if (!skip.has(k) && typeof v.value === 'number') metrics[k] = v.value;
      const dur = r.metrics.duration_per_task?.value;
      if (typeof dur === 'number' && Number.isFinite(dur)) metrics.latency = dur;
      const cached = r.metrics.cachedInput?.value;
      if (typeof cached === 'number' && Number.isFinite(cached)) metrics.cachedTokens = cached;
      if (Number.isFinite(metrics.uncachedInput) && Number.isFinite(metrics.cachedTokens)) metrics.inputTokens = metrics.uncachedInput + metrics.cachedTokens;
      rows.push({model:r.model, score, low:r.raw?.ci?.lo, high:r.raw?.ci?.hi, setting:r.provider.split('·').slice(1).join('·').trim() || undefined, cost:r.metrics.cost_per_task?.value ?? undefined, tokens:r.metrics.outputTokens?.value ?? undefined, metrics});
    }
    if (!rows.length) throw new Error('DuetBench Diagnosis scores missing');
    return rows;
  },
  stats: {
    completionRate: { name: 'Completion rate', unit: '%', better: 'higher' }, battles: { name: 'Battles', unit: 'count' }, distinctCases: { name: 'Distinct cases', unit: 'count' }, uncachedInput: { name: 'Uncached input tokens', unit: 'tokens', better: 'lower' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, cachedTokens: { name: 'Cached tokens', unit: 'tokens', better: 'lower' }, inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower' },
  },
};
export default board;
