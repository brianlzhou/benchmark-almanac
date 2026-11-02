// Political Science LLM Benchmark (Hanno Hilbig, UC Davis). hannohilbig.com/llm-benchmark/ shows its
// results as SVG figures. The "Overall performance, all models" figure (figures/fig-mean-f1.svg) is drawn
// with text: each model's name on the left and its mean F1 across the 33 coding tasks printed at the right
// of the same row. Names and values are paired by their y position. The score is mean F1 x 100. Open-weight
// rows name the precision and GPU count in parentheses ("(FP8)", "(2 GPUs)"), which becomes the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const PAGE = 'https://www.hannohilbig.com/llm-benchmark/';
const FEED = `${PAGE}figures/fig-mean-f1.svg`;

const board: Leaderboard = {
  benchmark: 'political-science-llm-benchmark',
  url: PAGE,
  feed: `${FEED} (row labels and mean F1 values)`,
  terms: 'Figure file on a personal academic site; robots.txt allows every path and the site states no terms.',
  aliases: {
    'Qwen 1.5 32B Chat': 'qwen1-5-32b-chat',
    'Qwen 2.5 72B Instruct': 'qwen2-5-72b-instruct',
    'Qwen 2.5 32B Instruct': 'qwen2-5-32b-instruct',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const svg = await fetchText(FEED);
    const items = [...svg.matchAll(/<text x='([\d.]+)' y='([\d.]+)'[^>]*>([^<]+)<\/text>/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), s: text(m[3]) }));
    const values = items.filter((e) => /^0\.\d+$/.test(e.s));
    const valueX = Math.max(...values.map((v) => v.x));
    const rows: LeaderboardRow[] = [];
    for (const n of items.filter((e) => e.x < valueX - 50 && /[A-Za-z]/.test(e.s) && !/^Mean F1/.test(e.s))) {
      const v = values.find((e) => e.x === valueX && Math.abs(e.y - n.y) < 2);
      if (!v) continue;
      const tags = [...n.s.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].toLowerCase());
      rows.push({ model: n.s.replace(/\s*\([^)]*\)/g, '').trim(), score: Number(v.s) * 100, setting: tags.join(', ') || undefined });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} rows read from the figure`);
    return rows;
  },
};
export default board;
