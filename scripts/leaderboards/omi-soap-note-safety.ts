// Original SOAP note evaluation, not the newer Omi Guard protocol.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = "https://omi.health/research/note-eval";
const board: Leaderboard = {
  benchmark: "omi-soap-note-safety", parts: {
  safety: { name: 'Safety', group: 'Dimension' },
  coverage: { name: 'Coverage', group: 'Dimension' },
  generalist: { name: 'Generalist', group: 'Dimension' },
  evidence: { name: 'Evidence', group: 'Dimension', note: 'Evidence accuracy supplies 70% of the safety dimension.' },
}, url: URL, feed: URL,
  terms: "Public maker results, robots.txt allows this research path; no additional reading restrictions stated.",
  async fetch() {
    const table = tables(await fetchText(URL)).map(t => t.map(r => r.map(c => c.text))).find(t => t[0]?.some(c => c.includes("Composite")));
    if (!table) throw new Error('Overall table missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[2]);
      if (score === undefined || !cells[1]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[3, "safety"], [4, "evidence"], [5, "coverage"], [6, "generalist"]] as [number, string][]) {
        const value = num(cells[column]);
        if (value !== undefined) metrics[key] = value;
      }
      out.push({ model: cells[1], score, metrics });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;
