// Reads both official tables and keeps category scores as metrics, never as separate overall scores.
// Video-MMMU. videommmu.github.io is a static page with one leaderboard table: Overall accuracy, the
// knowledge-gain delta, and the Perception, Comprehension and Adaptation tracks. Overall is the score. The
// human baseline row (class human-row) is skipped. The header merges Overall and the delta in one cell; body
// rows keep them apart, so Overall is the second body cell. Some rows (GPT-5-thinking, Gemini 2.5 Pro, o3) give only
// an overall score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const PAGE = 'https://videommmu.github.io/';
const README = 'https://raw.githubusercontent.com/EvolvingLMMs-Lab/VideoMMMU/HEAD/README.md';

const board: Leaderboard = {
  benchmark: 'video-mmmu',
  url: PAGE,
  feed: `${PAGE} + ${README} (Overall, union of official tables)`,
  terms: 'Static GitHub Pages site that states no license or terms; the VideoMMMU repository states no standard license.',
  aliases: {
    'GPT-5-thinking': 'gpt-5',
    'OpenAI O3': 'o3',
    'Gemini-2.5-Pro': 'gemini-2-5-pro-jun-2025',
    // the paper's January 2025 runs, through the API aliases of that time
    'Claude-3.5-Sonnet': 'claude-3-5-sonnet-october-2024',
    'GPT-4o': 'gpt-4o-aug-2024',
    'Gemini 1.5 Pro': 'gemini-1-5-pro-sept-2024',
    'Gemini 1.5 Flash': 'gemini-1-5-flash-sep-2024',
    'LLaVA-OneVision-72B': 'llava-onevision-72b',
    'LLaVA-Video-72B': 'llava-video-72b-qwen2',
    'LLaVA-Video-7B': 'llava-video-7b-qwen2',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const [t] = tables(html);
    const head = t?.[0]?.map((c) => c.text);
    if (!head || head[0] !== 'Model' || !/^Overall\b/.test(head[1] ?? '')) throw new Error(`unexpected Video-MMMU header: ${head?.join(' | ')}`);
    // the row classes mark the human baseline; read them in table order alongside the cells
    const classes = [...html.match(/<table\b[\s\S]*?<\/table>/i)![0].matchAll(/<tr\b([^>]*)>/gi)].map((m) => m[1]);
    const rows: LeaderboardRow[] = [];
    t.forEach((r, i) => {
      if (i === 0 || /human-row/.test(classes[i] ?? '')) return;
      const score = num(r[1]?.text);
      if (r[0]?.text && score !== undefined) {
        const metrics: Record<string, number> = {};
        for (const [key, index] of [['knowledgeGain', 2], ['perception', 3], ['comprehension', 4], ['adaptation', 5]] as const) {
          const value = num(r[index]?.text);
          if (value !== undefined) metrics[key] = value;
        }
        rows.push({ model: r[0].text, score, ...(Object.keys(metrics).length ? { metrics } : {}) });
      }
    });
    // The README adds Keye-VL before the project page. Merge by exact display name, retaining page rows.
    const readme = markdownTables(await fetchText(README)).find(t => t[0]?.[0] === 'Model' && t[0]?.[1].startsWith('Overall'));
    if (!readme) throw new Error('Video-MMMU README leaderboard missing');
    for (const r of readme.slice(1)) {
      const score = num(r[1]?.split('\\|')[0]);
      if (!r[0] || score === undefined || rows.some(x => x.model === r[0])) continue;
      const metrics: Record<string, number> = {};
      for (const [key, index] of [['perception', 2], ['comprehension', 3], ['adaptation', 4]] as const) {
        const value = num(r[index]);
        if (value !== undefined) metrics[key] = value;
      }
      rows.push({ model: r[0], score, metrics });
    }
    return rows;
  },
};
export default board;
