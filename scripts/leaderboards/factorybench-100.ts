// FactoryBench-100 ranks completed manufacturing workflows by mean FactoryScore.
// The leaderboard links its first-party run report with the aggregate, configuration and per-task token counts.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://blobfish.ai/benchmark-reports/first-party-model-runs.json';
interface Run {
  slug: string; version: string; finishedAt: string;
  model: { name: string; agent: string; agentVersion: string; reasoningEffort: string; webSearch: string };
  harness: { name: string; version: string };
  aggregate: { tasks: number; meanScore: number; averageCostUsd: number; averageToolCalls: number; strictPassRate: number };
  trials: { tokens?: { output?: number } }[];
}
const board: Leaderboard = {
  benchmark: 'factorybench-100', url: 'https://blobfish.ai/benchmarks/factorybench-100', feed,
  terms: 'Public first-party model run report linked from the Blobfish AI leaderboard.',
  stats: {
    averageToolCalls: { name: 'Average tool calls per task', unit: 'count' },
    strictPassRate: { name: 'Strict pass rate', unit: '%', better: 'higher' },
  },
  async fetch() {
    const { runs } = await fetchJson<{ runs: Run[] }>(feed);
    const ranked = runs.filter(r => r.slug === 'factorybench-100' && r.version === '3.3.5');
    if (!ranked.length) throw new Error('Missing FactoryBench release 3.3.5 runs');
    return ranked.map(r => {
      const m = r.model, a = r.aggregate;
      if (!m.name || a.tasks !== 100 || r.trials.length !== 100 || !Number.isFinite(a.meanScore)) throw new Error('Incomplete FactoryBench run');
      const tokens = r.trials.every(t => Number.isFinite(t.tokens?.output)) ? r.trials.reduce((sum, t) => sum + t.tokens!.output!, 0) / a.tasks : undefined;
      return { model: m.name, score: a.meanScore, date: r.finishedAt.slice(0, 10), cost: a.averageCostUsd, tokens, link: feed,
        harness: `${r.harness.name} ${r.harness.version} · ${m.agent} ${m.agentVersion}`,
        setting: `${m.reasoningEffort} reasoning · web search ${m.webSearch}`,
        metrics: { averageToolCalls: a.averageToolCalls, strictPassRate: a.strictPassRate },
      };
    });
  },
};
export default board;
