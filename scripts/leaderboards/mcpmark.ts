// MCPMark (the original 127-task set). mcpmark.ai is a Next.js site that ships its leaderboard data in the
// page payload (self.__next_f), with no separate data file. /leaderboard ("Legacy Leaderboard", updated
// 2025-12-15) holds the original board: per model and effort, pass@1 averaged over four runs
// (passAtOne.avg, 0 to 1, the default sort), pass@4, pass^4 and perRunCost, the cost of one run over all
// tasks. A per-server table in the same payload gives each run's task count and output tokens. Cost and
// output tokens per task are those run totals divided by the task count. The table's Pass@4 and Pass^4 are
// kept as metrics.passAt4 and metrics.pass4 (percentages), and its "Avg Time" per task as metrics.time (seconds).
//
// The home page now defaults to an "MCPMark Verified" tab, a revised task set with its own, much higher
// scores. The almanac has no record for that version, so it is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt, nextFlight } from '../lib/html.ts';

const PAGE = 'https://mcpmark.ai/leaderboard';

interface Overall {
  name: string;
  rank?: number;
  servicesSuccessRate?: Record<string, { avgSuccessRate?: number }>;
  actualModelName?: string;
  passAtOne?: { avg?: number; std?: number };
  passAtFour?: number;
  passHatFour?: number;
  avgExecutionTime?: number;
  perRunCost?: number;
}
interface Server {
  serverName: string;
  models: { [key: string]: unknown; is_open_source_model?: boolean; model: string; total_tasks: number; per_run_output_tokens?: number }[];
}

const SERVER_LABELS: Record<string, string> = {
  filesystem: 'Filesystem',
  github: 'GitHub',
  notion: 'Notion',
  playwright: 'Playwright',
  postgres: 'Postgres',
};
const serverNames = Object.keys(SERVER_LABELS);
const SKIP_SERVER_KEYS = new Set(['total_tasks', 'rank', 'pass@1']);
const serverStats: Record<string, { name: string; unit: string; better?: 'higher' | 'lower' }> = {};
for (const server of serverNames) {
  const label = SERVER_LABELS[server];
  Object.assign(serverStats, {
    [`${server}: total_agent_execution_time`]: { name: `${label} total agent execution time`, unit: 'seconds', better: 'lower' },
    [`${server}: total_input_tokens`]: { name: `${label} total input tokens`, unit: 'tokens' },
    [`${server}: total_output_tokens`]: { name: `${label} total output tokens`, unit: 'tokens' },
    [`${server}: total_tokens`]: { name: `${label} total tokens`, unit: 'tokens' },
    [`${server}: total_turns`]: { name: `${label} total turns`, unit: 'count' },
    [`${server}: avg_agent_execution_time`]: { name: `${label} average agent execution time`, unit: 'seconds', better: 'lower' },
    [`${server}: avg_input_tokens`]: { name: `${label} average input tokens`, unit: 'tokens' },
    [`${server}: avg_output_tokens`]: { name: `${label} average output tokens`, unit: 'tokens' },
    [`${server}: avg_total_tokens`]: { name: `${label} average total tokens`, unit: 'tokens' },
    [`${server}: avg_turns`]: { name: `${label} average turns`, unit: 'count' },
    [`${server}: per_run_input_tokens`]: { name: `${label} input tokens per run`, unit: 'tokens' },
    [`${server}: per_run_output_tokens`]: { name: `${label} output tokens per run`, unit: 'tokens' },
    [`${server}: per_run_cost`]: { name: `${label} cost per run`, unit: 'usd', better: 'lower' },
    [`${server}: pass@4`]: { name: `${label} Pass@4`, unit: '%', better: 'higher' },
    [`${server}: pass^4`]: { name: `${label} Pass^4`, unit: '%', better: 'higher' },
  });
}

/** The JSON array behind the last `"data":[` before `marker` in the payload. */
function arrayBefore<T>(flight: string, marker: string): T {
  const at = flight.indexOf(marker);
  if (at < 0) throw new Error(`no ${marker} in the MCPMark payload`);
  const start = flight.lastIndexOf('"data":[', at);
  return jsonAt<T>(flight, start + '"data":'.length);
}

const board: Leaderboard = {
  benchmark: 'mcpmark',
  parts: Object.fromEntries(Object.entries(SERVER_LABELS).map(([k, name]) => [k, { name, group: 'Server' }])),
  url: PAGE,
  feed: `${PAGE} (Next.js page payload, legacy overall table)`,
  terms: 'Data embedded in the public mcpmark.ai page (robots.txt allows all paths, no terms page); the MCPMark repository is Apache-2.0.',
  stats: { runCostUsd: { name: 'Run cost', unit: 'usd', better: 'lower' }, passAt4: { name: 'Pass@4', unit: '%', better: 'higher' }, pass4: { name: 'Pass^4', unit: '%', better: 'higher' }, time: { name: 'Average time per task', unit: 'seconds', better: 'lower' }, ...serverStats },
  aliases: {
    'qwen-3-coder-plus': 'qwen3-coder-480b-a35b',
    'kimi-k2-0711': 'kimi-k2-jul-2025',
    'kimi-k2-0905': 'kimi-k2-sep-2025',
    // deepseek-chat on this board is DeepSeek-V3.1 in non-thinking mode (actualModelName deepseek-v3.1-non-think)
    'deepseek-chat': 'deepseek-v3-1',
  },
  async fetch() {
    const flight = nextFlight(await fetchText(PAGE));
    const overall = arrayBefore<Overall[]>(flight, '"servicesSuccessRate"');
    const servers = arrayBefore<Server[]>(flight, '"avgPassRate"');
    const tasks = new Map<string, number>();
    const output = new Map<string, number>();
    const details = new Map<string, Record<string, number>>();
    const openness = new Map<string, boolean>();
    for (const s of servers)
      for (const m of s.models) {
        const stats = details.get(m.model) ?? {};
        for (const [key, value] of Object.entries(m)) {
          if (typeof value !== 'number' || SKIP_SERVER_KEYS.has(key)) continue;
          const outKey = key === 'pass@1std' ? `${s.serverName}: pass1Std` : `${s.serverName}: ${key}`;
          stats[outKey] = key.startsWith('pass') ? value * 100 : value;
        }
        details.set(m.model, stats);
        if (typeof m.is_open_source_model === 'boolean') openness.set(m.model, m.is_open_source_model);
        tasks.set(m.model, (tasks.get(m.model) ?? 0) + m.total_tasks);
        output.set(m.model, (output.get(m.model) ?? 0) + (m.per_run_output_tokens ?? 0));
      }
    const rows: LeaderboardRow[] = [];
    for (const r of overall) {
      const score = r.passAtOne?.avg;
      if (typeof score !== 'number') continue;
      const n = tasks.get(r.name);
      // "deepseek-v3-2-thinking", "deepseek-v3-2-chat": one model in two modes (the registry lists
      // "DeepSeek-V3.2 (Thinking)" as a plain alias, which would swallow the mode)
      const mode = r.name.match(/^(deepseek-.+)-(thinking|chat)$/);
      const metrics: Record<string, number> = details.get(r.name) ?? {};
      if (r.perRunCost != null) metrics.runCostUsd = r.perRunCost;
      for (const [server, result] of Object.entries(r.servicesSuccessRate ?? {})) {
        if (typeof result.avgSuccessRate !== 'number') continue;
        metrics[server] = result.avgSuccessRate * 100;
      }
      if (typeof r.passAtFour === 'number') metrics.passAt4 = r.passAtFour * 100;
      if (typeof r.passHatFour === 'number') metrics.pass4 = r.passHatFour * 100;
      if (typeof r.passAtOne?.std === 'number') metrics.std = r.passAtOne.std * 100;
      if (r.avgExecutionTime) metrics.time = r.avgExecutionTime;
      rows.push({
        model: mode ? mode[1] : r.name,
        score: score * 100, trials: 4, open: openness.get(r.name),
        cost: n && r.perRunCost ? r.perRunCost / n : undefined,
        tokens: n && output.get(r.name) ? output.get(r.name)! / n : undefined,
        setting: mode ? (mode[2] === 'chat' ? 'non-thinking' : 'thinking') : r.name === 'deepseek-chat' ? 'non-thinking' : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
