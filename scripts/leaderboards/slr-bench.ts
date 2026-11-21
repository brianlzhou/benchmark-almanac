// SLR-Bench tests logical rule induction. The leaderboard calculates "round(sum(non_null) / len(non_null), 1)" across four difficulty tiers.
// The Space merges its initial results with submissions and counts each model and reasoning effort once.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const space = 'https://huggingface.co/spaces/AIML-TUDA/slr-leaderboard';
const feed = space + '/raw/main/data/initial_results.json';
const dataset = 'AIML-TUDA/slr-leaderboard-results';
const parts = { basic: 'Basic', easy: 'Easy', medium: 'Medium', hard: 'Hard' };
type Result = {
  model_id: string; model_name: string; reasoning_effort?: string; eval_date?: string;
  accuracy: Record<string, number | null>; shortcuts: Record<string, number>;
  efficiency: { syntax?: number; tokens?: number; usd?: number };
};
const board: Leaderboard = {
  benchmark: 'slr-bench', url: space, feed, parts, costPer: 'run',
  aliases: { 'Cascade-2 30B': 'nemotron-cascade-2-30b-a3b', 'Llama-3.1-Nemotron 253B': 'llama-3-1-nemotron-ultra-253b-v1' },
  terms: 'The makers publish SLR-Bench under CC BY 4.0 at https://huggingface.co/datasets/AIML-TUDA/SLR-Bench.',
  async fetch() {
    const results = await fetchJson<Result[]>(feed);
    const files = await fetchJson<{ siblings: { rfilename: string }[] }>('https://huggingface.co/api/datasets/' + dataset);
    for (const { rfilename } of files.siblings.filter(f => f.rfilename.endsWith('.json'))) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const entry = await fetchJson<Result | Result[]>('https://huggingface.co/datasets/' + dataset + '/resolve/main/' + rfilename);
      results.push(...[entry].flat());
    }
    const seen = new Set<string>();
    const rows: LeaderboardRow[] = [];
    for (const r of results) {
      const key = JSON.stringify([r.model_id, r.reasoning_effort || '']);
      if (seen.has(key)) continue;
      seen.add(key);
      const metrics: Record<string, number> = {};
      for (const tier of Object.keys(parts)) {
        const n = r.accuracy[tier];
        if (n === null) continue;
        if (!Number.isFinite(n)) throw new Error('Missing SLR accuracy for ' + tier);
        metrics[tier] = n;
      }
      const scores = Object.values(metrics);
      if (!scores.length) continue;
      const avg = scores.reduce((a, b) => a + b) / scores.length;
      const score = Number(avg.toLocaleString('en-US', { maximumFractionDigits: 1, roundingMode: 'halfEven' }));
      for (const [tier, count] of Object.entries(r.shortcuts)) metrics[tier + 'Shortcuts'] = count;
      if (r.efficiency.syntax != null) metrics.syntax = r.efficiency.syntax;
      if (r.efficiency.tokens != null) metrics.runTokens = r.efficiency.tokens;
      rows.push({ model: r.model_name, score, setting: r.reasoning_effort, date: r.eval_date, cost: r.efficiency.usd ?? undefined, metrics });
    }
    return checked(rows, 56);
  },
};
export default board;
