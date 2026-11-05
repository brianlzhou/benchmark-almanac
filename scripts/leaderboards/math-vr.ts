// Math-VR. math-vr.github.io carries the leaderboard as a static HTML table (GitHub Pages): per model the
// type, a Thinking mark, and answer correctness (AC) and process score (PS) overall and on the text and
// multimodal subsets. Overall (AC), answer correctness on all 5,000 questions, is the score; it is the
// number lab reports quote (Qwen3-VL-235B-A22B-Thinking 66.8). The second table (text-only models on the
// text subset) has no overall column and is not read. Overall (PS), the process score, is kept as metrics.ps.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://math-vr.github.io/';

const board: Leaderboard = {
  benchmark: 'math-vr',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (static HTML table, Overall (AC))`,
  terms: 'Static project page on GitHub Pages (no robots.txt rules); the HKU-MMLab/Math-VR-CodePlot-CoT repository states no license.',
  aliases: {
    'GPT-o3': 'o3',
    'Claude Opus4.1': 'claude-opus-4-1',
    // the board's Version column names these snapshots
    'Gemini-2.5-Flash': 'gemini-2-5-flash-jun-2025',
    'GPT-4o': 'gpt-4o-nov-2024',
    'Gemma3': 'gemma-3-27b',
    'Nano Banana': 'gemini-2-5-flash-image-preview-nano-banana',
  },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => c.text === 'Overall (AC)'));
    if (!t) throw new Error('leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const iModel = head.indexOf('Model');
    const iAc = head.indexOf('Overall (AC)');
    const iPs = head.indexOf('Overall (PS)');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const name = r[iModel]?.text;
      const score = num(r[iAc]?.text);
      if (!name || score === undefined) continue;
      // "Gemini-2.5-Flash-No-Thinking": the same model with thinking off
      const off = /-No-Thinking$/i.test(name);
      const ps = iPs >= 0 ? num(r[iPs]?.text) : undefined;
      rows.push({ model: off ? name.replace(/-No-Thinking$/i, '') : name, score, setting: off ? 'non-thinking' : undefined, ...(ps === undefined ? {} : { metrics: { ps } }) });
    }
    return rows;
  },
};
export default board;
