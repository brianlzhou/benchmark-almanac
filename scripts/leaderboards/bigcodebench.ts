// BigCodeBench (full, 1,140 tasks). bigcode-bench.github.io loads results.json for the full set and
// results-hard.json for the 148-task Hard subset (read by bigcodebench-hard.ts through bigcodebenchRows).
// Each model has pass@1 (0 to 100) on the Complete split (docstring prompts) and the Instruct split (short
// natural-language instructions), a date and a link. The page ranks by their average, rounded to one
// decimal, and shows no average when either split is missing, so the score here is that average and models
// with one split only have no headline score. Complete and Instruct are kept as metrics.
// The page defines calcAverage as "parseFloat(((parseFloat(a) + parseFloat(b)) / 2).toFixed(1))"
// and returns null if either part is null. Names such as "o1-2024-12-17 (temperature=1, reasoning=high)" carry the
// sampling settings: the reasoning level becomes the setting and the rest is dropped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const BCB_PAGE = 'https://bigcode-bench.github.io/';
export const BCB_TERMS = 'Static JSON on the BigCodeBench GitHub Pages site; the bigcodebench repository is Apache-2.0.';
export const bcbFeed = (hard: boolean) => `${BCB_PAGE}${hard ? 'results-hard.json' : 'results.json'}`;

interface Entry {
  'pass@1'?: { complete?: number | null; instruct?: number | null };
  date?: string;
}

export async function bigcodebenchRows(hard: boolean): Promise<LeaderboardRow[]> {
  const data = await fetchJson<Record<string, Entry>>(bcbFeed(hard));
  const rows: LeaderboardRow[] = [];
  for (const [name, e] of Object.entries(data)) {
    const { complete, instruct } = e['pass@1'] ?? {};
    if (typeof complete !== 'number' || typeof instruct !== 'number' || SKIP.has(name.trim())) continue;
    let model = name.trim();
    let setting: string | undefined;
    const paren = model.match(/\s*\(([^)]*)\)$/);
    if (paren) {
      const effort = paren[1].match(/reasoning=(\w+)/)?.[1];
      setting = effort ?? (/w\/ reasoning/i.test(paren[1]) ? 'reasoning' : undefined);
      // "(2024-06-28)" marks a later run of the same API name, which the date below already carries
      model = model.slice(0, paren.index).trim();
    }
    rows.push({
      model,
      setting,
      score: Number(((complete + instruct) / 2).toFixed(1)),
      metrics: { complete, instruct },
      date: /^\d{4}-\d\d-\d\d$/.test(e.date ?? '') ? e.date : undefined,
    });
  }
  if (!rows.length) throw new Error(`no rows with both splits in ${bcbFeed(hard)}`);
  return rows;
}

/** BigCodeBench names the shared resolver cannot place. */
export const BCB_ALIASES: Record<string, string> = {
  'GPT-3.5-Turbo-0125': 'gpt-3-5-turbo-jan-2024',
  'Mistral-Large-2402': 'mistral-large',
  'Mistral-Large-Instruct-2407': 'mistral-large-2-jul-2024',
  'Mistral-Small-Instruct-2409': 'mistral-small-v24-09',
  'Mistral-Small-24B-Instruct-2501': 'mistral-small-3',
  'Mistral-7B-Instruct-v0.3': 'mistral-7b-v0-3',
  'Mistral-Nemo-12B-Instruct': 'mistral-nemo',
  'Mixtral-8x22B-Instruct': 'mixtral-8x22b',
  'Llama-3-70B-Instruct': 'llama-3-70b',
  'Llama-3-8B-Instruct': 'llama-3-8b',
  'Llama-3.1-405B-Instruct': 'llama-3-1-405b',
  'Llama-3.1-70B-Instruct': 'llama-3-1-70b',
  'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
  'Llama-3.2-3B-Instruct': 'llama-3-2-3b',
  'Llama-3.2-1B-Instruct': 'llama-3-2-1b',
  'Gemini-1.5-Pro-API-0514': 'gemini-1-5-pro-may-2024',
  'Gemini-1.5-Flash-API-0514': 'gemini-1-5-flash-may-2024',
  'Gemini-1.5-Pro-002': 'gemini-1-5-pro-sept-2024',
  'Gemini-2.0-Flash-001': 'gemini-2-0-flash-feb-2025',
  // the December 2024 experimental release, which the registry records as gemini-2-0-flash-dec-2024
  'Gemini-2.0-Flash-Exp': 'gemini-2-0-flash-dec-2024',
  'Gemma-2-9B-Instruct': 'gemma-2-9b',
  'Gemma-2-27B-Instruct': 'gemma-2-27b',
  'Gemma-3-27B-Instruct': 'gemma-3-27b',
  'DeepSeek-Coder-V2-Instruct': 'deepseek-coder-v2-236b',
  'C4AI-Command-R-Plus-08-2024': 'command-r-plus',
  'Qwen2-72B-Chat': 'qwen2-72b',
  'Qwen2.5-0.5B-Instruct': 'qwen2-5-0-5b',
  'Qwen2.5-1.5B-Instruct': 'qwen2-5-1-5b',
  'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
  'Qwen2.5-14B-Instruct': 'qwen2-5-14b',
  'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
  'Qwen2.5-Coder-7B-Instruct': 'qwen2-5-coder-7b',
  'Qwen2.5-Coder-1.5B-Instruct': 'qwen2-5-coder-1-5b',
  'Phi-3.5-Mini-Instruct': 'phi-3-5-mini',
  'Yi-1.5-34B-Chat': 'yi-1-5-34b',
};

/**
 * Board names the resolver would place on a different release: the April 2024 Command R+ (the registry has
 * only the August 2024 one) and Gemini experimental builds that the registry does not record.
 */
const SKIP = new Set(['Command R+', 'Gemini-1.5-Pro-Exp-0801', 'Gemini-1.5-Pro-Exp-0827', 'Gemini-1.5-Flash-Exp-0827', 'Gemini-2.0-Flash-Thinking-Exp-1219']);

const board: Leaderboard = {
  benchmark: 'bigcodebench',
  url: BCB_PAGE,
  feed: `${bcbFeed(false)} (mean of Complete and Instruct pass@1)`,
  terms: BCB_TERMS,
  aliases: BCB_ALIASES,
  fetch: () => bigcodebenchRows(false),
};
export default board;
