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

/** One row per model with pass@1 on `task` ("humaneval+" or "mbpp+"). */
export async function evalplusRows(task: 'humaneval+' | 'mbpp+'): Promise<LeaderboardRow[]> {
  const data = await fetchJson<Record<string, { 'pass@1'?: Record<string, number | null> }>>(EVALPLUS_FEED);
  const rows: LeaderboardRow[] = [];
  for (const [name, e] of Object.entries(data)) {
    const score = e['pass@1']?.[task];
    if (typeof score !== 'number') continue;
    let model = name.replace(/^databricks\//, '').trim();
    let date: string | undefined;
    const when = model.match(/\s*\((\w+)\.? (\d{4})\)$/);
    const month = when ? MONTHS.indexOf(when[1].slice(0, 3).toLowerCase()) : -1;
    if (when && month >= 0) {
      date = new Date(Date.UTC(Number(when[2]), month + 1, 0)).toISOString().slice(0, 10);
      model = model.slice(0, when.index).trim();
    }
    rows.push({ model, score, date });
  }
  if (!rows.length) throw new Error(`no ${task} scores in results.json`);
  return rows;
}

/** EvalPlus names the shared resolver cannot place. */
export const EVALPLUS_ALIASES: Record<string, string> = {};

const board: Leaderboard = {
  benchmark: 'humaneval-plus',
  url: EVALPLUS_PAGE,
  feed: `${EVALPLUS_FEED} (pass@1 humaneval+)`,
  terms: EVALPLUS_TERMS,
  aliases: EVALPLUS_ALIASES,
  fetch: () => evalplusRows('humaneval+'),
};
export default board;
