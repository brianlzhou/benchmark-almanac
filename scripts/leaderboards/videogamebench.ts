// VideoGameBench. vgbench.com is a static page with two leaderboard tables, Full (the default tab) and Lite
// (the game pauses while the model thinks). The Full table is read: per entry "VG-Agent + <model> (<API
// model id>)", the Overall Score (percent of game progress, 0 to 100) and per-game scores. Overall Score is
// the score, the API model id in parentheses names the model, and VG-Agent is the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://vgbench.com/';

const board: Leaderboard = {
  benchmark: 'videogamebench',
  url: URL,
  feed: `${URL} (Full leaderboard table, Overall Score)`,
  terms: 'Static project page; vgbench.com has no robots.txt and publishes no terms of use.',
  aliases: {
    'gemini-2.5-pro-preview-03-25': 'gemini-2-5-pro-mar-2025',
    'llama-4-maverick-17B-128E-Instruct-FP8': 'llama-4-maverick',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Overall Score'));
    if (!t) throw new Error('VideoGameBench leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iScore] = [head.indexOf('Model'), head.indexOf('Overall Score')];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const cell = r[iModel]?.text ?? '';
      const m = cell.match(/^(.*?)\s*\+\s*(.*?)\s*(?:\(([^)]+)\))?$/);
      const score = num(r[iScore]?.text);
      if (!m || score === undefined) continue;
      rows.push({ model: m[3] ?? m[2], score, harness: m[1] });
    }
    return rows;
  },
};
export default board;
