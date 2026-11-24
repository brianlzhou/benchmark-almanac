// Ramp SWE-Bench (labs.ramp.com/swebench). Ramp Labs runs coding agents on private tasks built from its own backend
// pull requests. The page draws its leaderboard in the browser from per-task results files it loads, one row per
// task, model and harness (results.csv.gz): whether the patch resolved the task, and the run's time, tool calls,
// tokens and cost. This reader rebuilds the board from those files: the score is the share of tasks resolved
// (pass@1, out of every task the model ran), and the other columns are means per task, as the page's summary table
// shows them. The data version in each address comes from the page's script and only busts caches.
import { gunzipSync } from 'node:zlib';
import type { BoardStat, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchBytes, parseCsv } from '../util.ts';

export const RAMP_TERMS = 'Ramp Labs publishes the per-task results files its pages load. No license is stated, so we read them politely and credit Ramp with a link.';

export const RAMP_STATS: Record<string, BoardStat> = {
  latency: { name: 'Mean latency per task', unit: 'seconds', better: 'lower' },
  toolCalls: { name: 'Mean tool calls per task', unit: 'count', better: 'lower' },
  turns: { name: 'Mean turns per task', unit: 'count', better: 'lower' },
  inputTokens: { name: 'Input tokens per task', unit: 'tokens' },
  reasoningTokens: { name: 'Reasoning tokens per task', unit: 'tokens' },
  totalTokens: { name: 'Total tokens per task', unit: 'tokens' },
  cacheReadTokens: { name: 'Cache read tokens per task', unit: 'tokens' },
  cacheCreationTokens: { name: 'Cache creation tokens per task', unit: 'tokens' },
  thinkingBlocks: { name: 'Mean thinking blocks per task', unit: 'count' },
  toolErrors: { name: 'Mean tool errors per task', unit: 'count', better: 'lower' },
  timeoutRate: { name: 'Timeout rate', unit: '%', better: 'lower' },
  toolCallsSearch: { name: 'Mean search tool calls per task', unit: 'count' },
  toolCallsRead: { name: 'Mean read tool calls per task', unit: 'count' },
  toolCallsEdit: { name: 'Mean edit tool calls per task', unit: 'count' },
  toolCallsTest: { name: 'Mean test tool calls per task', unit: 'count' },
  toolCallsQuality: { name: 'Mean quality tool calls per task', unit: 'count' },
  toolCallsShell: { name: 'Mean shell tool calls per task', unit: 'count' },
  tasks: { name: 'Tasks', unit: 'count' },
};

/** Harness names as the page shows them. */
const HARNESS: Record<string, string> = {
  'mini-swe-agent': 'mini-SWE-agent', 'claude-code': 'Claude Code', codex: 'Codex', opencode: 'OpenCode',
  'muse-code': 'Muse Code', 'deepseek-harness': 'DeepSeek Harness', 'grok-build': 'Grok Build',
};
const EFFORTS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

/** "fireworks_ai/glm-5p1-high" -> model "glm-5.1", setting "high" */
function modelOf(slug: string): { model: string; setting?: string } {
  let name = slug.split('/').pop()!;
  let setting: string | undefined;
  const m = name.match(/^(.*)-([a-z]+)$/);
  if (m && EFFORTS.includes(m[2])) { name = m[1]; setting = m[2]; }
  return { model: name.replace(/(\d)p(\d)/g, '$1.$2'), setting };
}

/** Wilson score interval for k of n at z, in percent */
function wilson(k: number, n: number, z: number): [number, number] {
  const p = k / n, d = 1 + (z * z) / n, c = (p + (z * z) / (2 * n)) / d;
  const h = (z / d) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.round((c - h) * 1000) / 10, Math.round((c + h) * 1000) / 10];
}

/**
 * Rows from one results file. `ci95` adds the 95% interval the v2 page draws ("Show 95% CI"). The v1 page draws a
 * one-sigma band instead, so v1 rows carry no interval.
 */
export async function rampRows(file: string, opts: { ci95: boolean; minRows: number }): Promise<LeaderboardRow[]> {
  const csv = parseCsv(gunzipSync(Buffer.from(await fetchBytes(file))).toString('utf8'));
  for (const k of ['instance_id', 'model', 'harness', 'resolved', 'agent_cost_usd', 'agent_completion_tokens', 'agent_tool_calls', 'timestamp'])
    if (!(k in (csv[0] ?? {}))) throw new Error(`Ramp SWE-Bench: column ${k} missing from ${file}`);
  const groups = new Map<string, Record<string, string>[]>();
  for (const r of csv) {
    const g = `${r.model}\u0000${r.harness}`;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(r);
  }
  const mean = (rs: Record<string, string>[], k: string) => {
    const xs = rs.map((r) => (r[k] === '' || r[k] === undefined ? NaN : Number(r[k]))).filter((x) => r_ok(x));
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined;
  };
  const r_ok = (x: number) => Number.isFinite(x);
  const rows: LeaderboardRow[] = [];
  for (const rs of groups.values()) {
    const n = new Set(rs.map((r) => r.instance_id)).size;
    const solved = new Set(rs.filter((r) => r.resolved === 'True').map((r) => r.instance_id)).size;
    const { model, setting } = modelOf(rs[0].model);
    const time = mean(rs, 'time_elapsed_seconds') ?? mean(rs, 'agent_elapsed');
    const metrics: Record<string, number> = {};
    const put = (k: string, v: number | undefined, digits = 1) => { if (v !== undefined) metrics[k] = Math.round(v * 10 ** digits) / 10 ** digits; };
    put('latency', time); put('toolCalls', mean(rs, 'agent_tool_calls')); put('turns', mean(rs, 'agent_turns') ?? mean(rs, 'agent_turn'));
    put('inputTokens', mean(rs, 'agent_prompt_tokens'), 0); put('reasoningTokens', mean(rs, 'agent_reasoning_tokens'), 0);
    put('totalTokens', mean(rs, 'agent_total_tokens'), 0);
    put('cacheReadTokens', mean(rs, 'agent_cache_read_tokens'), 0);
    put('cacheCreationTokens', mean(rs, 'agent_cache_creation_tokens'), 0);
    put('thinkingBlocks', mean(rs, 'agent_thinking_blocks'));
    put('toolErrors', mean(rs, 'agent_tool_errors'));
    if ('agent_timeout' in rs[0]) put('timeoutRate', (rs.filter((r) => r.agent_timeout === 'True').length / rs.length) * 100);
    put('toolCallsSearch', mean(rs, 'agent_tool_calls_search'));
    put('toolCallsRead', mean(rs, 'agent_tool_calls_read'));
    put('toolCallsEdit', mean(rs, 'agent_tool_calls_edit'));
    put('toolCallsTest', mean(rs, 'agent_tool_calls_test'));
    put('toolCallsQuality', mean(rs, 'agent_tool_calls_quality'));
    put('toolCallsShell', mean(rs, 'agent_tool_calls_shell'));
    put('tasks', n, 0);
    const [low, high] = wilson(solved, n, 1.96);
    rows.push({
      model, setting, harness: HARNESS[rs[0].harness] ?? rs[0].harness,
      score: Math.round((solved / n) * 1000) / 10,
      cost: Math.round(mean(rs, 'agent_cost_usd')! * 100) / 100,
      tokens: Math.round(mean(rs, 'agent_completion_tokens')!),
      date: rs.map((r) => r.timestamp.slice(0, 10)).sort().at(-1),
      metrics,
      ...(opts.ci95 ? { low, high } : {}),
    });
  }
  if (rows.length < opts.minRows) throw new Error(`Ramp SWE-Bench: ${rows.length} model and harness pairs in ${file}, expected at least ${opts.minRows}`);
  return rows.sort((a, b) => b.score - a.score);
}
