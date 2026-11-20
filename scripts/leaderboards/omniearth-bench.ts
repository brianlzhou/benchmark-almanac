// Published Avg. over Earth-science domains.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = "https://omniearth-bench.github.io/";
const board: Leaderboard = {
  benchmark: "omniearth-bench", parts: {
  crossSphere: { name: 'Cross sphere', group: 'Domain' },
  atmosphere: { name: 'Atmosphere', group: 'Domain' },
  lithosphere: { name: 'Lithosphere', group: 'Domain' },
  oceansphere: { name: 'Oceansphere', group: 'Domain' },
  cryosphere: { name: 'Cryosphere', group: 'Domain' },
  biosphere: { name: 'Biosphere', group: 'Domain' },
  humanActivities: { name: 'Human activities', group: 'Domain' },
}, url: URL, feed: URL,
  terms: "CC BY-NC-SA 4.0 repository; no robots.txt on the maker site.",
  async fetch() {
    const table = tables(await fetchText(URL)).map(t => t.map(r => r.map(c => c.text))).find(t => t[0]?.some(c => c.includes("Avg.")));
    if (!table) throw new Error('Overall table missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[8]);
      if (score === undefined || !cells[0]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[1, "crossSphere"], [2, "atmosphere"], [3, "lithosphere"], [4, "oceansphere"], [5, "cryosphere"], [6, "biosphere"], [7, "humanActivities"]] as [number, string][]) {
        const value = num(cells[column]);
        if (value !== undefined) metrics[key] = value;
      }
      out.push({ model: cells[0], score, metrics });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;
