// The league ranks fantasy football teams by their season records. The standings page identifies the current model, which can inherit a predecessor’s roster and wins.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://modelfootball.com/standings";

const board: Leaderboard = {
  benchmark: "large-language-model-football-league",
  url: "https://modelfootball.com/standings",
  feed: FEED,
  terms: "The terms permit browsing, linking, and discussion. Recreation Instruments retains rights in original content. https://modelfootball.com/terms The robots file permits reference use and bars AI training.",
  harnesses: 'system',
  stats: {
    losses: { name: 'Losses', unit: 'count', better: 'lower' },
    standingsRank: { name: 'Standings rank', unit: 'count', better: 'lower' },
    headToHeadWins: { name: 'Head to head wins', unit: 'count', better: 'higher' },
    headToHeadLosses: { name: 'Head to head losses', unit: 'count', better: 'lower' },
    medianWins: { name: 'Median wins', unit: 'count', better: 'higher' },
    medianLosses: { name: 'Median losses', unit: 'count', better: 'lower' },
    pointsFor: { name: 'Points for', unit: 'score', better: 'higher' },
    pointsAgainst: { name: 'Points against', unit: 'score', better: 'lower' },
    differential: { name: 'Point differential', unit: 'score', better: 'higher' },
    efficiency: { name: 'Efficiency', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0].map(c => c.text).join('|') === '#|Team|W–L–T|H2H|MED|PF|PA|Diff|Eff');
    if (!table || table.length < 13) throw new Error('Expected twelve team records');
    return table.slice(1).map(row => {
      const [team, model] = row[1].text.split(' Current model: ');
      const record = row[2].text.match(/^(\d+)–(\d+)–(\d+)$/);
      const href = row[1].html.match(/href="([^"]+)"/)?.[1];
      if (!team || !model || !record || !href) throw new Error('Incomplete football team');
      const metrics: Record<string, number> = { losses: Number(record[2]), ties: Number(record[3]), standingsRank: Number(row[0].text) };
      for (const [i,key] of ['headToHead','median'].entries()) {
        const [wins,losses,ties] = row[i+3].text.split('–').map(Number);
        metrics[key+'Wins'] = wins; metrics[key+'Losses'] = losses; metrics[key+'Ties'] = ties;
      }
      for (const [i,key] of ['pointsFor','pointsAgainst','differential','efficiency'].entries()) {
        const value = num(row[i+5].text.replace('−','-'));
        if (value == null) throw new Error('Missing ' + key); metrics[key] = value;
      }
      return { model, harness: team, score: Number(record[1]), link: new URL(href, FEED).href, metrics };
    });
  },
};
export default board;
