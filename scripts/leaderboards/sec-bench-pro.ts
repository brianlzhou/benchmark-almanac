// SEC-bench Pro, snapshot 260505 (183 instances: 103 V8 and 80 SpiderMonkey), the first release. The site
// keeps every snapshot in data/results.json, and the later 260617 snapshot is its own id
// (sec-bench-pro-260617.ts). The "overall" leaderboard lists per agent, model and effort the headline
// score (solved over all instances, 0 to 100). The agent is the harness and the effort the setting. Each row
// also carries the per-project scores ("v8" and "firefox") and the "completed" mode score (solved over instances
// that finished) in `metrics`, and, summed over the snapshot's run_details for the same agent, model and effort,
// output tokens per instance (`tokens`), runtime per instance ("time", seconds) and tool calls per instance
// ("toolCalls").
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://sec-bench.github.io/data/results.json';
const SNAPSHOT = '260505';

interface Result {
  agent?: string;
  model: string;
  effort?: string;
  date?: string;
  resolved?: number;
  score_modes?: { headline?: { score?: number }; completed?: { score?: number } };
  projects?: { name: string; score?: number }[];
}
interface Run {
  agent?: string;
  model: string;
  effort?: string;
  summary?: { instances?: number; total_runtime_min?: number; total_tool_calls?: number; total_tokens_output?: number };
}

const key = (r: { agent?: string; model: string; effort?: string }) => `${r.agent}\u0000${r.model}\u0000${r.effort}`;

const board: Leaderboard = {
  benchmark: 'sec-bench-pro',
  url: 'https://sec-bench.github.io',
  feed: `${FEED} (snapshot ${SNAPSHOT}, overall)`,
  terms: 'Static JSON on the SEC-bench GitHub Pages site, whose repository is Apache-2.0; the SEC-bench Pro repository is MIT.',
  aliases: {},
  async fetch() {
    const data = await fetchJson<{
      snapshots: Record<string, { leaderboards: { is_overall?: boolean; results: Result[] }[]; run_details?: Record<string, Run> }>;
    }>(FEED);
    // totals over the targets (V8, SpiderMonkey) for each agent, model and effort
    const totals = new Map<string, { n: number; min: number; calls: number; out: number }>();
    for (const run of Object.values(data.snapshots[SNAPSHOT]?.run_details ?? {})) {
      const sm = run.summary;
      if (!sm?.instances) continue;
      const t = totals.get(key(run)) ?? { n: 0, min: 0, calls: 0, out: 0 };
      t.n += sm.instances;
      t.min += sm.total_runtime_min ?? NaN;
      t.calls += sm.total_tool_calls ?? NaN;
      t.out += sm.total_tokens_output ?? NaN;
      totals.set(key(run), t);
    }
    const overall = data.snapshots[SNAPSHOT]?.leaderboards.find((l) => l.is_overall);
    if (!overall) throw new Error(`no overall board in SEC-bench snapshot ${SNAPSHOT}`);
    const rows: LeaderboardRow[] = [];
    for (const r of overall.results) {
      const score = r.score_modes?.headline?.score ?? r.resolved;
      if (typeof score !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const p of r.projects ?? []) if (typeof p.score === 'number') metrics[p.name] = p.score;
      if (typeof r.score_modes?.completed?.score === 'number') metrics.completed = r.score_modes.completed.score;
      const t = totals.get(key(r));
      if (t && Number.isFinite(t.min) && t.min > 0) metrics.time = Math.round((60 * t.min) / t.n);
      if (t && Number.isFinite(t.calls) && t.calls > 0) metrics.toolCalls = Number((t.calls / t.n).toFixed(1));
      rows.push({
        model: r.model,
        score,
        setting: r.effort?.toLowerCase() || undefined,
        harness: r.agent,
        date: r.date,
        tokens: t && Number.isFinite(t.out) && t.out > 0 ? Math.round(t.out / t.n) : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
