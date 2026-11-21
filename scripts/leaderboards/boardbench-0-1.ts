// BoardBench scores the share of decisions matching the game engine. Its quality versus cost chart includes every reasoning setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt, nextFlight } from '../lib/html.ts';

const feed = "https://boardbench.dev/v/0.1";

const board: Leaderboard = {
  benchmark: "boardbench-0-1",
  url: "https://boardbench.dev/v/0.1",
  feed,
  terms: "The maker gives no reuse license on the leaderboard or methodology page. https://boardbench.dev/methodology The feed host publishes robots.txt at https://boardbench.dev/robots.txt.",
  async fetch() {
    type Point = { slug: string; className: string; effort: string; costUsd: number; qualityPct: number };
    const source = nextFlight(await fetchText(feed));
    const match = /"points":(?=\[\{"slug":)/.exec(source);
    if (!match) throw new Error('Missing quality versus cost chart');
    const points = jsonAt<Point[]>(source, match.index + match[0].length);
    if (points.length < 12) throw new Error('Incomplete BoardBench chart');
    return points.map(p => {
      if (!p.className || !p.effort || !Number.isFinite(p.qualityPct) || !Number.isFinite(p.costUsd)) throw new Error('Invalid chart point');
      return { model: p.className, setting: p.effort, score: p.qualityPct, cost: p.costUsd, link: feed + '/models/' + p.slug };
    });
  },
};
export default board;
