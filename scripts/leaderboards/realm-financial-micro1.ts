// Realm Financial grades spreadsheet-grounded finance analysis. The finance chart embedded in micro1’s report defaults to best-of-three and publishes a separate mean score.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://www.micro1.ai/benchmark/realm-financial";
interface Tab { id:string; rows:{name:string;score:number}[] }

const board: Leaderboard = {
  benchmark: "realm-financial-micro1",
  url: "https://www.micro1.ai/benchmark/realm-financial",
  feed: FEED,
  terms: "The public report gives no reuse license for scores. The robots file lists a sitemap and no path restrictions.",
  stats: { meanScore: { name: 'Mean score', unit: 'score', better: 'higher' } },
  async fetch() {
    const page = await fetchText(FEED), marker = 'window.benchmarks_data["finance"] = ';
    const pos = page.indexOf(marker);
    if (pos < 0) throw new Error('Missing Realm finance chart');
    const data = jsLiteral<{defaultTab:string;tabs:Tab[]}>(page,pos+marker.length);
    const main = data.tabs.find(t => t.id === data.defaultTab), mean = data.tabs.find(t => t.id === 'mean');
    if (main?.id !== 'best-at-3' || main.rows.length < 17 || !mean) throw new Error('Incomplete finance chart');
    return main.rows.map(r => {
      const other = mean.rows.find(x => x.name === r.name);
      if (!other || !Number.isFinite(r.score) || !Number.isFinite(other.score)) throw new Error('Missing Realm financial score');
      const effort = r.name.match(/ \(([^()]+)\)$/);
      return { model: effort ? r.name.slice(0,-effort[0].length) : r.name, setting: effort?.[1], score:r.score, trials:3, metrics:{meanScore:other.score} };
    });
  },
};
export default board;
