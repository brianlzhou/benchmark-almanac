// fAIntasy Football ranks its general managers by their season records. The official standings give wins and losses, points, budgets and lineup efficiency.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://www.faintasy.football/standings";

const board: Leaderboard = {
  benchmark: "faintasy-football",
  url: "https://www.faintasy.football/standings",
  feed,
  terms: "The league identifies third-party marks and photos. Its rules page gives no separate results license. https://www.faintasy.football/about The robots.txt path serves HTML.",
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === '#|Team|Record|PF|PA|FAAB|Lineup eff.');
    if (!t || t.length < 11) throw new Error('Missing fAIntasy standings');
    return t.slice(1).map(r => {
      const record = r[2].text.match(/^(\d+)-(\d+)(?:-(\d+))?$/);
      const values = r.slice(3).map(c => num(c.text));
      if (!record || values.some(v => v == null)) throw new Error('Incomplete fAIntasy result');
      const [pointsFor, pointsAgainst, remainingBudget, efficiency] = values as number[];
      const href = r[1].html.match(/href="([^"]+)"/)?.[1];
      const wins = Number(record[1]), losses = Number(record[2]), ties = Number(record[3] ?? 0);
      return { model: r[1].text, score: wins, trials: wins + losses + ties, link: href ? new URL(href, feed).href : undefined,
        metrics: { standingsRank: Number(r[0].text), losses, ties, pointsFor, pointsAgainst, remainingBudget, efficiency } };
    });
  },
};

export default board;
