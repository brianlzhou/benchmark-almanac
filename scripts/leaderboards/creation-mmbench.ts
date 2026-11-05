// Creation-MMBench (OpenCompass). open-compass.github.io/Creation-MMBench/ carries the paper's main results
// as a static table: per model, Overall and four task groups, each as VFS (visual factuality, 0 to 10) and
// Reward (judge preference against the GPT-4o-1120 baseline, -100 to 100, baseline 0), plus OC Score and
// average tokens. The table is ordered by Overall Reward, the paper's headline, so that is the score here.
// Avg Tokens, the mean response length (GPT-4o-1120 tokenizer), is kept as tokens.
// A static paper table (arXiv 2503.14478), so rows carry the paper's date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://open-compass.github.io/Creation-MMBench/';
const DATE = '2025-03-18';

const board: Leaderboard = {
  benchmark: 'creation-mmbench',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Overall Reward)`,
  terms: 'Static project page on the OpenCompass GitHub Pages site (no robots.txt); the page states no terms.',
  aliases: {
    'GPT-4o-1120': 'gpt-4o-nov-2024',
    'Gemini-2.0-pro-exp': 'gemini-2-0-pro',
    'Gemini-1.5-pro-002': 'gemini-1-5-pro-sept-2024',
    'GPT-4.5-0227': 'gpt-4-5',
    // the March 2025 paper ran the October 2024 Claude 3.5 Sonnet, the current one at the time
    'Claude-3.5-Sonnet': 'claude-3-5-sonnet-october-2024',
  },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.[0]?.text === 'Model' && rows[0].some((c) => c.text === 'Overall'));
    if (!t || !/^VFS$/.test(t[1]?.[0]?.text ?? '')) throw new Error('Creation-MMBench results table not found');
    const tokensLast = t[0].at(-1)?.text === 'Avg Tokens';
    // Model, the VFS and Reward pairs, OC Score and Avg Tokens
    const width = t[1].length + 3;
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      if (r.length < 4) continue;
      const model = r[0].text.replace(/\s*\[Baseline\]\s*$/i, '').trim();
      // columns: Model, Overall VFS, Overall Reward, ...
      const score = num(r[2].text);
      const tokens = tokensLast && r.length === width ? num(r.at(-1)?.text) : undefined;
      if (model && score !== undefined) rows.push({ model, score, date: DATE, ...(tokens !== undefined ? { tokens } : {}) });
    }
    return rows;
  },
};
export default board;
