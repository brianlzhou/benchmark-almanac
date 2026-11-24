// MCPMark Verified: revised, version-pinned 127-task set released 2026-06-12.
// Scores are single-run pass@1, distinct from the legacy four-run average.
// The live Next.js payload supplies overall scores and per-server output tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt, nextFlight } from '../lib/html.ts';

const PAGE = 'https://mcpmark.ai/leaderboard/verified';

interface Overall {
  name: string;
  actualModelName?: string;
  passAtOne?: { avg?: number; std?: number };
  passAtFour?: number;
  passHatFour?: number;
  avgExecutionTime?: number;
  perRunCost?: number;
  servicesSuccessRate?: Record<string, { avgSuccessRate?: number }>;
}
interface Server {
  serverName: string;
  models: { model: string; total_tasks: number; per_run_output_tokens?: number; per_run_input_tokens?: number; total_tokens?: number; total_turns?: number; is_open_source_model?: boolean }[];
}

/** The JSON array behind the last `"data":[` before `marker` in the payload. */
function arrayBefore<T>(flight: string, marker: string): T {
  const at = flight.indexOf(marker);
  if (at < 0) throw new Error(`no ${marker} in the MCPMark payload`);
  const start = flight.lastIndexOf('"data":[', at);
  return jsonAt<T>(flight, start + '"data":'.length);
}

const board: Leaderboard = {
  benchmark: 'mcpmark-verified',
  url: PAGE,
  feed: `${PAGE} (Next.js page payload, Verified overall table)`,
  terms: 'Data embedded in the public mcpmark.ai page (robots.txt allows all paths, no terms page); the MCPMark repository is Apache-2.0.',
  parts: {
    filesystem: { name: 'Filesystem', group: 'Server' },
    github: { name: 'GitHub', group: 'Server' },
    notion: { name: 'Notion', group: 'Server' },
    playwright: { name: 'Playwright', group: 'Server' },
    postgres: { name: 'PostgreSQL', group: 'Server' },
  },
  stats: {
    time: { name: 'Average execution time', unit: 'seconds', better: 'lower' },
    passAt4: { name: 'Pass@4', unit: '%', better: 'higher' },
    pass4: { name: 'Pass^4', unit: '%', better: 'higher' },
    inputTokens: { name: 'Input tokens per task', unit: 'tokens', better: 'lower' },
    totalTokens: { name: 'Total tokens per task', unit: 'tokens', better: 'lower' },
    turns: { name: 'Mean turns per task', unit: 'count', better: 'lower' },
  },
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
    const input = new Map<string, number>();
    const totalTok = new Map<string, number>();
    const turns = new Map<string, number>();
    const openMap = new Map<string, boolean>();
    for (const s of servers)
      for (const m of s.models) {
        tasks.set(m.model, (tasks.get(m.model) ?? 0) + m.total_tasks);
        output.set(m.model, (output.get(m.model) ?? 0) + (m.per_run_output_tokens ?? 0));
        input.set(m.model, (input.get(m.model) ?? 0) + (m.per_run_input_tokens ?? 0));
        totalTok.set(m.model, (totalTok.get(m.model) ?? 0) + (m.total_tokens ?? 0));
        turns.set(m.model, (turns.get(m.model) ?? 0) + (m.total_turns ?? 0));
        if (typeof m.is_open_source_model === 'boolean') openMap.set(m.model, m.is_open_source_model);
      }
    const rows: LeaderboardRow[] = [];
    for (const r of overall) {
      const score = r.passAtOne?.avg;
      if (typeof score !== 'number') continue;
      const n = tasks.get(r.name);
      // "deepseek-v3-2-thinking", "deepseek-v3-2-chat": one model in two modes (the registry lists
      // "DeepSeek-V3.2 (Thinking)" as a plain alias, which would swallow the mode)
      const mode = r.name.match(/^(deepseek-.+)-(thinking|chat)$/);
      const metrics: Record<string, number> = {};
      if (typeof r.passAtOne?.std === 'number' && r.passAtOne.std > 0) metrics.std = r.passAtOne.std * 100;
      if (typeof r.passAtFour === 'number') metrics.passAt4 = r.passAtFour * 100;
      if (typeof r.passHatFour === 'number') metrics.pass4 = r.passHatFour * 100;
      if (r.avgExecutionTime) metrics.time = r.avgExecutionTime;
      if (n && input.get(r.name)) metrics.inputTokens = input.get(r.name)! / n;
      if (n && totalTok.get(r.name)) metrics.totalTokens = totalTok.get(r.name)! / n;
      if (n && turns.get(r.name)) metrics.turns = turns.get(r.name)! / n;
      for (const [srv, val] of Object.entries(r.servicesSuccessRate ?? {})) {
        if (typeof val?.avgSuccessRate === 'number') metrics[srv] = val.avgSuccessRate * 100;
      }
      rows.push({
        model: r.actualModelName ?? (mode ? mode[1] : r.name),
        score: score * 100,
        open: openMap.get(r.name),
        cost: n && r.perRunCost ? r.perRunCost / n : undefined,
        tokens: n && output.get(r.name) ? output.get(r.name)! / n : undefined,
        setting: r.name.match(/-(max|xhigh|high|medium|low)$/)?.[1],
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    if (!rows.length) throw new Error("MCPMark Verified overall table has no rows");
    return rows;
  },
};
export default board;
