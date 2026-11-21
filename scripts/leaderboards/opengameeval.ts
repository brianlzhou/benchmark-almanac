// OpenGameEval tests code and scene edits in Roblox Studio. The archived 47-task table gives pass@1 and additional five-attempt measures.
// Pass@5 counts any successful attempt. All@5 (pass^5) requires all five.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/Roblox/open-game-eval/main/Deprecated/LLM_LEADERBOARD_47_EVALS_OLD.md";

const board: Leaderboard = {
  benchmark: "opengameeval",
  url: "https://github.com/Roblox/open-game-eval/blob/main/Deprecated/LLM_LEADERBOARD_47_EVALS_OLD.md",
  feed: FEED,
  terms: "Roblox archives 24 model rows for the 47 coding tasks. The optional debugging column uses a separate suite. The repository uses MIT. https://github.com/Roblox/open-game-eval/blob/main/LICENSE.txt GitHub requests a one-second crawl delay.",
  reference: ['Roblox Studio Assistant'], parts: { 'Debug Pass@1': 'Debug Evals' },
  stats: {
    passAt5: { name: 'Pass@5', unit: '%', better: 'higher' },
    'Cons@5': { name: 'Consistent pass@5', unit: '%', better: 'higher' },
    pass5: { name: 'All pass@5', unit: '%', better: 'higher' },
    'Avg Tool Error Rate': { name: 'Average tool error rate', unit: '%', better: 'lower' },
  },
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[1]?.[0]?.text === 'Pass@1');
    const columns = ['Pass@1','Pass@5','Cons@5','All@5','Avg Tool Error Rate','Debug Pass@1'];
    if (!table || table.length < 26 || !columns.every((k,i) => tHeader(i) === k)) throw new Error('Changed Roblox standings');
    function tHeader(i:number) { return table?.[1]?.[i]?.text; }
    return table.slice(2).map(row => {
      const score = num(row[1]?.text), model = row[0]?.text;
      if (score == null || !model) throw new Error('Missing Roblox pass@1');
      const metrics: Record<string,number> = {};
      for (const [i,k] of columns.slice(1).entries()) { const n = num(row[i+2]?.text); if (n != null) metrics[k === 'Pass@5' ? 'passAt5' : k === 'All@5' ? 'pass5' : k] = n; }
      return { model, score, harness: 'Roblox Studio Assistant', metrics };
    });
  },
};
export default board;
