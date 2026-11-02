// BalatroBench (Coder's BalatroBot and BalatroLLM). balatrobench.com reads its data from a CDN: a manifest of
// benchmark versions (benchmarks/models/manifest.json) and, for the version marked latest, the default
// strategy's leaderboard.json. Each entry has the model (vendor and name), the run counts, avg_round (the
// average final round reached, the page's ranking column "Round") and run statistics. avg_round is the score
// and the cost per run is the total cost divided by the number of runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://balatrobench.com/';
const CDN = 'https://balatrobench-prod.b-cdn.net/benchmarks/models';

interface Entry {
  run_count?: number;
  avg_round?: number;
  stats?: { cost_total?: number };
  model: { vendor?: string; name: string };
}

const board: Leaderboard = {
  benchmark: 'balatrobench',
  url: PAGE,
  feed: `${CDN}/<latest version>/default/leaderboard.json (avg_round)`,
  terms: 'JSON files on the CDN the balatrobench.com page reads (the site has no robots.txt and states no terms); the BalatroBench code is open source on GitHub.',
  async fetch(): Promise<LeaderboardRow[]> {
    const manifest = await fetchJson<{ versions: { version: string; latest?: boolean }[] }>(`${CDN}/manifest.json`);
    const version = manifest.versions.find((v) => v.latest)?.version ?? manifest.versions.at(-1)?.version;
    if (!version) throw new Error('no BalatroBench version in the manifest');
    const data = await fetchJson<{ entries: Entry[] }>(`${CDN}/${version}/default/leaderboard.json`);
    const rows: LeaderboardRow[] = [];
    for (const e of data.entries) {
      if (!e.model?.name || typeof e.avg_round !== 'number') continue;
      const runs = e.run_count ?? 0;
      rows.push({
        model: e.model.name,
        score: Math.round(e.avg_round * 100) / 100,
        cost: runs && e.stats?.cost_total ? e.stats.cost_total / runs : undefined,
      });
    }
    return rows;
  },
};
export default board;
