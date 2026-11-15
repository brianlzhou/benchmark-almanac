// Success rate, version 1; model and agent harness are separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = "https://microsoft.github.io/HealthAgentBench/v1/#leaderboard";
const board: Leaderboard = {
  benchmark: "healthagentbench", url: URL, feed: URL,
  terms: "MIT repository, no robots.txt on the maker site.",
  async fetch() {
    const table = tables(await fetchText(URL)).map(t => t.map(r => r.map(c => c.text))).find(t => t[0]?.some(c => c.includes("Agent")));
    if (!table) throw new Error('Overall table missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[2]);
      if (score === undefined || !cells[1]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [] as [number, string][]) {
        const value = num(cells[column]);
        if (value !== undefined) metrics[key] = value;
      }
      const label = cells[1].match(/^(.+?) \((.+)\)$/);
      if (!label) throw new Error(`Unrecognized agent label: ${cells[1]}`);
      const model = /^(Opus|Sonnet)/.test(label[2]) ? `Claude ${label[2]}` : label[2];
      out.push({ model, harness: label[1], score, cost: num(cells[3]), metrics });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;
