// Video-MMMU. videommmu.github.io is a static page with one leaderboard table: Overall accuracy, the
// knowledge-gain delta, and the Perception, Comprehension and Adaptation tracks. Overall is the score. The
// human baseline row (class human-row) is skipped. Some rows (GPT-5-thinking, Gemini 2.5 Pro, o3) give only
// an overall score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://videommmu.github.io/';

const board: Leaderboard = {
  benchmark: 'video-mmmu',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Overall)`,
  terms: 'Static GitHub Pages site that states no licence or terms; the VideoMMMU repository states no standard licence.',
  aliases: {
    'GPT-5-thinking': 'gpt-5',
    'OpenAI O3': 'o3',
    'Gemini-2.5-Pro': 'gemini-2-5-pro-jun-2025',
    // the paper's January 2025 runs, through the API aliases of that time
    'Claude-3.5-Sonnet': 'claude-3-5-sonnet-october-2024',
    'GPT-4o': 'gpt-4o-aug-2024',
    'Qwen-2.5-VL-72B': 'qwen2-5-vl-72b',
    'Gemini 1.5 Pro': 'gemini-1-5-pro-sept-2024',
    'Gemini 1.5 Flash': 'gemini-1-5-flash-sep-2024',
    'LLaVA-OneVision-72B': 'llava-onevision-72b',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const [t] = tables(html);
    const head = t?.[0]?.map((c) => c.text);
    if (!head || head[0] !== 'Model' || head[1] !== 'Overall') throw new Error(`unexpected Video-MMMU header: ${head?.join(' | ')}`);
    // the row classes mark the human baseline; read them in table order alongside the cells
    const classes = [...html.match(/<table\b[\s\S]*?<\/table>/i)![0].matchAll(/<tr\b([^>]*)>/gi)].map((m) => m[1]);
    const rows: LeaderboardRow[] = [];
    t.forEach((r, i) => {
      if (i === 0 || /human-row/.test(classes[i] ?? '')) return;
      const score = num(r[1]?.text);
      if (r[0]?.text && score !== undefined) rows.push({ model: r[0].text, score });
    });
    return rows;
  },
};
export default board;
