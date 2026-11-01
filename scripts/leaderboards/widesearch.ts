// WideSearch. widesearch-seed.github.io is a static page with one leaderboard table, sorted by Success Rate
// (Avg@4): the share of tasks whose whole output table is correct, averaged over four runs. That is the
// score here. The table also gives Row F1 and Item F1. Labs now often report mean Item F1, which runs far
// higher, so lab claims and these rows are different metrics. The Agent Type column (Single Agent,
// Multi-Agent, E2E System) is kept as the harness. The table has not changed since August 2025.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://widesearch-seed.github.io/';

const board: Leaderboard = {
  benchmark: 'widesearch',
  url: PAGE,
  feed: `${PAGE} (static HTML table, SR Avg@4)`,
  terms: 'Static GitHub Pages site that states no licence or terms; the WideSearch repository is MIT.',
  aliases: {
    'OpenAI o3': 'o3',
    // the July 2025 model, the only Kimi K2 when the board was made
    'Kimi K2': 'kimi-k2-jul-2025',
    // the January 2025 model (the board predates DeepSeek-R1-0528 being named separately)
    'DeepSeek-R1': 'deepseek-r1',
    'Gemini 2.5 Pro': 'gemini-2-5-pro-jun-2025',
  },
  async fetch() {
    const [t] = tables(await fetchText(PAGE));
    const head = t?.[0]?.map((c) => c.text);
    if (!head || !/^Model/.test(head[0]) || head[2] !== 'SR (Avg@4)') throw new Error(`unexpected WideSearch header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const score = num(r[2]?.text);
      if (!r[0]?.text || score === undefined) continue;
      rows.push({ model: r[0].text, harness: r[1]?.text || undefined, score });
    }
    return rows;
  },
};
export default board;
