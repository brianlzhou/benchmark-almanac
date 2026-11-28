// RSIBench-Infra-Lite (ByteDance Seed and Tsinghua AIR SIA-Lab): 5-workload Lite subset of RSIBench-Infra using
// mean normalized Agent score (Oracle equals 0.5, speed-of-light equals 1.0). Reads section 01 (M.Jn) from the
// Next.js bundle fetched by rsibench-infra.ts, omitting untested workloads rather than recording 0.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { RSI_URL, RSI_NAMES, RSI_HARNESSES, fetchRsiBundle } from './rsibench-infra.ts';

const LITE_TASKS: Record<string, { key: string; name: string }> = {
  'infer-qwen3p8-27b': { key: 'qwen38', name: 'Qwen3.8-27B' },
  'infer-museglimmer-30b': { key: 'museGlimmer', name: 'Muse-Glimmer-30B' },
  'infer-qwen3vl-32b': { key: 'qwen3Vl', name: 'Qwen3-VL-32B' },
  'infer-llada2p1mini-16b': { key: 'llada21Mini', name: 'LLaDA2.1-mini-16B' },
  'infer-wan2p2ti2v-5b': { key: 'wan22', name: 'Wan2.2-TI2V-5B' },
};

const round = (x: number, d = 3) => {
  const f = 10 ** d;
  return Math.round(x * f) / f;
};

const board: Leaderboard = {
  benchmark: 'rsibench-infra-lite',
  url: RSI_URL,
  feed: RSI_URL,
  terms: 'The authors publish the RSIBench-Infra-Lite leaderboard on GitHub Pages with no robots.txt restrictions.',
  harnesses: 'system',
  parts: Object.fromEntries(Object.values(LITE_TASKS).map(({ key, name }) => [key, { name, group: 'Workload' }])),
  async fetch() {
    const { full, lite } = await fetchRsiBundle();
    if (!Array.isArray(lite) || lite.length < 5) {
      throw new Error(`RSIBench-Infra-Lite leaderboard changed: only ${lite?.length ?? 0} rows`);
    }
    const agentByModel = new Map(full.map((m) => [m.display_name, m.agents?.[0]]));
    return lite.map((m): LeaderboardRow => {
      if (!Number.isFinite(m.mean_score)) throw new Error(`RSIBench-Infra-Lite row malformed: ${m.display_name}`);
      const metrics: Record<string, number> = {};
      for (const t of m.tasks) {
        if (t.status !== 'completed') continue;
        const spec = LITE_TASKS[t.task];
        if (spec && Number.isFinite(t.score)) metrics[spec.key] = round(t.score, 3);
      }
      const rawAgent = agentByModel.get(m.display_name);
      const harness = rawAgent ? (RSI_HARNESSES[rawAgent] ?? rawAgent) : undefined;
      return {
        model: RSI_NAMES[m.display_name] ?? m.display_name,
        score: round(m.mean_score, 3),
        ...(harness ? { harness } : {}),
        ...(m.partial_evaluation ? { setting: `Partial coverage (${m.aggregation_task_count}/5 workloads)` } : {}),
        metrics,
      };
    });
  },
};

export default board;
