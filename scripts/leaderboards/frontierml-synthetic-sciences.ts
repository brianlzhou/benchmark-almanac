// FrontierML ranks models by mean normalized score across 25 empirical ML tasks.
// The leaderboard HTML gives the mean and labels each public task. Its footnote identifies public-only runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const url = 'https://frontierml.ai';
const board: Leaderboard = {
  benchmark: 'frontierml-synthetic-sciences', url, feed: url,
  terms: 'Public benchmark results credited to Synthetic Sciences.',
  async fetch() {
    const html = await fetchText(url);
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, string> = {};
    const chart = html.split('class="bd-row bd-r"').slice(1);
    if (chart.length < 5) throw new Error('Incomplete FrontierML chart');
    for (const line of chart) {
      const model = line.match(/<b>([^<]+)<\/b>/)?.[1];
      const mean = line.match(/class="bd-mean"[^>]*>([\d.]+)/)?.[1];
      if (!model || !mean) throw new Error('Missing FrontierML model or mean');
      const metrics: Record<string, number> = {};
      for (const m of line.split('class="bd-mean"')[0].matchAll(/href="\/runs\/([^/]+)\/[^"]+" aria-label="[^"]*? on (.*?): ((?:minus )?[\d.]+)\. Open the run\."/g)) {
        parts[m[1]] = text(m[2]);
        metrics[m[1]] = Number(m[3].replace('minus ', '-'));
      }
      if (Object.keys(metrics).length < 15) throw new Error('Missing FrontierML public task scores');
      // The page marks runs that omit all ten private tasks. Their mean covers a different population.
      if (!line.split('class="bd-mean"')[0].includes('class="bd-dot priv"')) continue;
      rows.push({ model, score: Number(mean), metrics });
    }
    if (rows.length < 4) throw new Error('Missing complete FrontierML runs');
    board.parts = parts;
    return rows;
  },
};
export default board;
