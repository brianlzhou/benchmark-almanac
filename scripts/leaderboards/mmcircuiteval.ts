// MMCircuitEval evaluates circuit understanding. OpenReward publishes the overall percentage and component scores reported in the paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://api.openreward.ai/v1/environments/arXiv/mmcircuiteval/leaderboard";

const board: Leaderboard = {
  benchmark: "mmcircuiteval",
  url: "https://openreward.ai/arXiv/mmcircuiteval",
  feed,
  terms: "OpenReward links to terms that require sign-in. I could not verify permission to redistribute scores. https://openreward.ai/terms The feed host returns no robots.txt.",
  host: 'OpenReward',
  async fetch() {
    type Entry = { model_name: string; published_date: string; paper: { link: string }; metrics: { name: string; value: number }[] };
    const entries = await fetchJson<Entry[]>(feed);
    if (entries.length < 33) throw new Error('Incomplete circuit results');
    board.parts = {};
    return entries.map(r => {
      const metrics = Object.fromEntries(r.metrics.map(m => [m.name, m.value]));
      const score = metrics.Overall;
      delete metrics.Overall;
      if (!r.model_name || !Number.isFinite(score)) throw new Error('Missing overall circuit score');
      for (const name of Object.keys(metrics)) board.parts![name] = name;
      return { model: r.model_name, score, date: r.published_date.slice(0, 10), link: r.paper.link, metrics };
    });
  },
};
export default board;
