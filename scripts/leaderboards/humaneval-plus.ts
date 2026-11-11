// HumanEval+ (EvalPlus). evalplus.github.io/leaderboard.html loads results.json: per model a link, size,
// whether it was prompted as a chat model, and pass@1 (greedy, 0 to 100) on HumanEval, HumanEval+, MBPP and
// MBPP+. "humaneval+" is the score here, and mbpp-plus.ts reads "mbpp+" through evalplusRows. Names such as
// "GPT 4o (Aug 2024)" carry a month, which becomes the row date (the month's last day) so the resolver picks
// the snapshot current then. The board was last updated in early 2025.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const EVALPLUS_FEED = 'https://evalplus.github.io/results.json';
export const EVALPLUS_PAGE = 'https://evalplus.github.io/leaderboard.html';
export const EVALPLUS_TERMS = 'Static JSON on the EvalPlus GitHub Pages site; the EvalPlus repository is Apache-2.0.';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** One row per model with pass@1 on `task`: "humaneval", "humaneval+", "mbpp" or "mbpp+". */
export async function evalplusRows(task: 'humaneval' | 'humaneval+' | 'mbpp' | 'mbpp+'): Promise<LeaderboardRow[]> {
  const data = await fetchJson<Record<string, { 'pass@1'?: Record<string, number | null> }>>(EVALPLUS_FEED);
  const rows: LeaderboardRow[] = [];
  for (const [name, e] of Object.entries(data)) {
    const score = e['pass@1']?.[task];
    if (typeof score !== 'number') continue;
    let model = name.replace(/^databricks\//, '').trim();
    // The linked c4ai-command-r-plus checkpoint is April 2024, not the registry's August snapshot.
    // Keep the historical label unlisted. The source gives no exact evaluation date.
    const historicalCommand = model === 'Command-R+';
    let date: string | undefined;
    const when = model.match(/\s*\((\w+)\.? (\d{4})\)$/);
    const month = when ? MONTHS.indexOf(when[1].slice(0, 3).toLowerCase()) : -1;
    if (when && month >= 0) {
      date = new Date(Date.UTC(Number(when[2]), month + 1, 0)).toISOString().slice(0, 10);
      model = model.slice(0, when.index).trim();
    }
    rows.push({ model: historicalCommand ? 'Command-R+ (April 2024)' : model, score, date });
  }
  if (!rows.length) throw new Error(`no ${task} scores in results.json`);
  return rows;
}

/** EvalPlus names the shared resolver cannot place. */
export const EVALPLUS_ALIASES: Record<string, string> = {
  // the board dates it November 2024, before the December 2024 release it links
  'DeepSeek-V3': 'deepseek-v3',
  'Claude Sonnet 3.5': 'claude-3-5-sonnet',
  'Gemini 1.5 Pro 002': 'gemini-1-5-pro-sept-2024',
  'Gemini 1.5 Flash 002': 'gemini-1-5-flash-sep-2024',
  'Gemini Pro 1.0': 'gemini-1-0-pro',
  'GPT-3.5': 'gpt-3-5-turbo-mar-2023',
  'Llama3-70B-instruct': 'llama-3-70b',
  'Llama3-8B-instruct': 'llama-3-8b',
  'Llama3.1-8B-instruct': 'llama-3-1-8b',
  'dbrx-instruct': 'dbrx',
  'Mixtral-8x22B-Instruct-v0.1': 'mixtral-8x22b',
  'Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
  'DeepSeek-Coder-V2-Instruct': 'deepseek-coder-v2-236b',
  'claude-instant-1': 'claude-instant',
  'phi-2-2.7B': 'phi-2',
};

const board: Leaderboard = {
  benchmark: 'humaneval-plus',
  url: EVALPLUS_PAGE,
  feed: `${EVALPLUS_FEED} (pass@1 humaneval+)`,
  terms: EVALPLUS_TERMS,
  aliases: EVALPLUS_ALIASES,
  fetch: () => evalplusRows('humaneval+'),
};
export default board;
