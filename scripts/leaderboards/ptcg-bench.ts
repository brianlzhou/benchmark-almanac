// PTCG-Bench ranks agents by anchored Glicko-2 rating. The project table gives rating deviation, game records and average cost.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://ddhua.tech/ptcg-bench/";

const board: Leaderboard = {
  benchmark: "ptcg-bench",
  url: "https://ddhua.tech/ptcg-bench/",
  feed,
  terms: "The authors license the project under MIT and reserve third party rights in Pokémon assets. The page gives no separate standings license. https://github.com/zjunet/PTCG-Bench The site returns 404 for robots.txt.",
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Rank|Agent|Family|Rating|Deviation|Record|Win Rate|AVG. Cost');
    if (!t || t.length < 13) throw new Error('Missing PTCG standings');
    return t.slice(1).filter(c => !['Heuristic', 'Baseline'].includes(c[2].text)).map(c => {
      const [wins, losses] = c[5].text.split('-').map(Number);
      const score = num(c[3].text), deviation = num(c[4].text), winRate = num(c[6].text), cost = num(c[7].text);
      if (score === undefined || deviation === undefined || winRate === undefined || ![wins, losses].every(Number.isFinite)) throw new Error('Incomplete PTCG record');
      return { model: c[1].text, score, cost, trials: wins + losses, metrics: { wins, losses, winRate, std: deviation } };
    });
  },
};

export default board;
