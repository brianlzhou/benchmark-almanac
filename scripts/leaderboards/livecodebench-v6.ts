// LiveCodeBench v6 (release_v6: 1,055 problems published May 2023 to April 2025). The leaderboard page loads
// performances_generation.json, which holds per-problem pass@1 for each model on the whole v6 set. The page
// scores a model as the mean pass@1 over the problems inside a time window and rounds to one decimal. Its
// default window for v6 runs from 2024-08-01 to 2025-05-01, the "2408-2505" window most labs cite for v6,
// so that window is the score here. livecodebench-v5.ts reads the same file with the v5 window. Models
// released inside the window are flagged "contaminated" on the page but still scored, so they are kept.
// A model's release_date in the file is its training cutoff, used for that flag, not a run date, so it is
// not passed on (it would make the resolver pick the wrong snapshot). Dated names get aliases instead.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const LCB_FEED = 'https://livecodebench.github.io/performances_generation.json';
export const LCB_PAGE = 'https://livecodebench.github.io/leaderboard.html';
export const LCB_TERMS = 'Static JSON on the LiveCodeBench project site; the LiveCodeBench repository is MIT-licensed.';

interface Data {
  performances: { model: string; date: number; 'pass@1': number }[];
  models: { model_repr: string }[];
}

/** Board names the shared resolver cannot place. */
export const LCB_ALIASES: Record<string, string> = {
  'Gemini-2.5-Pro-05-06': 'gemini-2-5-pro-may-2025',
  'Gemini-2.5-Pro-06-05': 'gemini-2-5-pro-jun-2025',
  'Gemini-2.5-Flash-04-17': 'gemini-2-5-flash-apr-2025',
  'Gemini-2.5-Flash-05-20': 'gemini-2-5-flash-may-2025',
  // the registry lists "DeepSeek-R1-0528" as an alias of the January R1, but 0528 is the May 2025 release
  'DeepSeek-R1-0528': 'deepseek-r1-may-2025',
  // the board links deepseek-ai/DeepSeek-V3, the December 2024 release
  'DeepSeek-V3': 'deepseek-v3',
  'GPT-4O-2024-08-06': 'gpt-4o-aug-2024',
  'Claude-3.5-Sonnet-20241022': 'claude-3-5-sonnet-october-2024',
};

/** Mean pass@1 per model over problems released on or after `start` and before `end` (YYYY-MM-DD). */
export async function lcbRows(start: string, end: string): Promise<LeaderboardRow[]> {
  const data = await fetchJson<Data>(LCB_FEED);
  const from = Date.parse(start);
  const to = Date.parse(end);
  const rows: LeaderboardRow[] = [];
  for (const m of data.models) {
    const scores = data.performances.filter((p) => p.model === m.model_repr && p.date >= from && p.date < to).map((p) => p['pass@1']);
    if (!scores.length) continue;
    rows.push({
      model: m.model_repr.replace(/\(Med\)$/, '(Medium)'),
      score: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
    });
  }
  if (!rows.length) throw new Error(`no LiveCodeBench rows between ${start} and ${end}`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'livecodebench-v6',
  url: LCB_PAGE,
  feed: `${LCB_FEED} (problems from 2024-08-01 to 2025-05-01)`,
  terms: LCB_TERMS,
  aliases: LCB_ALIASES,
  fetch: () => lcbRows('2024-08-01', '2025-05-01'),
};
export default board;
