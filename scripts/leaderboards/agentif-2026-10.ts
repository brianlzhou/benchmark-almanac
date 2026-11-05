// AgentIF under its October 2026 setting. agentif.github.io is a static page whose first table is the
// current leaderboard; each row carries data-csr (constraint success rate, 0 to 100, the default sort and
// the score), data-isr (instruction success rate, the share of instructions met in full, kept as metrics.isr)
// and data-mode (thinking or non_thinking, which becomes the setting). The second
// table is the original setting, which the maker keeps for reference and says is not comparable, so it is
// not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const PAGE = 'https://agentif.github.io/';

const board: Leaderboard = {
  benchmark: 'agentif-2026-10',
  url: PAGE,
  feed: `${PAGE} (static HTML, first leaderboard table, data-csr)`,
  terms: 'Static GitHub Pages site that states no terms; the AgentIF code is Apache-2.0 and the dataset CC BY 4.0.',
  aliases: {
    'Nemotron-Nano-9B-v2': 'nvidia-nemotron-nano-9b-v2',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const table = html.match(/<table\b[\s\S]*?<\/table>/)?.[0];
    if (!table) throw new Error('no leaderboard table on the AgentIF page');
    const rows: LeaderboardRow[] = [];
    for (const m of table.matchAll(/<tr\b([^>]*\bdata-csr="([\d.]+)"[^>]*)>([\s\S]*?)<\/tr>/g)) {
      const mode = m[1].match(/data-mode="([^"]+)"/)?.[1];
      const isr = Number(m[1].match(/data-isr="([\d.]+)"/)?.[1]);
      const name = m[3].match(/<strong>([\s\S]*?)<\/strong>/)?.[1];
      if (!name) continue;
      rows.push({
        model: text(name),
        score: Number(m[2]),
        setting: mode ? mode.replace('_', '-') : undefined,
        metrics: Number.isFinite(isr) && m[1].includes('data-isr=') ? { isr } : undefined,
      });
    }
    if (!rows.length) throw new Error('no rows in the AgentIF leaderboard');
    return rows;
  },
};
export default board;
