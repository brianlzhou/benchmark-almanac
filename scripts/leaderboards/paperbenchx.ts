// PaperBenchX (UniPat AI). The leaderboard on unipat.ai/blog/PaperBenchX is drawn from
// /static/paperbenchx/leaderboard-data.js, a plain data script (`window.PBX_BLOG_LEADERBOARD = {...}`) with
// the paper results on the fixed 93-task cohort: per module (Overall, then each research area) and model,
// the partial score and the full reproduction rate (tasks scored above 90, 0 to 100). The headline is the
// Overall full reproduction rate ("all:full" in module "all"), so that is the score. A harness in the name,
// "GPT-6-Astra (Codex)", becomes the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const PAGE = 'https://unipat.ai/blog/PaperBenchX';
const FEED = 'https://unipat.ai/static/paperbenchx/leaderboard-data.js';

interface Data {
  modules: { id: string; models: { name: string; metrics: Record<string, { score: number }> }[] }[];
}

const board: Leaderboard = {
  benchmark: 'paperbenchx',
  url: PAGE,
  feed: `${FEED} (module "all", all:full)`,
  terms: 'Static data script on unipat.ai; robots.txt allows all paths and the site publishes no terms of use.',
  aliases: {},
  async fetch() {
    const data = jsonAfter<Data>(await fetchText(FEED), 'window.PBX_BLOG_LEADERBOARD =');
    const all = data.modules.find((m) => m.id === 'all');
    if (!all) throw new Error('no Overall module in the PaperBenchX data');
    const rows: LeaderboardRow[] = [];
    for (const m of all.models) {
      const score = m.metrics['all:full']?.score;
      if (typeof score !== 'number') continue;
      const harness = m.name.match(/\s*\(([^)]+)\)$/);
      rows.push({ model: harness ? m.name.slice(0, harness.index).trim() : m.name, score, harness: harness?.[1] });
    }
    return rows;
  },
};
export default board;
