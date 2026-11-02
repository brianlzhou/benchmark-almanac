// PaintBench (NYU). paintbench.github.io fills its results table from assets/js/main.js, whose
// `const MODELS_HM` array holds per model the mean IoU (0 to 100) on each of the 20 editing operations and
// `overall`, the headline column of the table. The array is read as data with jsLiteral, never run, and
// overall is the score. The table dates from the paper (arXiv 2606.00188, June 2026), so rows carry the
// first of that month.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://paintbench.github.io/';
const FEED = `${PAGE}assets/js/main.js`;
const PAPER_DATE = '2026-06-01';

const board: Leaderboard = {
  benchmark: 'paintbench',
  url: PAGE,
  feed: `${FEED} (const MODELS_HM, overall)`,
  terms: 'Static script on the PaintBench GitHub Pages site that the page loads (no robots.txt); the page states no terms.',
  aliases: {
    // Nano Banana (1) is Gemini 2.5 Flash Image
    'Nano Banana 1': 'gemini-2-5-flash-image-preview-nano-banana',
    // GPT-Image-2 used through the image edit endpoint
    'GPT Image Edit 2': 'gpt-image-2',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const js = await fetchText(FEED);
    const start = js.indexOf('[', js.indexOf('const MODELS_HM'));
    if (start < 0) throw new Error('MODELS_HM not found');
    const models = jsLiteral<{ name: string; overall?: number }[]>(js, start);
    const rows: LeaderboardRow[] = [];
    for (const m of models) if (m.name && typeof m.overall === 'number') rows.push({ model: m.name, score: m.overall, date: PAPER_DATE });
    if (!rows.length) throw new Error('no PaintBench rows');
    return rows;
  },
};
export default board;
