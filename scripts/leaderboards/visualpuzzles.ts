// VisualPuzzles (CMU NeuLab). The project page builds its interactive leaderboard in the browser from
// data.json next to the page: per model its type (proprietary, open or human), size and accuracy by
// category and difficulty, plus overall. overall.overall (0 to 100) is the page's sort and the score. The
// human percentile rows are skipped. "GPT-4o (2024-08-06)" passes its snapshot date on to the resolver.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://neulab.github.io/VisualPuzzles/data.json';

interface Split {
  algorithmic?: number;
  analogical?: number;
  deductive?: number;
  inductive?: number;
  spatial?: number;
  overall?: number;
}

interface Entry {
  model: string;
  model_type?: string;
  size?: string;
  easy?: Split;
  medium?: Split;
  hard?: Split;
  overall?: Split;
}

const CATEGORIES: [keyof Split, string][] = [
  ['algorithmic', 'Algorithmic'],
  ['analogical', 'Analogical'],
  ['deductive', 'Deductive'],
  ['inductive', 'Inductive'],
  ['spatial', 'Spatial'],
];

const DIFFICULTIES: [keyof Pick<Entry, 'easy' | 'medium' | 'hard'>, string][] = [
  ['easy', 'Easy'],
  ['medium', 'Medium'],
  ['hard', 'Hard'],
];

const board: Leaderboard = {
  benchmark: 'visualpuzzles',
  url: 'https://neulab.github.io/VisualPuzzles/',
  feed: `${FEED} (overall.overall)`,
  terms: 'JSON file on the VisualPuzzles GitHub Pages site that the page loads; the page states no terms.',
  parts: {
    ...Object.fromEntries(CATEGORIES.map(([k, name]) => [k, { name, group: 'Category', unit: '%' as const }])),
    ...Object.fromEntries(DIFFICULTIES.map(([k, name]) => [k, { name, group: 'Difficulty', unit: '%' as const }])),
  },
  aliases: {
    'Gemini-3-pro-preview': 'gemini-3-pro',
    'Claude-4-Sonnet': 'claude-sonnet-4',
    // the only 13B and 34B LLaVA 1.6 models in the registry
    'LLaVA-1.6-13B': 'llava-v1-6-vicuna-13b',
    'LLaVA-1.6-34B': 'llava-v1-6-34b',
    'LLaVA-OV-72B': 'llava-onevision-72b',
    'LLaVA-OV-0.5B': 'llava-onevision-0-5b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const e of await fetchJson<Entry[]>(FEED)) {
      const score = e.overall?.overall;
      if (!e.model || e.model_type === 'human' || typeof score !== 'number') continue;
      let model = e.model.trim();
      const stamp = model.match(/\s*\((\d{4}-\d\d-\d\d)\)$/);
      if (stamp) model = model.slice(0, stamp.index);
      // "Claude-3.7-Sonnet-thinking", "Gemini-2.0-flash-thinking": the mode becomes the setting
      const thinking = /-thinking$/i.test(model);
      if (thinking) model = model.replace(/-thinking$/i, '');
      const open = e.model_type === 'open' ? true : e.model_type === 'proprietary' ? false : undefined;
      const sizeMatch = e.size?.match(/^(\d+(?:\.\d+)?)B$/i);
      const params = sizeMatch ? Number(sizeMatch[1]) : undefined;
      const metrics: Record<string, number> = {};
      for (const [k] of CATEGORIES) {
        const v = e.overall?.[k];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      for (const [k] of DIFFICULTIES) {
        const v = e[k]?.overall;
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      rows.push({
        model,
        score,
        setting: thinking ? 'thinking' : undefined,
        date: stamp?.[1],
        ...(open === undefined ? {} : { open }),
        ...(params !== undefined ? { params } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
