// Vals AI Detection Benchmark. The results live only in the vals.ai blog post, which draws them as a chart:
// the server-rendered page passes the chart its data as an Astro island prop ("benchmarkView"), in Astro's
// serialized form where every value is a [type, value] pair. tasks.overall holds, per system id
// ("anthropic/claude-opus-5-5", "detector/pangram"), the balanced accuracy (0 to 100) and the cost per
// document. Balanced accuracy is the score. Commercial detectors ("detector/...") have no model records and
// stay unmatched.
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
}

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
      benchmarkView: { tasks: { overall: Record<string, Run> } };
    };
    const rows: LeaderboardRow[] = [];
    for (const [id, run] of Object.entries(props.benchmarkView.tasks.overall)) {
      if (typeof run.accuracy !== 'number') continue;
      rows.push({ model: id, score: run.accuracy, cost: run.cost_per_test });
    }
    if (!rows.length) throw new Error('no AI detection rows');
    return rows;
  },
};
export default board;
