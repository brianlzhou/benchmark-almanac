// Vals AI Detection Benchmark. The results live only in the vals.ai blog post, which draws them as a chart:
// the server-rendered page passes the chart its data as an Astro island prop ("benchmarkView"), in Astro's
// serialized form where every value is a [type, value] pair. tasks.overall holds, per system id
// ("anthropic/claude-opus-5-5", "detector/pangram"), the balanced accuracy (0 to 100) and the cost per
// document. Balanced accuracy is the score. Commercial detectors ("detector/...") have no model records and
// stay unmatched. Each row also carries the run's mean seconds per document ("latency"), the 95% interval
// from its standard error (±1.96, "ciLow" and "ciHigh", as vals-index.ts computes it) and its accuracy on the
// human-written and AI-rewritten splits (tasks.human and tasks.ai, as "human" and "ai").
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { VALS_TERMS } from './vals-index.ts';

const PAGE = 'https://www.vals.ai/blogs/ai-detection-benchmark';

const DECODE: Record<string, string> = { quot: '"', amp: '&', lt: '<', gt: '>', '#39': "'" };

/** Astro's serialized props: [0, value] for plain values and objects, [1, [...]] for arrays. */
function unpack(v: unknown): unknown {
  if (!Array.isArray(v) || v.length !== 2 || typeof v[0] !== 'number') return v;
  const [type, value] = v as [number, unknown];
  if (type === 1 && Array.isArray(value)) return value.map(unpack);
  if (value && typeof value === 'object' && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).map(([k, x]) => [k, unpack(x)]));
  return value;
}

interface Run {
  accuracy?: number;
  cost_per_test?: number;
  latency?: number | null;
  stderr?: number | null;
}

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

const board: Leaderboard = {
  benchmark: 'vals-ai-detection-benchmark',
  url: PAGE,
  feed: `${PAGE} (chart data in the server-rendered Astro island props, tasks.overall)`,
  terms: VALS_TERMS,
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const raw = [...html.matchAll(/props="(\{&quot;benchmarkView&quot;[^"]*)"/g)][0]?.[1];
    if (!raw) throw new Error('benchmarkView props not found');
    const props = unpack(JSON.parse(`[0,${raw.replace(/&(quot|amp|lt|gt|#39);/g, (_, e: string) => DECODE[e])}]`)) as {
      benchmarkView: { tasks: { overall: Record<string, Run>; human?: Record<string, Run>; ai?: Record<string, Run> } };
    };
    const { human = {}, ai = {} } = props.benchmarkView.tasks;
    const rows: LeaderboardRow[] = [];
    for (const [id, run] of Object.entries(props.benchmarkView.tasks.overall)) {
      if (typeof run.accuracy !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (fin(run.latency) && run.latency > 0) metrics.latency = run.latency;
      if (fin(run.stderr) && run.stderr > 0) Object.assign(metrics, { ciLow: run.accuracy - 1.96 * run.stderr, ciHigh: run.accuracy + 1.96 * run.stderr });
      if (fin(human[id]?.accuracy)) metrics.human = human[id].accuracy!;
      if (fin(ai[id]?.accuracy)) metrics.ai = ai[id].accuracy!;
      rows.push({ model: id, score: run.accuracy, cost: run.cost_per_test, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    if (!rows.length) throw new Error('no AI detection rows');
    return rows;
  },
};
export default board;
