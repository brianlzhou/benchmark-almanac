// SEC-bench Pro, snapshot 260617 (344 instances: 103 V8, 104 SpiderMonkey, 137 Linux). sec-bench.github.io
// renders data/results.json, which holds one snapshot per release; 260617 is the board default and the
// only one this id covers. Its "overall" leaderboard lists per agent, model and effort the headline score
// (solved over all instances, 0 to 100). The agent is the harness and the effort the setting.
// The snapshot's run_details give each agent, model and effort one run per project (V8, SpiderMonkey, Linux)
// with total output tokens, runtime and tool calls, which the site shows per run. Summed over the three
// projects also supply aggregate verification counts, input tokens and project scores. Summed values divided by their instances, they give output tokens per instance (tokens), runtime in seconds
// (metrics.latency) and tool calls (metrics.toolCalls). The runs' total_cost is not in US dollars per task
// (about $2 for 4 billion tokens), so it is not kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://sec-bench.github.io/data/results.json';
const SNAPSHOT = '260617';

interface Result {
  agent?: string;
  model: string;
  effort?: string;
  date?: string;
  resolved?: number;
  org?: string;
  verified?: boolean;
  open_source?: boolean;
  score_modes?: { headline?: { score?: number, solved?:number }, completed?: { score?:number } };
}

interface RunDetail {
  agent?: string;
  model?: string;
  effort?: string;
  summary?: { total_tokens_input?:number; total_tokens?:number; verified_pocs?:number; instances?: number; total_tokens_output?: number; total_runtime_min?: number; total_tool_calls?: number };
}

const runKey = (r: { agent?: string; model?: string; effort?: string }) => `${r.agent}|${r.model}|${r.effort?.toLowerCase()}`;

const board: Leaderboard = {
  benchmark: 'sec-bench-pro-260617',
  harnesses: 'system',
  url: 'https://sec-bench.github.io',
  feed: `${FEED} (snapshot ${SNAPSHOT}, overall)`,
  terms: 'Static JSON on the SEC-bench GitHub Pages site, whose repository is Apache-2.0; the SEC-bench Pro repository is MIT.',
  stats: { inputTokens: { name: 'Input tokens per instance', unit: 'tokens' }, totalTokens: { name: 'Total tokens per instance', unit: 'tokens' }, verifiedPocs: { name: 'Verified proof of concepts', unit: 'count' }, solved: { name: 'Solved instances', unit: 'count' }, completedScore: { name: 'Completed-instance score', unit: '%', better: 'higher' }, latency: { name: 'Runtime per instance', unit: 'seconds', better: 'lower' }, toolCalls: { name: 'Tool calls per instance', unit: 'count' } },
  aliases: {}, parts:{ v8: { name: 'V8', group: 'Project' }, firefox: { name: 'Firefox', group: 'Project' }, linux: { name: 'Linux', group: 'Project' } }, verified:'Marked verified by SEC-bench',
  async fetch() {
    const data = await fetchJson<{
      snapshots: Record<string, { leaderboards: { name:string; display_name:string; is_overall?: boolean; instances?: number; results: Result[] }[]; run_details?: Record<string, RunDetail> }>;
    }>(FEED);
    const overall = data.snapshots[SNAPSHOT]?.leaderboards.find((l) => l.is_overall);
    if (!overall) throw new Error(`no overall board in SEC-bench snapshot ${SNAPSHOT}`);
    // per configuration, the sums over its project runs, used only when they cover every instance of the board
    const sums = new Map<string, { n: number; input:number; total:number; verified:number; out: number; min: number; calls: number }>();
    for (const d of Object.values(data.snapshots[SNAPSHOT].run_details ?? {})) {
      const t = d.summary;
      if (!t?.instances) continue;
      const s = sums.get(runKey(d)) ?? { n: 0, input:0,total:0,verified:0,out: 0, min: 0, calls: 0 };
      s.n += t.instances;
      s.input += t.total_tokens_input ?? NaN;
      s.total += t.total_tokens ?? NaN;
      s.verified += t.verified_pocs ?? NaN;
      s.out += t.total_tokens_output ?? NaN;
      s.min += t.total_runtime_min ?? NaN;
      s.calls += t.total_tool_calls ?? NaN;
      sums.set(runKey(d), s);
    }
    const rows: LeaderboardRow[] = [];
    for (const r of overall.results) {
      const score = r.score_modes?.headline?.score ?? r.resolved;
      if (typeof score !== 'number') continue;
      const s = sums.get(runKey(r));
      const per = (x: number | undefined) => (s && Number.isFinite(x) && s.n === overall.instances ? (x as number) / s.n : undefined);
      const [tokens, minutes, calls] = [per(s?.out), per(s?.min), per(s?.calls)];
      const metrics: Record<string,number> = {
        ...Object.fromEntries(Object.entries({inputTokens:per(s?.input),totalTokens:per(s?.total),verifiedPocs:s?.n===overall.instances?s?.verified:undefined,
          solved:r.score_modes?.headline?.solved,completedScore:r.score_modes?.completed?.score}).filter((p):p is [string,number]=>typeof p[1]==='number'&&Number.isFinite(p[1]))),
        ...(minutes !== undefined ? { latency: Math.round(minutes * 60) } : {}),
        ...(calls !== undefined ? { toolCalls: calls } : {}),
      };
      for (const project of data.snapshots[SNAPSHOT].leaderboards) {
        if (project.is_overall) continue;
        const entry = project.results.find(x=>runKey(x)===runKey(r));
        const value = entry?.score_modes?.headline?.score ?? entry?.resolved;
        if (typeof value === 'number') {
          metrics[project.name]=value;
          board.parts![project.name]={name:project.display_name,group:'Project'};
        }
      }
      rows.push({ agentOrg:r.org, verified:r.verified, open:r.open_source,
        model: r.model,
        score,
        setting: r.effort?.toLowerCase() || undefined,
        harness: r.agent,
        date: r.date,
        tokens: tokens !== undefined ? Math.round(tokens) : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
