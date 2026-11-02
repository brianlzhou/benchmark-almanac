// Math-VR. math-vr.github.io carries the leaderboard as a static HTML table (GitHub Pages): per model the
// type, a Thinking mark, and answer correctness (AC) and process score (PS) overall and on the text and
// multimodal subsets. Overall (AC), answer correctness on all 5,000 questions, is the score; it is the
// number lab reports quote (Qwen3-VL-235B-A22B-Thinking 66.8). The second table (text-only models on the
// text subset) has no overall column and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://math-vr.github.io/';

const board: Leaderboard = {
  benchmark: 'math-vr',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (static HTML table, Overall (AC))`,
  terms: 'Static project page on GitHub Pages (no robots.txt rules); the Math-VR repository states its license on GitHub.',
  aliases: {
    'GPT-o3': 'o3',
    'Claude Opus4.1': 'claude-opus-4-1',
  },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => c.text === 'Overall (AC)'));
    if (!t) throw new Error('leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const iModel = head.indexOf('Model');
    const iAc = head.indexOf('Overall (AC)');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[iModel]?.text;
      const score = num(r[iAc]?.text);
      if (!model || score === undefined) continue;
      rows.push({ model, score });
    }
    return rows;
  },
};
export default board;
