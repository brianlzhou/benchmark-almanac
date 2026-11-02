// GameDevBench (CMU, ICML 2026). The leaderboard on waynechi.com/gamedevbench/ is a static HTML bar chart,
// not a table: each `gdb-bar-row` holds the rank, the model with its reasoning effort ("claude-opus-5.5
// (xhigh)"), the agent harness in brackets ("[Claude Code]") and the score ("70.6% ±4.9", the task success
// rate with a confidence interval). The percentage is the score; the effort becomes the setting through the
// resolver and the bracketed agent the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

const PAGE = 'https://waynechi.com/gamedevbench/';

const board: Leaderboard = {
  benchmark: 'gamedevbench',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (static HTML bar chart, gdb-bar-row)`,
  terms: 'Static page on the author’s GitHub Pages site (robots.txt allows it) with no terms of its own; the GameDevBench repository is MIT-licensed.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];
    for (const m of html.matchAll(/<div class="gdb-bar-row[^"]*">([\s\S]*?)<div class="gdb-bar-score">([\s\S]*?)<\/div>/g)) {
      const model = text(m[1].match(/<span class="gdb-model-name">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const harness = text(m[1].match(/<span class="harness">\[([\s\S]*?)\]<\/span>/)?.[1] ?? '');
      const score = num(text(m[2]).split('±')[0]);
      if (model && score !== undefined) rows.push({ model, score, harness: harness || undefined });
    }
    if (!rows.length) throw new Error('no GameDevBench rows');
    return rows;
  },
};
export default board;
