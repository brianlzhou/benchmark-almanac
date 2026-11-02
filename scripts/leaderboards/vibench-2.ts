// ViBench 2.0 (Replit). vibench.ai is a Vite app whose bundle (/assets/index-<hash>.js) carries the results
// tables as rendered HTML. The "SII leaderboard" table holds the official Fireworks runs on all 17 products
// (4 builds each); its rows are <tr data-pass data-plan data-cost data-time data-testid="row-model-N">. The
// score is Pass@1 (data-pass), the share of builds passing every test plan, the board's headline; cost is
// the model's US dollar cost per build. The second table (rows "row-gen-N", Replit's own runs of older
// GPT models on the 8 public products only) is a different task subset and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const SITE = 'https://vibench.ai';

const board: Leaderboard = {
  benchmark: 'vibench-2',
  url: `${SITE}/`,
  feed: `${SITE}/assets/index-<hash>.js (SII leaderboard rows, data-pass)`,
  terms: 'Public site bundle; robots.txt allows every path and the site states no terms of its own.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(`${SITE}/`);
    const js = html.match(/\/assets\/index-[\w-]+\.js/)?.[0];
    if (!js) throw new Error('ViBench bundle not found');
    const bundle = await fetchText(`${SITE}${js}`);
    const rows: LeaderboardRow[] = [];
    for (const m of bundle.matchAll(/<tr data-pass="([\d.]+)"[^>]*?data-cost="([\d.]+)"[^>]*data-testid="row-model-\d+">([\s\S]*?)<\/tr>/g)) {
      const cell = m[3].match(/<span class="vb-rm">([\s\S]*?)<\/th>/)?.[1] ?? '';
      const model = text(cell.replace(/<span class="vb-rlogo">[\s\S]*?<\/span>/, ''));
      if (model) rows.push({ model, score: Number(m[1]), cost: Number(m[2]) });
    }
    if (!rows.length) throw new Error('no SII leaderboard rows in the ViBench bundle');
    return rows;
  },
};
export default board;
