// SWE-bench Verified: swebench.com is built from data/leaderboards.json in the SWE-bench/swe-bench.github.io
// repository (the page embeds the same array). The "Verified" board holds every submission, scored as
// % resolved. The site's default view is the "Bash Only" preset, which is the Agent filter set to
// mini-SWE-agent; those rows carry harness "mini-SWE-agent" here, and the other scaffolds keep their names.
// The Multilingual and Multimodal boards in the same file import sweBenchRows and SWE_BENCH_ALIASES from here.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const SWE_BENCH_FEED = 'https://raw.githubusercontent.com/SWE-bench/swe-bench.github.io/master/data/leaderboards.json';
export const SWE_BENCH_TERMS =
  'Repository file in SWE-bench/swe-bench.github.io, licensed CC BY-NC 4.0 (attribution, non-commercial use).';

interface Result {
  name: string;
  agent: string;
  agent_org?: string;
  model_display: string;
  /** true when the SWE-bench team checked the submission; false, null or a "false (...)" note otherwise */
  checked?: boolean | string | null;
  /** s3://swe-bench-submissions/<split>/<folder>/logs: the same folder is public in SWE-bench/experiments */
  logs?: unknown;
  trajs?: unknown;
  trajs_docent?: unknown;
  site?: string;
  os_model?: boolean | null;
  folder?: string;
  reasoning_effort: string | null;
  resolved: number;
  /** US dollars per task instance; "cost" is the total for all 500. */
  instance_cost?: number | null;
  date: string;
  tags: string[];
}

/** Every submission on one board of leaderboards.json ("Verified", "Multilingual", "Multimodal", ...). */
export async function sweBenchRows(name: string): Promise<LeaderboardRow[]> {
  const data = await fetchJson<{ leaderboards: { name: string; results: Result[] }[] }>(SWE_BENCH_FEED);
  const board = data.leaderboards.find((b) => b.name === name);
  if (!board) throw new Error(`no ${name} board in leaderboards.json`);
  const out: LeaderboardRow[] = [];
  for (const r of board.results) {
    if (!r.model_display) continue;
    // "Multiple" marks a submission that uses several models: a blend, named by its first model. The tags list
    // every model ("Model: claude-sonnet-4-20250514").
    const tagged = (r.tags ?? []).filter((t) => t.startsWith('Model: ')).map((t) => t.slice(7).trim());
    const multiple = /^multiple$/i.test(r.model_display);
    const model = multiple ? tagged[0] : r.model_display;
    if (!model) continue;
    const path = typeof r.logs === 'string' ? r.logs : typeof r.trajs === 'string' ? r.trajs : undefined;
    const split = !path ? null : path.match(/^s3:\/\/swe-bench-submissions\/([\w-]+)\/([^/]+)\//);
    out.push({
      model,
      score: Number(r.resolved),
      setting: r.reasoning_effort?.toLowerCase() || undefined,
      harness: r.agent,
      date: r.date,
      cost: r.instance_cost ?? undefined,
      agentOrg: r.agent_org?.trim() || undefined,
      verified: typeof r.checked === 'boolean' ? r.checked : typeof r.checked === 'string' && /^false\b/i.test(r.checked) ? false : undefined,
      trials: r.tags?.includes('System: Attempts - 1') ? 1 : undefined,
      ...(multiple && new Set(tagged).size > 1 ? { models: tagged } : {}),
      link: typeof r.trajs_docent === 'string' && r.trajs_docent.startsWith('https://') ? r.trajs_docent : split ? `https://github.com/SWE-bench/experiments/tree/main/evaluation/${split[1]}/${split[2]}` : r.site?.startsWith('https://github.com/') ? r.site : undefined,
      ...(typeof r.os_model === 'boolean' ? { open: r.os_model } : {}),
    });
  }
  return out;
}

/**
 * What every SWE-bench board shares: each entry is an agent and a model. mini-SWE-agent, the "Bash Only" view, is
 * the neutral one (data/harnesses.json). Other agents show as their own entries.
 */
export const SWE_BENCH_BOARD = { harnesses: 'system', reference: ['mini-SWE-agent', 'RAG'], verified: 'checked by the SWE-bench team' } satisfies Pick<Leaderboard, 'harnesses' | 'reference' | 'verified'>;

export const SWE_BENCH_ALIASES: Record<string, string> = {
  'Claude 4 Opus': 'claude-opus-4',
  'Claude 4 Sonnet': 'claude-sonnet-4',
  'Claude 4.5 Haiku': 'claude-haiku-4-5',
  'Claude 4.5 Opus': 'claude-opus-4-5',
  'Claude 4.5 Sonnet': 'claude-sonnet-4-5',
  'Claude 4.6 Opus': 'claude-opus-4-6',
  // the model is Claude 3.7 Sonnet (tag "Model: claude-3-7-sonnet-20250219"); "Review Heavy" is the system
  'Claude 3.7 Sonnet w/ Review Heavy': 'claude-3-7-sonnet',
  'DeepSeek V3.2 Reasoner': 'deepseek-v3-2',
  'Gemini 2.0 Flash (v20241212-experimental)': 'gemini-2-0-flash-dec-2024',
  'GPT-4 (1106)': 'gpt-4-turbo-nov-2023',
  // both rows are from August 2025, before the 0905 release
  'Kimi K2 Instruct': 'kimi-k2-jul-2025',
  'Llama 4 Maverick Instruct': 'llama-4-maverick',
  'Llama 4 Scout Instruct': 'llama-4-scout',
  'Qwen3-Coder-480B-A35B-Instruct': 'qwen3-coder-480b-a35b',
  'Qwen3-Coder 480B/A35B Instruct': 'qwen3-coder-480b-a35b',
  'Devstral Small (2512)': 'devstral-small-2',
};

const board: Leaderboard = {
  benchmark: 'swe-bench-verified',
  url: 'https://www.swebench.com/',
  feed: SWE_BENCH_FEED,
  terms: SWE_BENCH_TERMS,
  aliases: SWE_BENCH_ALIASES,
  ...SWE_BENCH_BOARD,
  fetch: () => sweBenchRows('Verified'),
};
export default board;
