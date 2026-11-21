// BoardBench 0.2 grades one move in each of 30 positions on a 100-point scale.
// The overall chart supplies the mean grade and cost per position. Each game page supplies its own mean.
import type { Leaderboard } from './types.ts';
import { jsonAt, nextFlight } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://boardbench.dev/v/0.2";
type Point = { slug: string; className: string; effort: string; costUsd: number; qualityPct: number };
function points(page: string) {
  const source = nextFlight(page);
  const marker = /"points":(?=\[\{"slug":)/.exec(source);
  if (!marker) throw new Error('Missing BoardBench quality versus cost chart');
  const data = jsonAt<Point[]>(source, marker.index + marker[0].length);
  if (data.length < 8 || data.some(p => !p.slug || !p.className || !p.effort || !Number.isFinite(p.qualityPct) || !Number.isFinite(p.costUsd)))
    throw new Error('Incomplete BoardBench chart');
  return data;
}

const board: Leaderboard = {
  benchmark: "boardbench-0-2",
  url: "https://boardbench.dev/v/0.2",
  feed,
  terms: "The maker gives no reuse license on the leaderboard or methodology page. robots.txt allows the feed path.",
  async fetch() {
    const page = await fetchText(feed);
    const rows = points(page).map(p => ({ model: p.className, setting: p.effort, score: p.qualityPct,
      cost: p.costUsd, link: feed + '/models/' + p.slug, metrics: {} as Record<string, number> }));
    const games = new Map([...page.matchAll(/href="(\/v\/0\.2\/games\/([\w-]+))">([^<]+)<\/a>/g)].map(m => [m[2], m[3]]));
    if (games.size < 10) throw new Error('Missing BoardBench games');
    board.parts = Object.fromEntries(games);
    for (const game of games.keys()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const byModel = new Map(points(await fetchText(feed + '/games/' + game)).map(p => [p.slug, p.qualityPct]));
      for (const row of rows) {
        const value = byModel.get(row.link.split('/').pop()!);
        if (value === undefined) throw new Error('Missing ' + game + ' score for ' + row.model);
        row.metrics[game] = value;
      }
    }
    return rows;
  },
};
export default board;
