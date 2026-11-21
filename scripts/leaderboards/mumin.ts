// MuMiN ranks systems by macro F1 over claim and tweet classification. The leaderboard averages the three graph sizes within each task before averaging the tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://mumin-dataset.github.io/leaderboard/";

const board: Leaderboard = {
  benchmark: "mumin",
  url: "https://mumin-dataset.github.io/leaderboard/",
  feed,
  terms: "The publisher does not specify separate score reuse terms in the supplied source. The feed host publishes robots.txt at https://mumin-dataset.github.io/robots.txt.",
  parts: {"claim": "Claim", "tweet": "Tweet", "claim-small": "Claim-small", "claim-medium": "Claim-medium", "claim-large": "Claim-large", "tweet-small": "Tweet-small", "tweet-medium": "Tweet-medium", "tweet-large": "Tweet-large"},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.some(c => c.text === 'Overall score'));
    if (!table || table.length < 5) throw new Error('Incomplete MuMiN standings');
    return table.slice(1).map(cells => {
      const metrics: Record<string, number> = {};
      for (const task of ['claim', 'tweet']) {
        let mean = 0;
        for (const size of ['small', 'medium', 'large']) {
          const value = Number.parseFloat(cells.find(c => c.attrs.class === task + ' ' + size)?.text ?? '');
          if (!Number.isFinite(value)) throw new Error('Missing task score');
          metrics[task + '-' + size] = value;
          mean += value / 3;
        }
        metrics[task] = Number(mean.toFixed(2));
      }
      const score = Number(((metrics.claim + metrics.tweet) / 2).toFixed(2));
      return { model: cells[0].text, score, metrics, link: cells[1].html.match(/href="([^"]+)"/)?.[1] };
    });
  },
};
export default board;
