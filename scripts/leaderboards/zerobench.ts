// ZeroBench. zerobench.github.io is a static page whose first table is the official leaderboard (models
// the ZeroBench team evaluated): pass@1, pass@5 and pass^5 on the 100 main questions, then mean cost and
// mean total tokens per question. The table's default sort is pass@5, so that is the score. The page
// publishes no data file (its chart data is embedded in the same HTML), so the importer reads the table.
// Tokens are total (input and output), not output tokens, so they are not kept. The "externally
// reported" and "release" tables are not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://zerobench.github.io/';

const board: Leaderboard = {
  benchmark: 'zerobench',
  url: PAGE,
  feed: `${PAGE} (static HTML, official leaderboard table, pass@5)`,
  terms: 'Static GitHub Pages site that states no licence or terms; the ZeroBench repository is MIT.',
  aliases: {
    'Claude 3.5 Sonnet v2': 'claude-3-5-sonnet-october-2024',
    'Claude Sonnet 3.7': 'claude-3-7-sonnet',
    // the only Gemini 2.0 Flash Thinking in the registry; plain "Gemini 2 Flash" stays unmatched because
    // the page does not say whether the December experimental or the February release was run
    'Gemini 2 Flash Thinking': 'gemini-2-0-flash-thinking-jan-2025',
    'Qwen2-VL-72B-Instruct': 'qwen2-vl-72b-instruct',
    'Pixtral-Large': 'pixtral-large',
  },
  async fetch() {
    const [official] = tables(await fetchText(PAGE));
    const head = official?.[1]?.map((c) => c.text.replace(/\s+$/, ''));
    if (!head || head[0] !== 'Model' || head[2] !== 'pass@5' || head[4] !== 'cost') throw new Error(`unexpected ZeroBench header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of official.slice(2)) {
      const score = num(r[2]?.text);
      if (!r[0]?.text || score === undefined) continue;
      rows.push({ model: r[0].text, score, cost: num(r[4]?.attrs['data-sort']) });
    }
    return rows;
  },
};
export default board;
