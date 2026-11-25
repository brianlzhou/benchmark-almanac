// BlenderWorld (Alibaba and partners). blenderworld.github.io draws its leaderboard from
// data/site-data.js, a `window.BLENDERWORLD = {...}` JSON object whose `models` list carries per model a rank,
// the overall `score` (out of 100: half rubric, half dimension quality, the column the board ranks by), the
// rubric and dimension parts, and text-only and multimodal splits. The overall score is read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const SITE = 'https://blenderworld.github.io';
const FEED = `${SITE}/data/site-data.js`;

interface BlenderModel {
  name: string;
  score: number;
  text?: number;
  mm?: number;
  rubric?: number;
  dimension?: number;
  perfect?: number;
  turns?: number;
  tokens?: number;
  tools?: number;
  categories?: Record<string, number>;
}

const CAT_MAP = [
  ['architecture', 'Architecture & Interiors'],
  ['art', 'Art & Animation'],
  ['products', 'Products & Manufacturing'],
  ['characters', 'Characters & Animals'],
  ['nature', 'Nature & Landscapes'],
  ['rendering', 'Rendering & Simulation'],
  ['vehicles', 'Vehicles & Machinery'],
  ['procedural', 'Procedural & Game Assets'],
  ['science', 'Science & Visualization'],
] as const;

const board: Leaderboard = {
  benchmark: 'blenderworld',
  parts: {
    text: { name: 'Text-only', group: 'Modality' },
    mm: { name: 'Multimodal', group: 'Modality' },
    rubric: { name: 'Rubric', group: 'Evaluation' },
    dimension: { name: 'Dimension quality', group: 'Evaluation' },
    architecture: { name: 'Architecture & Interiors', group: 'Category' },
    art: { name: 'Art & Animation', group: 'Category' },
    products: { name: 'Products & Manufacturing', group: 'Category' },
    characters: { name: 'Characters & Animals', group: 'Category' },
    nature: { name: 'Nature & Landscapes', group: 'Category' },
    rendering: { name: 'Rendering & Simulation', group: 'Category' },
    vehicles: { name: 'Vehicles & Machinery', group: 'Category' },
    procedural: { name: 'Procedural & Game Assets', group: 'Category' },
    science: { name: 'Science & Visualization', group: 'Category' },
  },
  stats: {
    perfect: { name: 'Perfect tasks', unit: '%', better: 'higher' },
    turns: { name: 'Average turns per task', unit: 'count' },
    tools: { name: 'Average tool calls per task', unit: 'count' },
  },
  url: `${SITE}/`,
  feed: `${FEED} (window.BLENDERWORLD.models, score)`,
  terms: 'Data file on GitHub Pages that the public page loads; robots.txt allows it.',
  aliases: {
    // ByteDance Seed 2.1 Pro, its 2026-09-15 snapshot (the registry has one Seed 2.1 Pro record)
    'Seed2.1pro-0915': 'seed-2-1-pro',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = jsonAfter<{ models: BlenderModel[] }>(await fetchText(FEED), 'window.BLENDERWORLD =');
    return data.models.map((m) => {
      const metrics: Record<string, number> = {};
      for (const k of ['text', 'mm', 'rubric', 'dimension', 'perfect', 'turns', 'tools'] as const) {
        const v = m[k];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      for (const [key, label] of CAT_MAP) {
        const v = m.categories?.[label];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[key] = Number(v.toFixed(2));
      }
      const tokens = typeof m.tokens === 'number' && Number.isFinite(m.tokens) && m.tokens > 0 ? Math.round(m.tokens * 1000) : undefined;
      return {
        model: m.name,
        score: m.score,
        tokens,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      };
    });
  },
};
export default board;
