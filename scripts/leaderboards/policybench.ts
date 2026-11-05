// PolicyBench (PolicyEngine): no-tools estimates of US taxes and benefits for 100 households. Each board
// snapshot is published as a GitHub release of PolicyEngine/policybench tagged dashboard-data-YYYYMMDD,
// whose dashboard-data.json asset is the data policybench.org renders. countries.us.modelStats holds one
// row per model (condition no_tools) with exact (share of outputs within $1 of PolicyEngine-US, 0 to 100),
// the page's ranking column and the score here, and costPerHousehold, the cost of one household (task).
// totalTokens counts input and output, so it is not kept. The asset is large (about 140 MB, mostly
// per-scenario predictions), so only the modelStats array is read out of its text.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText, githubHeaders } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const LATEST = 'https://github.com/PolicyEngine/policybench/releases/latest/download/dashboard-data.json';
const RELEASES = 'https://api.github.com/repos/PolicyEngine/policybench/releases?per_page=20';

interface Stat {
  model: string;
  condition?: string;
  exact?: number;
  costPerHousehold?: number | null;
}

const board: Leaderboard = {
  benchmark: 'policybench',
  url: 'https://policybench.org',
  feed: `${LATEST} (countries.us.modelStats; newest dashboard-data-* release)`,
  terms: 'Release asset of the PolicyEngine/policybench repository, which is released under the Unlicense (public domain).',
  aliases: {},
  async fetch() {
    // the newest release is normally the newest dashboard snapshot: read it without the rate-limited API,
    // and list the releases only when the latest one carries no dashboard-data.json
    let text: string;
    try {
      // the dashboard file is about 139 MB: give each attempt 15 minutes, and try twice
      text = await fetchText(LATEST, {}, 2, 900_000);
    } catch {
      const releases = await fetchJson<{ tag_name: string; draft?: boolean; assets: { name: string; browser_download_url: string }[] }[]>(RELEASES, {
        headers: githubHeaders(),
      });
      const latest = releases
        .filter((r) => !r.draft && /^dashboard-data-\d{8}/.test(r.tag_name) && r.assets.some((a) => a.name === 'dashboard-data.json'))
        .sort((a, b) => b.tag_name.localeCompare(a.tag_name))[0];
      if (!latest) throw new Error('no dashboard-data release');
      text = await fetchText(latest.assets.find((a) => a.name === 'dashboard-data.json')!.browser_download_url, {}, 2, 900_000);
    }
    const stats = jsonAfter<Stat[]>(text, '"modelStats":');
    const rows: LeaderboardRow[] = [];
    for (const s of stats) {
      if (s.condition !== 'no_tools' || typeof s.exact !== 'number') continue;
      rows.push({ model: s.model, score: s.exact, cost: s.costPerHousehold ?? undefined });
    }
    return rows;
  },
};
export default board;
