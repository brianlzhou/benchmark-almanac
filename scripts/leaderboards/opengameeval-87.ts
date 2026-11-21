// OpenGameEval measures first-attempt pass rate on 87 Roblox Studio tasks. The expanded table in the repository supplies the five-attempt statistics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://raw.githubusercontent.com/Roblox/open-game-eval/main/LLM_LEADERBOARD.md";

const board: Leaderboard = {
  benchmark: "opengameeval-87",
  url: "https://github.com/Roblox/open-game-eval/blob/main/LLM_LEADERBOARD.md#expanded-eval-set-87-evals",
  feed,
  terms: "Use the first table for the expanded coding tasks. Roblox releases the repository under MIT. https://github.com/Roblox/open-game-eval/blob/main/LICENSE.txt The raw file host has no robots.txt.",
  reference: ['Roblox Studio Assistant'],
  async fetch() {
    const t = tables((await fetchText(feed)).split('## Expanded Eval Set (87 Evals)')[1] ?? '')[0];
    const cols = ['Pass@1', 'Pass@5', 'Cons@5', 'All@5', 'Avg Tool Error Rate'];
    if (!t || t.length < 9 || cols.some((c, i) => c !== t[1]?.[i]?.text)) throw new Error('Missing expanded Roblox leaderboard');
    return t.slice(2).map(c => {
      const metrics = Object.fromEntries(cols.map((k, i) => {
        const value = num(c[i + 1]?.text);
        if (value === undefined) throw new Error('Missing ' + k);
        return [k, value];
      }));
      const [model, setting] = c[0].text.split(' (');
      return { model, setting: setting?.replace(/\)$/, ''), score: metrics['Pass@1'], metrics, trials: 5, harness: 'Roblox Studio Assistant' };
    });
  },
};

export default board;
