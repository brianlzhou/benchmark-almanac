// Argo-Bench grades enterprise data science tasks. The project table ranks agents by score and reports the solved rate separately.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://argo-bench.com/";

const board: Leaderboard = {
  benchmark: "argo-bench",
  url: "https://argo-bench.com#leaderboard",
  feed: FEED,
  terms: "The repository uses Apache 2.0 for code and CC BY 4.0 for the question cards and warehouse data. https://github.com/TextQLLabs/Argo-Bench",
  stats: {
    solved: { name: 'Tasks solved', unit: '%', better: 'higher' },
    steps: { name: 'Steps per task', unit: 'count', better: 'lower' },
  },
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text.includes('Cost / task')));
    const headers = ['Model','Score','Solved','Cost / task','Tokens / task','Steps / task'];
    if (!table || table.length < 25 || !headers.every((h,i) => table[0].filter(c => c.text)[i]?.text.includes(h))) throw new Error('Incomplete Argo-Bench leaderboard');
    return table.slice(1).map((cells): LeaderboardRow => {
      const label = cells[1].text;
      const effort = label.match(/ (Extra high|High|Max|Medium|Low)$/);
      const [score, solved, cost, tokens, steps] = cells.slice(2).map(c => num(c.text));
      if (!label || cells.length !== 7 || [score, solved, cost, tokens, steps].some(v => v === undefined)) throw new Error('Missing Argo-Bench result: ' + label);
      return {model: effort ? label.slice(0,-effort[0].length) : label, setting: effort?.[1], score: score!, cost, tokens, open: cells[1].html.includes('background: transparent'), metrics: {solved: solved!, steps: steps!}};
    });
  },
};
export default board;
