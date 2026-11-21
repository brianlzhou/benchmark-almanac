// BAZAAR evaluates agents in a double auction. The README ranks market strategies by median TrueSkill μ.
// The table also reports rating uncertainty, games played and mean conditional surplus alpha.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/lechmazur/bazaar/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "bazaar-lech-mazur",
  url: "https://github.com/lechmazur/bazaar",
  feed,
  terms: "The publisher displays results at https://github.com/lechmazur/bazaar. I could not verify reuse terms. The raw GitHub host returns 404 for robots.txt.",
  aliases: { "Microsoft Phi-4": "phi-4", "Baidu Ernie 4.5 300B A47B": "ernie-4-5-300b-a47b" },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === 'Model|μ|σ|games|avg_csa');
    if (!table || table.length < 56) throw new Error('Missing BAZAAR ratings');
    return table.slice(1).map(([label, mu, sigma, games, csa]) => {
      if (!label || [mu,sigma,games,csa].some(v => !v || !Number.isFinite(Number(v)))) throw new Error('Invalid BAZAAR row');
      const name = label.match(/^(.+?) (?:\((medium reasoning|no reasoning)\)|(Thinking 16K))$/);
      return { model: name?.[1] ?? label, setting: name?.[2] ?? name?.[3], score: +mu, trials: +games,
        low: +mu - +sigma, high: +mu + +sigma, metrics: { std: +sigma, avgCSA: +csa } };
    });
  },
};

export default board;
