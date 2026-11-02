// PHYBench. www.phybench.cn is a Vite app: the page's index-<hash>.js lazy-loads leader-board-<hash>.js, which
// imports models-<hash>.js, a JSON.parse('[...]') list of every model with two score families, "eed"
// (expression edit distance) and "acc" (accuracy), each split by physics field with "ALL" as the overall.
// The board switches between "EED Score" and "Accuracy Score"; the score here is Accuracy Score, Overall,
// the paper's headline ("Gemini 2.5 Pro achieves 36.9% accuracy") and the number lab model cards cite.
// The Human Expert row is skipped. The entry's note marks the Gemini 2.5 Pro preview of 2025-03-25.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://www.phybench.cn';
const PAGE = `${SITE}/leaderboard`;

interface Entry {
  name: string;
  id: string;
  note?: string;
  acc: { ALL: number };
}

async function chunk(from: string, pattern: RegExp): Promise<string> {
  const m = from.match(pattern);
  if (!m) throw new Error(`chunk not found: ${pattern}`);
  return fetchText(`${SITE}/assets/${m[1]}`);
}

const board: Leaderboard = {
  benchmark: 'phybench',
  url: PAGE,
  feed: `${SITE}/assets/models-<hash>.js (through index and leader-board chunks; acc.ALL)`,
  terms: 'Public project site; robots.txt is not set (the path returns the app page) and the site publishes no terms.',
  aliases: {
    'Gemini 2.5 pro 0325': 'gemini-2-5-pro-mar-2025',
    'Gemini 2.5 pro': 'gemini-2-5-pro-jun-2025',
    'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025',
    // "qwen3-235b-a22b-2025-04-29" with reasoning forced on
    Qwen3: 'qwen3-235b-a22b',
    'Qwen3 2507': 'qwen3-235b-a22b-thinking-jul-2025',
    'Gemini-3 Pro Preview Thinking': 'gemini-3-pro',
    'Claude-4 Sonnet-Thinking': 'claude-sonnet-4',
    'Claude-3.7 Sonnet-Thinking': 'claude-3-7-sonnet',
    'DeepSeek-R1': 'deepseek-r1-may-2025',
    'DeepSeek-V3': 'deepseek-v3-mar-2025',
    'Kimi K2': 'kimi-k2-jul-2025',
    // qwen-max-2025-01-25, the Qwen2.5-Max release
    'Qwen-max': 'qwen2-5-max',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const index = await chunk(html, /\/assets\/(index\.[\w-]+\.js)/);
    const lb = await chunk(index, /\.\/(leader-board\.[\w-]+\.js)/);
    const models = await chunk(lb, /\.\/(models\.[\w-]+\.js)/);
    const m = models.match(/JSON\.parse\('((?:[^'\\]|\\.)*)'\)/);
    if (!m) throw new Error('model list not found in models chunk');
    const list = JSON.parse(m[1].replace(/\\'/g, "'")) as Entry[];
    const rows: LeaderboardRow[] = [];
    for (const e of list) {
      if (/human/i.test(e.id)) continue;
      const setting = /\((high|low|medium)\)/i.exec(e.name)?.[1]?.toLowerCase() ?? (/thinking/i.test(e.name) ? 'thinking' : undefined);
      rows.push({ model: e.name.replace(/\s*\((high|low|medium)\)\s*$/i, ''), score: e.acc?.ALL, setting });
    }
    return rows;
  },
};
export default board;
