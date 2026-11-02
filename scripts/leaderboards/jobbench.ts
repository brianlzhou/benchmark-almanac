// JobBench on job-bench.github.io. The site is a static Next.js export whose results section is a heatmap
// table: one column per model, one row per occupation. Each column header carries a title attribute such as
// "Claude Fable 5 · OpenCode · overall 57.4", which names the model, the agent it ran in and its overall
// score (mean over the 130 tasks, 0 to 100). That title is the headline read here.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const URL = 'https://job-bench.github.io/';

const board: Leaderboard = {
  benchmark: 'jobbench',
  url: URL,
  feed: `${URL} (column header titles of the results heatmap)`,
  terms: 'Static GitHub Pages site with no robots.txt and no terms; the evaluation code is public at github.com/Job-Bench/job-bench-eval.',
  aliases: {},
  async fetch() {
    const html = await fetchText(URL);
    const rows: LeaderboardRow[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(/<th\b[^>]*\btitle="([^"]+?) · ([^"]+?) · overall (\d+(?:\.\d+)?)"/g)) {
      const model = text(m[1]);
      const harness = text(m[2]);
      if (seen.has(`${model}|${harness}`)) continue;
      seen.add(`${model}|${harness}`)
      rows.push({ model, harness, score: Number(m[3]) });
    }
    if (!rows.length) throw new Error('no overall scores in the JobBench heatmap headers')
    return rows;
  },
};
export default board;
