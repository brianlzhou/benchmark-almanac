// HumanEval-V. humaneval-v.github.io loads leaderboard_data.json: per model pass@1 (greedy) and pass@3 under
// four settings (V2C, V2C with CoT, V2T2C, V2T2C with GPT-4o). The page's summary names V2C with CoT pass@1
// as its headline ("Claude 3.5 Sonnet achieving only 36.8% pass@1"), and the record reports pass@1, so the
// score is "v2c-cot@1". (The table's default sort is V2T2C with GPT-4o pass@3, which OpenAI o1 lacks.)
// Names carry the API snapshot in parentheses, "GPT-4o (0806)", which the aliases map.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const PAGE = 'https://humaneval-v.github.io/';
const FEED = 'https://humaneval-v.github.io/leaderboard_data.json';

const board: Leaderboard = {
  benchmark: 'humaneval-v',
  url: PAGE,
  feed: `${FEED} (v2c-cot@1)`,
  terms: 'Static JSON on the HumanEval-V GitHub Pages site (robots.txt allows all); the HumanEval-V repository is Apache-2.0 licensed.',
  aliases: {},
  async fetch() {
    const data = await fetchJson<{ info: Record<string, string> }[]>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const { info } of data) {
      const score = num(info['v2c-cot@1']);
      if (!info.model || score === undefined) continue;
      rows.push({ model: info.model, score });
    }
    return rows;
  },
};
export default board;
